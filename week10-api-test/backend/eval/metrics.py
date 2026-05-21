"""
자동 메트릭: 구조 준수, 일관성, 응답 길이.
지연시간/토큰/비용은 run_eval.py가 직접 측정해 raw JSON에 저장한다.
"""

import re
import statistics
from typing import Iterable


CODE_BLOCK_RE = re.compile(r"```[\s\S]*?```", re.MULTILINE)
SUMMARY_RE = re.compile(r"한줄\s*요약\s*[:：]")


def has_code_block(text: str) -> bool:
    return bool(CODE_BLOCK_RE.search(text or ""))


def has_summary_line(text: str) -> bool:
    return bool(SUMMARY_RE.search(text or ""))


def structure_score(text: str) -> dict:
    """0~2점. 코드블록 1점 + 한줄요약 1점."""
    cb = has_code_block(text)
    sm = has_summary_line(text)
    return {
        "has_code_block": cb,
        "has_summary": sm,
        "score": int(cb) + int(sm),
        "max_score": 2,
    }


def tokenize(text: str) -> set[str]:
    """간단한 어휘 토큰화 — 영문/숫자 단어 + 한글 어절."""
    if not text:
        return set()
    return set(re.findall(r"[A-Za-z0-9_]+|[가-힣]+", text))


def jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 1.0
    return len(a & b) / len(union)


def consistency_score(responses: list[str]) -> float:
    """3개 응답 간 pairwise Jaccard similarity 평균."""
    valid = [r for r in responses if r]
    if len(valid) < 2:
        return 0.0
    tokens = [tokenize(r) for r in valid]
    pairs = []
    for i in range(len(tokens)):
        for j in range(i + 1, len(tokens)):
            pairs.append(jaccard(tokens[i], tokens[j]))
    return statistics.mean(pairs) if pairs else 0.0


def latency_summary(latencies: Iterable[float]) -> dict:
    xs = [x for x in latencies if x is not None]
    if not xs:
        return {"avg": None, "p95": None, "n": 0}
    xs_sorted = sorted(xs)
    p95_idx = max(0, int(round(0.95 * (len(xs_sorted) - 1))))
    return {
        "avg": round(statistics.mean(xs_sorted), 3),
        "p95": round(xs_sorted[p95_idx], 3),
        "n": len(xs_sorted),
    }


def latency_to_ops_score(avg_latency_s: float | None) -> int:
    """체크리스트 운영적합성 자동 환산: 5초 이내 권장.
    avg < 2s → 5점, < 3.5s → 4점, < 5s → 3점, < 7s → 2점, else 1점.
    """
    if avg_latency_s is None:
        return 0
    if avg_latency_s < 2.0:
        return 5
    if avg_latency_s < 3.5:
        return 4
    if avg_latency_s < 5.0:
        return 3
    if avg_latency_s < 7.0:
        return 2
    return 1


def structure_to_ops_score(compliance_rate: float) -> int:
    """0.0~1.0 → 1~5점."""
    if compliance_rate >= 0.95:
        return 5
    if compliance_rate >= 0.85:
        return 4
    if compliance_rate >= 0.70:
        return 3
    if compliance_rate >= 0.50:
        return 2
    return 1


def consistency_to_ops_score(cons: float) -> int:
    """0.0~1.0 Jaccard → 1~5점."""
    if cons >= 0.80:
        return 5
    if cons >= 0.65:
        return 4
    if cons >= 0.50:
        return 3
    if cons >= 0.35:
        return 2
    return 1
