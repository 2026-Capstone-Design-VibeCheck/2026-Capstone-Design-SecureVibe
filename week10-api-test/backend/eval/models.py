"""
OpenRouter 모델 슬러그 + 가격(USD per 1M tokens) 정의.
가격은 2026-05 시점 OpenRouter 공시 기준 근사값. 변동 시 수동 갱신.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelSpec:
    slug: str
    label: str
    role: str
    input_per_mtok: float   # USD per 1M input tokens
    output_per_mtok: float  # USD per 1M output tokens


MODELS: list[ModelSpec] = [
    ModelSpec(
        slug="anthropic/claude-sonnet-4.6",
        label="claude-sonnet-4.6",
        role="정답지 (최고 품질 벤치마크)",
        input_per_mtok=3.00,
        output_per_mtok=15.00,
    ),
    ModelSpec(
        slug="anthropic/claude-3.5-haiku",
        label="claude-3.5-haiku",
        role="현재 /suggest-fix 베이스라인 + 속도",
        input_per_mtok=0.80,
        output_per_mtok=4.00,
    ),
    ModelSpec(
        slug="openai/gpt-4o-mini",
        label="gpt-4o-mini",
        role="모던 OpenAI 중급",
        input_per_mtok=0.15,
        output_per_mtok=0.60,
    ),
    ModelSpec(
        slug="google/gemini-2.5-flash",
        label="gemini-2.5-flash",
        role="가성비 + 속도",
        input_per_mtok=0.30,
        output_per_mtok=2.50,
    ),
    ModelSpec(
        slug="deepseek/deepseek-chat",
        label="deepseek-chat",
        role="DeepSeek-V3 (코딩 가성비)",
        input_per_mtok=0.14,
        output_per_mtok=0.28,
    ),
    ModelSpec(
        slug="meta-llama/llama-3.1-70b-instruct",
        label="llama-3.1-70b",
        role="오픈소스 대표",
        input_per_mtok=0.35,
        output_per_mtok=0.40,
    ),
]


def by_slug(slug: str) -> ModelSpec | None:
    for m in MODELS:
        if m.slug == slug:
            return m
    return None


def estimate_cost(spec: ModelSpec, prompt_tokens: int, completion_tokens: int) -> float:
    return (
        prompt_tokens * spec.input_per_mtok / 1_000_000
        + completion_tokens * spec.output_per_mtok / 1_000_000
    )


def safe_filename(slug: str) -> str:
    return slug.replace("/", "__").replace(":", "_")
