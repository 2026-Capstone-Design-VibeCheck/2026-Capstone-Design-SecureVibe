"""
SecureVibe LLM 평가 하네스.

사용법:
    python run_eval.py                      # 전체 실행 (확인 프롬프트)
    python run_eval.py --dry-run            # API 호출 없이 프롬프트만 출력
    python run_eval.py --samples 01_sql_injection --runs 1
    python run_eval.py --models anthropic/claude-3.5-haiku
    python run_eval.py --aggregate-only     # 기존 raw 결과로 REPORT.md 재생성
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI, APIError

# 상대 import 대신 같은 디렉토리 모듈 직접 import
sys.path.insert(0, str(Path(__file__).parent))
from prompts import SUGGEST_FIX_SYSTEM, build_suggest_fix_prompt  # noqa: E402
from models import MODELS, ModelSpec, by_slug, estimate_cost, safe_filename  # noqa: E402
import metrics  # noqa: E402

ROOT = Path(__file__).parent
SAMPLES_DIR = ROOT / "samples"
RESULTS_DIR = ROOT / "results"
RAW_DIR = RESULTS_DIR / "raw"

# main.py가 사용하는 .env 동일하게 로드
load_dotenv(ROOT.parent / ".env")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def load_samples(sample_ids: list[str] | None) -> list[dict]:
    files = sorted(SAMPLES_DIR.glob("*.json"))
    samples = [json.loads(f.read_text(encoding="utf-8")) for f in files]
    if sample_ids:
        samples = [s for s in samples if s["id"] in sample_ids]
    return samples


def select_models(slugs: list[str] | None) -> list[ModelSpec]:
    if not slugs:
        return list(MODELS)
    out = []
    for s in slugs:
        spec = by_slug(s)
        if spec is None:
            print(f"[warn] 알 수 없는 모델 슬러그: {s}", file=sys.stderr)
            continue
        out.append(spec)
    return out


async def call_one(
    client: AsyncOpenAI,
    spec: ModelSpec,
    sample: dict,
    run_idx: int,
    temperature: float,
    max_tokens: int,
) -> dict:
    prompt = build_suggest_fix_prompt(
        sample["vulnerability_description"], sample["vulnerable_code"]
    )
    record = {
        "model": spec.slug,
        "sample_id": sample["id"],
        "run_idx": run_idx,
        "temperature": temperature,
        "prompt_chars": len(prompt),
        "latency_s": None,
        "prompt_tokens": None,
        "completion_tokens": None,
        "cost_usd": None,
        "response_text": None,
        "structure": None,
        "error": None,
    }

    for attempt in range(2):  # 1회 재시도
        try:
            t0 = time.perf_counter()
            resp = await client.chat.completions.create(
                model=spec.slug,
                messages=[
                    {"role": "system", "content": SUGGEST_FIX_SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "SecureVibe-Eval",
                },
            )
            record["latency_s"] = round(time.perf_counter() - t0, 3)
            record["response_text"] = (resp.choices[0].message.content or "").strip()
            usage = getattr(resp, "usage", None)
            if usage is not None:
                record["prompt_tokens"] = usage.prompt_tokens
                record["completion_tokens"] = usage.completion_tokens
                record["cost_usd"] = round(
                    estimate_cost(spec, usage.prompt_tokens, usage.completion_tokens), 6
                )
            record["structure"] = metrics.structure_score(record["response_text"])
            return record
        except APIError as e:
            record["error"] = f"APIError({getattr(e, 'status_code', '?')}): {getattr(e, 'message', str(e))}"
        except Exception as e:
            record["error"] = f"{type(e).__name__}: {e}"
        if attempt == 0:
            await asyncio.sleep(1.0)

    return record


async def run_model(
    client: AsyncOpenAI,
    spec: ModelSpec,
    samples: list[dict],
    runs: int,
    temperature: float,
    max_tokens: int,
    concurrency: int,
) -> list[dict]:
    sem = asyncio.Semaphore(concurrency)

    async def guarded(sample, run_idx):
        async with sem:
            rec = await call_one(client, spec, sample, run_idx, temperature, max_tokens)
            out_path = RAW_DIR / f"{safe_filename(spec.slug)}__{sample['id']}__r{run_idx}.json"
            out_path.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
            tag = "OK" if rec["error"] is None else "ERR"
            print(f"  [{tag}] {spec.label:<22} {sample['id']:<28} run{run_idx} "
                  f"lat={rec['latency_s']}s tok={rec['completion_tokens']}")
            return rec

    tasks = [guarded(s, r) for s in samples for r in range(runs)]
    return await asyncio.gather(*tasks)


def aggregate(spec: ModelSpec, samples: list[dict], runs: int) -> dict:
    """raw JSON에서 모델별 집계 + scoring 마크다운 생성용 데이터 구성."""
    per_sample = []
    all_latencies = []
    all_costs = []
    structure_pass = 0
    structure_total = 0

    for sample in samples:
        runs_data = []
        for r in range(runs):
            path = RAW_DIR / f"{safe_filename(spec.slug)}__{sample['id']}__r{r}.json"
            if not path.exists():
                continue
            runs_data.append(json.loads(path.read_text(encoding="utf-8")))

        if not runs_data:
            continue

        responses = [d["response_text"] or "" for d in runs_data]
        cons = metrics.consistency_score(responses)
        for d in runs_data:
            if d["latency_s"] is not None:
                all_latencies.append(d["latency_s"])
            if d["cost_usd"] is not None:
                all_costs.append(d["cost_usd"])
            if d["structure"] is not None:
                structure_total += d["structure"]["max_score"]
                structure_pass += d["structure"]["score"]

        per_sample.append({
            "sample_id": sample["id"],
            "expected_label": sample["expected_label"],
            "consistency": round(cons, 3),
            "first_response": responses[0] if responses else "",
            "errors": [d["error"] for d in runs_data if d["error"]],
        })

    lat = metrics.latency_summary(all_latencies)
    compliance = (structure_pass / structure_total) if structure_total else 0.0
    avg_cost = (sum(all_costs) / len(all_costs)) if all_costs else None
    avg_cons = (sum(s["consistency"] for s in per_sample) / len(per_sample)) if per_sample else 0.0

    return {
        "model": spec,
        "latency": lat,
        "avg_cost_usd": avg_cost,
        "structure_compliance": compliance,
        "structure_pass": structure_pass,
        "structure_total": structure_total,
        "avg_consistency": round(avg_cons, 3),
        "per_sample": per_sample,
        "ops_score": (
            metrics.latency_to_ops_score(lat["avg"])
            + metrics.structure_to_ops_score(compliance)
            + metrics.consistency_to_ops_score(avg_cons)
        ),
    }


def write_scoring_md(agg: dict, samples: list[dict]) -> Path:
    spec: ModelSpec = agg["model"]
    path = RESULTS_DIR / f"scoring_{safe_filename(spec.slug)}.md"
    lines = []
    lines.append(f"# 채점: {spec.label}\n")
    lines.append(f"슬러그: `{spec.slug}` — 역할: {spec.role}\n")
    lines.append("## 자동 메트릭 요약\n")
    lat = agg["latency"]
    cost_str = f"${agg['avg_cost_usd']:.4f}" if agg["avg_cost_usd"] is not None else "N/A"
    lines.append(f"- 평균 지연: {lat['avg']}s | p95: {lat['p95']}s (n={lat['n']})")
    lines.append(f"- 평균 비용/call: {cost_str}")
    lines.append(f"- 구조 준수율: {agg['structure_pass']}/{agg['structure_total']} "
                 f"({agg['structure_compliance']*100:.0f}%)")
    lines.append(f"- 일관성 (Jaccard 평균): {agg['avg_consistency']}")
    lines.append(f"- **운영 적합성 자동 점수: {agg['ops_score']} / 15**\n")

    lines.append("## 1. 정확성 (Security Accuracy) — 수동 채점\n")
    by_id = {s["id"]: s for s in samples}
    for ps in agg["per_sample"]:
        sample = by_id[ps["sample_id"]]
        lines.append(f"### {ps['sample_id']} (expected: **{ps['expected_label']}**)\n")
        lines.append(f"_평가 메모: {sample['evaluation_notes']}_\n")
        lines.append(f"_일관성: {ps['consistency']}_\n")
        if sample["expected_label"] == "vulnerable":
            lines.append("- [ ] True Positive 수정 품질 (1-5): __")
            lines.append("- [ ] 코드 무결성 — 변수명·시그니처 유지 (1-5): __")
        else:
            lines.append("- [ ] False Positive 필터링 — '취약점 아님' 판단 (1-5): __")
        lines.append("- 메모: \n")
        lines.append("<details><summary>첫 번째 응답 보기</summary>\n")
        lines.append("\n```")
        lines.append(ps["first_response"][:2000])
        lines.append("```\n")
        lines.append("</details>\n")

    lines.append("## 2. 사용성 (UX/Education) — 전체 평균 수동 채점\n")
    lines.append("- [ ] 설명 난이도 (입문자 이해도) (1-5): __")
    lines.append("- [ ] 요약의 핵심 — '왜/어떻게' 한눈 파악 (1-5): __")
    lines.append("- [ ] 가독성 — 코드 블록 + 텍스트 분리 (1-5): __\n")

    lines.append("## 3. 종합 점수\n")
    n_vuln = sum(1 for ps in agg["per_sample"]
                 if by_id[ps["sample_id"]]["expected_label"] == "vulnerable")
    n_safe = sum(1 for ps in agg["per_sample"]
                 if by_id[ps["sample_id"]]["expected_label"] == "safe")
    max_acc = n_vuln * 10 + n_safe * 5  # vuln: 두 항목 × 5점, safe: 한 항목 × 5점
    lines.append(f"- 정확성 합계: __ / {max_acc}")
    lines.append("- 사용성 합계: __ / 15")
    lines.append(f"- 운영 적합성: {agg['ops_score']} / 15 (자동 산정)")
    lines.append(f"- **총점: __ / {max_acc + 15 + 15}**\n")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_report_md(aggs: list[dict]) -> Path:
    path = RESULTS_DIR / "REPORT.md"
    lines = []
    lines.append("# SecureVibe 모델 평가 리포트\n")
    lines.append("자동 메트릭 표 (수동 채점 점수는 `scoring_*.md` 파일을 채워 합산).\n")
    lines.append("| 모델 | 평균 지연(s) | p95(s) | 비용/call | 구조 준수 | 일관성 | 운영점수/15 |")
    lines.append("|---|---|---|---|---|---|---|")
    for agg in aggs:
        spec: ModelSpec = agg["model"]
        lat = agg["latency"]
        cost = f"${agg['avg_cost_usd']:.4f}" if agg["avg_cost_usd"] is not None else "N/A"
        comp = f"{agg['structure_compliance']*100:.0f}%"
        lines.append(
            f"| {spec.label} | {lat['avg']} | {lat['p95']} | {cost} | {comp} | "
            f"{agg['avg_consistency']} | {agg['ops_score']} |"
        )
    lines.append("\n## 모델별 역할\n")
    for agg in aggs:
        spec: ModelSpec = agg["model"]
        lines.append(f"- **{spec.label}** (`{spec.slug}`) — {spec.role}")
    lines.append("\n## 수동 채점 안내\n")
    lines.append("각 모델별 `scoring_<slug>.md` 파일을 열어 정확성 + 사용성 채점을 완료한 뒤,")
    lines.append("총점을 아래 표에 직접 추가하세요. 권장: 정확성 50% + 사용성 25% + 운영 25% 가중치.\n")
    lines.append("## 권장 모델\n")
    lines.append("- `/suggest-fix` 권장: **(채점 후 결정)**")
    lines.append("- `/chat` 권장: **(채점 후 결정)**\n")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def estimate_total(models: list[ModelSpec], samples: list[dict], runs: int) -> tuple[int, float]:
    n_calls = len(models) * len(samples) * runs
    # 가정: prompt 800 tok, completion 500 tok
    cost = sum(
        estimate_cost(m, 800, 500) * len(samples) * runs for m in models
    )
    return n_calls, cost


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--models", help="콤마 구분 OpenRouter 슬러그. 미지정 시 전체")
    p.add_argument("--samples", help="콤마 구분 sample id. 미지정 시 전체")
    p.add_argument("--runs", type=int, default=3, help="샘플당 호출 횟수 (기본 3)")
    p.add_argument("--temperature", type=float, default=0.1)
    p.add_argument("--max-tokens", type=int, default=1000)
    p.add_argument("--concurrency", type=int, default=4)
    p.add_argument("--dry-run", action="store_true", help="API 호출 없이 프롬프트만 출력")
    p.add_argument("--aggregate-only", action="store_true",
                   help="기존 raw 결과로 REPORT.md/scoring 파일만 재생성")
    p.add_argument("--yes", "-y", action="store_true", help="비용 확인 프롬프트 생략")
    return p.parse_args()


async def main_async():
    args = parse_args()

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    model_slugs = args.models.split(",") if args.models else None
    sample_ids = args.samples.split(",") if args.samples else None

    specs = select_models(model_slugs)
    samples = load_samples(sample_ids)

    if not specs:
        print("선택된 모델이 없습니다.", file=sys.stderr); sys.exit(1)
    if not samples:
        print("선택된 샘플이 없습니다.", file=sys.stderr); sys.exit(1)

    if args.dry_run:
        print(f"[dry-run] {len(specs)} 모델 × {len(samples)} 샘플 × {args.runs} 회\n")
        for s in samples[:1]:
            prompt = build_suggest_fix_prompt(s["vulnerability_description"], s["vulnerable_code"])
            print(f"--- 샘플 {s['id']} 프롬프트 미리보기 ---")
            print(prompt)
        return

    if args.aggregate_only:
        aggs = [aggregate(spec, samples, args.runs) for spec in specs]
        for a in aggs:
            sp = write_scoring_md(a, samples)
            print(f"  scoring → {sp}")
        rp = write_report_md(aggs)
        print(f"\nREPORT → {rp}")
        return

    n_calls, est_cost = estimate_total(specs, samples, args.runs)
    print(f"\n예상 호출 수: {n_calls}")
    print(f"예상 비용 (가정 prompt=800 tok, completion=500 tok): ${est_cost:.4f}")
    print(f"동시성: {args.concurrency}, temperature: {args.temperature}\n")

    if not args.yes:
        ans = input("계속 진행하시겠습니까? [y/N]: ").strip().lower()
        if ans != "y":
            print("취소됨."); return

    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("OPENROUTER_API_KEY가 .env에 없습니다.", file=sys.stderr); sys.exit(2)

    client = AsyncOpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)

    aggs = []
    for spec in specs:
        print(f"\n=== {spec.label} ({spec.slug}) ===")
        await run_model(
            client, spec, samples, args.runs,
            args.temperature, args.max_tokens, args.concurrency,
        )
        aggs.append(aggregate(spec, samples, args.runs))

    print("\n--- 채점 파일 생성 ---")
    for a in aggs:
        sp = write_scoring_md(a, samples)
        print(f"  {sp}")
    rp = write_report_md(aggs)
    print(f"\nREPORT → {rp}")


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
