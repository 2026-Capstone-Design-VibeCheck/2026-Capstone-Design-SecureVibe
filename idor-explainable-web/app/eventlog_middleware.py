"""
SecureVibe API event-log middleware

FastAPI/Starlette middleware that writes one JSON object per line (JSONL).
The output format is compatible with the current SecureVibe/Links2CPN pipeline:

{
  "method": "GET",
  "uri": "/api/users/user2",
  "statusCode": 200,
  "ip": "user1",
  "headerAuthorization": "Bearer ...",
  "requestBody": {}
}

Usage in FastAPI:

    from fastapi import FastAPI
    from eventlog_middleware import EventLogMiddleware

    app = FastAPI()
    app.add_middleware(
        EventLogMiddleware,
        log_file="api-events.jsonl",
        include_prefixes=("/api",),
    )

The middleware logs completed requests. It also logs requests that fail with an
unhandled exception as statusCode=500, then re-raises the exception.
"""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from starlette.datastructures import Headers, MutableHeaders
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp


class EventLogMiddleware(BaseHTTPMiddleware):
    """Record HTTP requests and responses in SecureVibe JSONL format."""

    def __init__(
        self,
        app: ASGIApp,
        log_file: str | os.PathLike[str] = "api-events.jsonl",
        include_prefixes: Optional[Iterable[str]] = None,
        exclude_paths: Optional[Iterable[str]] = None,
        actor_headers: Iterable[str] = (
            "x-user-id",
            "x-actor-id",
            "x-user",
            "x-forwarded-user",
        ),
        max_body_bytes: int = 1_000_000,
        redact_body_fields: Iterable[str] = (
            "password",
            "passwd",
            "secret",
            "client_secret",
            "access_token",
            "refresh_token",
        ),
    ) -> None:
        super().__init__(app)
        self.log_file = Path(log_file)
        self.include_prefixes = tuple(include_prefixes or ())
        self.exclude_paths = set(exclude_paths or ())
        self.actor_headers = tuple(h.lower() for h in actor_headers)
        self.max_body_bytes = max_body_bytes
        self.redact_body_fields = {f.lower() for f in redact_body_fields}
        self._write_lock = threading.Lock()

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        if not self._should_log(request.url.path):
            return await call_next(request)

        request_body = await self._read_request_body(request)
        request = self._restore_request_body(request, request_body)

        try:
            response = await call_next(request)
        except Exception:
            event = self._build_event(
                request=request,
                status_code=500,
                request_body=request_body,
            )
            self._append_event(event)
            raise

        event = self._build_event(
            request=request,
            status_code=response.status_code,
            request_body=request_body,
        )
        self._append_event(event)
        return response

    def _should_log(self, path: str) -> bool:
        if path in self.exclude_paths:
            return False
        if not self.include_prefixes:
            return True
        return any(path == prefix or path.startswith(prefix + "/") for prefix in self.include_prefixes)

    async def _read_request_body(self, request: Request) -> dict[str, Any]:
        """Read JSON objects while always returning {} for empty/non-JSON bodies."""
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > self.max_body_bytes:
            return {}

        raw = await request.body()
        if not raw or len(raw) > self.max_body_bytes:
            return {}

        content_type = request.headers.get("content-type", "").lower()
        if "json" not in content_type:
            return {}

        try:
            value = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {}

        if not isinstance(value, dict):
            return {"_body": value}
        return self._redact(value)

    @staticmethod
    def _restore_request_body(request: Request, body: dict[str, Any]) -> Request:
        """BaseHTTPMiddleware can consume the body; restore it for downstream handlers."""
        # The request body has already been read by request.body(). Starlette caches
        # it in request._body, so downstream FastAPI handlers can read it normally.
        return request

    def _build_event(
        self,
        request: Request,
        status_code: int,
        request_body: dict[str, Any],
    ) -> dict[str, Any]:
        uri = self._normalized_uri(request)
        authorization = request.headers.get("authorization", "")

        return {
            "method": request.method.upper(),
            "uri": uri,
            "statusCode": int(status_code),
            "ip": self._actor(request),
            "headerAuthorization": authorization,
            # Always include requestBody. Links2CPN previously failed on None.
            "requestBody": request_body or {},
        }

    def _actor(self, request: Request) -> str:
        for name in self.actor_headers:
            value = request.headers.get(name)
            if value:
                return value

        # Optional fallback for tests that send the actor in query parameters.
        for key in ("user_id", "userId", "actor", "username"):
            value = request.query_params.get(key)
            if value:
                return value

        # Do not call this field IP in the implementation: the existing pipeline
        # uses it as a test-actor identifier, but the actual client IP is useful
        # when no actor header is available.
        return request.client.host if request.client else "unknown"

    @staticmethod
    def _normalized_uri(request: Request) -> str:
        """Keep the API prefix and query string in a stable form."""
        split = urlsplit(str(request.url))
        query = urlencode(parse_qsl(split.query, keep_blank_values=True))
        return urlunsplit(("", "", split.path, query, ""))

    def _redact(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {
                key: "[REDACTED]" if key.lower() in self.redact_body_fields else self._redact(item)
                for key, item in value.items()
            }
        if isinstance(value, list):
            return [self._redact(item) for item in value]
        return value

    def _append_event(self, event: dict[str, Any]) -> None:
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        line = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
        with self._write_lock:
            with self.log_file.open("a", encoding="utf-8") as file:
                file.write(line + "\n")


class RotatingEventLogMiddleware(EventLogMiddleware):
    """Variant with a simple size-based rotation for long-running test servers."""

    def __init__(self, *args: Any, max_log_bytes: int = 10_000_000, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.max_log_bytes = max_log_bytes

    def _append_event(self, event: dict[str, Any]) -> None:
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        with self._write_lock:
            if self.log_file.exists() and self.log_file.stat().st_size >= self.max_log_bytes:
                backup = self.log_file.with_suffix(self.log_file.suffix + ".1")
                if backup.exists():
                    backup.unlink()
                self.log_file.replace(backup)
            line = json.dumps(event, ensure_ascii=False, separators=(",", ":"))
            with self.log_file.open("a", encoding="utf-8") as file:
                file.write(line + "\n")
