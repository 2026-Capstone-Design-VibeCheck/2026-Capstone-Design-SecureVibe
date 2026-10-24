from __future__ import annotations

"""Two-stage BOLA/IDOR detector with canonical OpenAPI route matching.

Important: HTTP dynamic evidence and Links2CPN conformance evidence are kept
separate. A Links2CPN model miss must not erase a successful HTTP observation.
"""

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from .bola_idor_detector import OpenAPIResourceIDDetector, load_openapi_file

HTTP_LINE = re.compile(r"\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)\s+(\S+)\s+([1-5]\d\d)(?:\s+(.*))?$", re.I)
LINE_NOT_IN_MODEL = re.compile(r"Line\s+(\d+)\s+is\s+not\s+present\s+in\s+the\s+model", re.I)
LINE_FIRE_ERROR = re.compile(r"Fire\s+error,\s*Line\s+(\d+)", re.I)
NOT_IN_MODEL = "not present in the model"
HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"}


def path_only(value: str) -> str:
    value = str(value or "")
    if value.startswith("http://") or value.startswith("https://"):
        value = urlsplit(value).path
    value = value.split("?", 1)[0]
    value = re.sub(r"/{2,}", "/", value)
    if not value.startswith("/"):
        value = "/" + value
    if len(value) > 1:
        value = value.rstrip("/")
    return value


def template_to_regex(template: str) -> re.Pattern[str]:
    parts = path_only(template).strip("/").split("/") if path_only(template).strip("/") else []
    expression = []
    for part in parts:
        if part.startswith("{") and part.endswith("}"):
            expression.append(r"[^/]+")
        else:
            expression.append(re.escape(part))
    return re.compile(r"^/" + "/".join(expression) + r"/?$", re.I)


def endpoint_matches(template: str, observed: str) -> bool:
    return bool(template_to_regex(template).match(path_only(observed)))


def load_event_log_events(event_log: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    with open(event_log, "r", encoding="utf-8-sig") as file:
        logical_line = 0
        for source_line, raw_line in enumerate(file, start=1):
            line = raw_line.strip()
            if not line:
                continue
            record = json.loads(line)
            logical_line += 1
            body = record.get("responseBody", record.get("response_body"))
            status = record.get("statusCode", record.get("status_code", 0))
            try:
                status = int(status)
            except (TypeError, ValueError):
                status = 0
            events.append({
                "line": logical_line,
                "source_line": source_line,
                "method": str(record.get("method", "")).upper(),
                "path": path_only(record.get("uri", record.get("path", ""))),
                "uri": str(record.get("uri", record.get("path", ""))),
                "status_code": status,
                "latency": "",
                "present_in_model": None,
                "raw": line,
                "openapi_path": record.get("openapiPath", record.get("openapi_path")),
                "operation_id": record.get("operationId", record.get("operation_id")),
                "response_body": body,
            })
    return events


def parse_replay_output(text: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for output_line_number, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        match = LINE_NOT_IN_MODEL.search(line)
        if match:
            results.append({"output_line": output_line_number, "replay_line": int(match.group(1)), "present_in_model": False, "error_type": "not-present-in-model", "raw": line})
            continue
        match = LINE_FIRE_ERROR.search(line)
        if match:
            results.append({"output_line": output_line_number, "replay_line": int(match.group(1)), "present_in_model": False, "error_type": "fire-error", "raw": line})
            continue
        match = HTTP_LINE.search(line)
        if match:
            method, path, status, latency = match.groups()
            results.append({"output_line": output_line_number, "method": method.upper(), "path": path_only(path), "status_code": int(status), "latency": latency or "", "present_in_model": NOT_IN_MODEL not in line.lower(), "raw": line})
    return results


def merge_replay_results(event_log: str, replay_output: str) -> list[dict[str, Any]]:
    events = load_event_log_events(event_log)
    parsed = parse_replay_output(replay_output)
    by_line: dict[int, list[dict[str, Any]]] = {}
    for result in parsed:
        line_number = result.get("replay_line")
        if isinstance(line_number, int):
            by_line.setdefault(line_number, []).append(result)
    merged = []
    for event in events:
        item = dict(event)
        line_results = by_line.get(event["line"], [])
        item["cpn_status"] = "not-present-in-model"
        if line_results:
            item["present_in_model"] = any(x.get("present_in_model") is True for x in line_results)
            errors = [x.get("error_type") for x in line_results if x.get("error_type")]
            if errors:
                item["replay_error_type"] = errors[-1]
                item["cpn_status"] = errors[-1]
            item["replay_raw"] = [x.get("raw", "") for x in line_results]
        else:
            item["present_in_model"] = None
            item["cpn_status"] = "no-replay-line"
        merged.append(item)
    return merged


def run_links2cpn(repository: str, openapi_file: str, event_log: str, python_executable: str | None = None, timeout: int = 300) -> dict[str, Any]:
    repo = Path(repository).resolve()
    script = repo / "src" / "openapiLinks2CPNs" / "execute_replay.py"
    if not script.is_file():
        raise FileNotFoundError(f"Links2CPN entry point not found: {script}")
    py = python_executable or shutil.which("python")
    if not py:
        raise RuntimeError("Python executable was not found")
    command = [py, str(script), str(Path(openapi_file).resolve()), str(Path(event_log).resolve())]
    try:
        completed = subprocess.run(command, cwd=str(repo / "src"), capture_output=True, text=True, timeout=timeout, check=False)
        stdout, stderr = completed.stdout or "", completed.stderr or ""
        output = "\n".join(x for x in (stdout, stderr) if x)
        return {"success": completed.returncode == 0, "return_code": completed.returncode, "command": command, "stdout": stdout, "stderr": stderr, "replay_events": merge_replay_results(event_log, output)}
    except subprocess.TimeoutExpired as exc:
        stdout, stderr = exc.stdout or "", exc.stderr or ""
        output = "\n".join(x for x in (stdout, stderr) if x)
        return {"success": False, "timeout": True, "return_code": None, "command": command, "stdout": stdout, "stderr": stderr, "replay_events": merge_replay_results(event_log, output)}


def http_status_for_event(event: dict[str, Any]) -> str:
    code = int(event.get("status_code", 0) or 0)
    body = event.get("response_body")
    if code == 401: return "authentication-failed"
    if code == 403: return "protected"
    if code == 422: return "request-invalid"
    if code == 405: return "method-not-allowed"
    if code == 404: return "not-found-or-hidden"
    if 200 <= code < 300:
        empty = body is None or body == "" or body == [] or body == {}
        return "success-empty-response" if empty else "candidate-success-with-data"
    return "request-failed"


def cpn_status_for(event: dict[str, Any]) -> str:
    if event.get("present_in_model") is True: return "present-in-model"
    return str(event.get("replay_error_type") or event.get("cpn_status") or "not-replayed")


def classify_finding(finding: dict[str, Any], matched: list[dict[str, Any]]) -> tuple[str, str, str]:
    if not matched:
        return "not-tested", "not-tested", "static-candidate"
    http_states = [http_status_for_event(e) for e in matched]
    cpn_states = [cpn_status_for(e) for e in matched]
    if "candidate-success-with-data" in http_states:
        dynamic = "candidate-success-with-data"
        final = "dynamic-candidate"
    elif "protected" in http_states:
        dynamic, final = "protected", "not-confirmed"
    elif "authentication-failed" in http_states:
        dynamic, final = "authentication-failed", "not-confirmed"
    elif "request-invalid" in http_states:
        dynamic, final = "request-invalid", "not-confirmed"
    elif "not-found-or-hidden" in http_states:
        dynamic, final = "not-found-or-hidden", "not-confirmed"
    elif "success-empty-response" in http_states:
        dynamic, final = "success-empty-response", "not-confirmed"
    else:
        dynamic, final = "request-failed", "not-confirmed"
    return dynamic, cpn_states[0] if cpn_states else "not-replayed", final


def attach_dynamic_evidence(static_result: dict[str, Any], links_result: dict[str, Any]) -> dict[str, Any]:
    events = links_result.get("replay_events", [])
    findings = []
    for original in static_result.get("findings", []):
        finding = dict(original)
        method = str(finding.get("method", "")).upper()
        path = str(finding.get("path", ""))
        matched = [e for e in events if str(e.get("method", "")).upper() == method and (endpoint_matches(path, str(e.get("path", ""))) or (e.get("openapi_path") and path_only(e.get("openapi_path")) == path_only(path)))]
        dynamic_status, cpn_status, final_status = classify_finding(finding, matched)
        finding["links2cpn_evidence"] = matched
        finding["dynamic_verified"] = dynamic_status == "candidate-success-with-data"
        finding["dynamic_status"] = dynamic_status
        finding["cpn_status"] = cpn_status
        finding["final_status"] = final_status
        findings.append(finding)
    return {**static_result, "links2cpn": links_result, "findings": findings}


def analyze(args: argparse.Namespace) -> dict[str, Any]:
    document = load_openapi_file(args.openapi_file)
    global_security = document.get("security")
    if global_security:
        for path_item in document.get("paths", {}).values():
            if isinstance(path_item, dict):
                for method, operation in path_item.items():
                    if method.lower() in OpenAPIResourceIDDetector.HTTP_METHODS and isinstance(operation, dict):
                        operation.setdefault("security", global_security)
    stage1 = OpenAPIResourceIDDetector(document).analyze()
    stage2 = run_links2cpn(args.links2cpn_repo, args.openapi_file, args.event_log, args.links2cpn_python, args.timeout)
    return attach_dynamic_evidence(stage1, stage2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Two-stage OpenAPI BOLA/IDOR detector")
    parser.add_argument("openapi_file")
    parser.add_argument("--event-log", required=True)
    parser.add_argument("--links2cpn-repo", required=True)
    parser.add_argument("--links2cpn-python", default=None)
    parser.add_argument("--timeout", type=int, default=300)
    parser.add_argument("--output", default="two-stage-result.json")
    args = parser.parse_args()
    result = analyze(args)
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
