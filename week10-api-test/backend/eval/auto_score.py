"""
6 모델 × 10 샘플 응답을 검토한 결과를 scoring_*.md와 REPORT.md에 기입한다.
점수는 raw JSON을 직접 분석해 수동 평가한 값을 dict로 박아둔 것.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from models import MODELS, safe_filename, by_slug, estimate_cost
import metrics

ROOT = Path(__file__).parent
RAW_DIR = ROOT / "results" / "raw"
RES_DIR = ROOT / "results"

SAMPLES = sorted([json.loads(p.read_text(encoding="utf-8"))
                  for p in (ROOT / "samples").glob("*.json")],
                 key=lambda s: s["id"])

# (model, sample_id) -> {tp, integrity, fp, note}
# tp/integrity 는 vulnerable 샘플용, fp 는 safe 샘플용
SCORES = {
    # ----- claude-3.5-haiku -----
    ("anthropic/claude-3.5-haiku", "01_sql_injection"):
        {"tp": 5, "integrity": 5, "note": "파라미터 바인딩, 함수 시그니처 그대로."},
    ("anthropic/claude-3.5-haiku", "02_command_injection"):
        {"tp": 5, "integrity": 5, "note": "리스트 인자 + shell 미사용. shlex import만 잉여."},
    ("anthropic/claude-3.5-haiku", "03_hardcoded_secret"):
        {"tp": 5, "integrity": 5, "note": "dotenv + getenv. 변수명 유지."},
    ("anthropic/claude-3.5-haiku", "04_path_traversal"):
        {"tp": 5, "integrity": 5, "note": "basename + normpath + startswith 다중 방어."},
    ("anthropic/claude-3.5-haiku", "05_xss_react"):
        {"tp": 5, "integrity": 5, "note": "DOMPurify 사용. HTML 허용 케이스 고려."},
    ("anthropic/claude-3.5-haiku", "06_weak_hash_md5"):
        {"tp": 3, "integrity": 5,
         "note": "SHA-256+salt 사용. 빠른 해시라 패스워드용으론 여전히 약함 (bcrypt/PBKDF2 권장)."},
    ("anthropic/claude-3.5-haiku", "07_unsafe_deserialization"):
        {"tp": 5, "integrity": 5, "note": "json.loads 교체. 깔끔."},
    ("anthropic/claude-3.5-haiku", "08_fp_safe_param_sql"):
        {"fp": 2, "note": "FP 인지 못 함. connection.close() 추가는 가독성 개선이지만 취약점 무관."},
    ("anthropic/claude-3.5-haiku", "09_fp_safe_subprocess"):
        {"fp": 2, "note": "FP 인지 못 함. shlex.quote 잉여 추가."},
    ("anthropic/claude-3.5-haiku", "10_real_main_py_login"):
        {"tp": 5, "integrity": 5, "note": "env vars + logging.info(아이디만). 비밀번호 로그 제거."},

    # ----- claude-sonnet-4.6 -----
    ("anthropic/claude-sonnet-4.6", "01_sql_injection"):
        {"tp": 5, "integrity": 5, "note": "파라미터 바인딩 + 상세 해설."},
    ("anthropic/claude-sonnet-4.6", "02_command_injection"):
        {"tp": 5, "integrity": 5, "note": "shell=False 명시 + 메타문자 설명까지."},
    ("anthropic/claude-sonnet-4.6", "03_hardcoded_secret"):
        {"tp": 5, "integrity": 5, "note": "os.environ[]로 누락 시 즉시 실패 — 더 안전."},
    ("anthropic/claude-sonnet-4.6", "04_path_traversal"):
        {"tp": 5, "integrity": 5, "note": "realpath + sep 보정 — 가장 정확한 방어."},
    ("anthropic/claude-sonnet-4.6", "05_xss_react"):
        {"tp": 5, "integrity": 5, "note": "dangerouslySetInnerHTML 자체 제거 (가장 안전)."},
    ("anthropic/claude-sonnet-4.6", "06_weak_hash_md5"):
        {"tp": 5, "integrity": 5, "note": "bcrypt 사용 + 타이밍 공격 언급."},
    ("anthropic/claude-sonnet-4.6", "07_unsafe_deserialization"):
        {"tp": 5, "integrity": 5, "note": "json + 타입 체크 + HTTPException 처리까지."},
    ("anthropic/claude-sonnet-4.6", "08_fp_safe_param_sql"):
        {"fp": 5, "note": "**'Semgrep 오탐(False Positive)'을 명시적으로 인지**. with문은 보너스."},
    ("anthropic/claude-sonnet-4.6", "09_fp_safe_subprocess"):
        {"fp": 2, "note": "안전한데도 shlex.quote + env={} 과잉 방어. FP 인지 실패."},
    # 10번 샘플은 크레딧 부족으로 응답 없음

    # ----- deepseek-chat -----
    ("deepseek/deepseek-chat", "01_sql_injection"):
        {"tp": 5, "integrity": 5, "note": "정확. 단 '주석:' 추가 섹션은 형식 일탈."},
    ("deepseek/deepseek-chat", "02_command_injection"):
        {"tp": 5, "integrity": 5, "note": "리스트 인자. ```lang 누락."},
    ("deepseek/deepseek-chat", "03_hardcoded_secret"):
        {"tp": 5, "integrity": 5, "note": "getenv 사용. 변수명 유지."},
    ("deepseek/deepseek-chat", "04_path_traversal"):
        {"tp": 5, "integrity": 5, "note": "normpath + sep 포함 startswith 검증."},
    ("deepseek/deepseek-chat", "05_xss_react"):
        {"tp": 5, "integrity": 5, "note": "DOMPurify 사용."},
    ("deepseek/deepseek-chat", "06_weak_hash_md5"):
        {"tp": 5, "integrity": 5, "note": "PBKDF2-HMAC-SHA256 + 100k iter. 가장 견고한 구현."},
    ("deepseek/deepseek-chat", "07_unsafe_deserialization"):
        {"tp": 5, "integrity": 5, "note": "json.loads로 교체."},
    ("deepseek/deepseek-chat", "08_fp_safe_param_sql"):
        {"fp": 2, "note": "FP 인지 못 함. '정수 변환으로 SQL Injection 방지' 라고 잘못 설명."},
    ("deepseek/deepseek-chat", "09_fp_safe_subprocess"):
        {"fp": 3, "note": "check=True 추가만. '이미 안전한 구조였지만'으로 일부 인지."},
    ("deepseek/deepseek-chat", "10_real_main_py_login"):
        {"tp": 5, "integrity": 5, "note": "env + logging + 예외 처리까지. 견고."},

    # ----- gemini-2.5-flash -----
    ("google/gemini-2.5-flash", "01_sql_injection"):
        {"tp": 5, "integrity": 5, "note": "파라미터 바인딩 + 친절한 도입부."},
    ("google/gemini-2.5-flash", "02_command_injection"):
        {"tp": 5, "integrity": 5, "note": "리스트 인자."},
    ("google/gemini-2.5-flash", "03_hardcoded_secret"):
        {"tp": 5, "integrity": 5, "note": "환경변수 + 주석 친절."},
    ("google/gemini-2.5-flash", "04_path_traversal"):
        {"tp": 5, "integrity": 5, "note": "realpath + 검증. 도입 설명 길지만 명확."},
    ("google/gemini-2.5-flash", "05_xss_react"):
        {"tp": 5, "integrity": 5, "note": "{comment} 텍스트 렌더링."},
    ("google/gemini-2.5-flash", "06_weak_hash_md5"):
        {"tp": 5, "integrity": 5, "note": "bcrypt + 자동 salt."},
    ("google/gemini-2.5-flash", "07_unsafe_deserialization"):
        {"tp": 5, "integrity": 5, "note": "json.loads."},
    ("google/gemini-2.5-flash", "08_fp_safe_param_sql"):
        {"fp": 5, "note": "**'이미 SQL Injection에 안전합니다. Semgrep이 잘못 탐지한 것'**으로 정확히 FP 판단."},
    ("google/gemini-2.5-flash", "09_fp_safe_subprocess"):
        {"fp": 5, "note": "**'Semgrep이 잘못된 긍정(false positive)을 보고한 경우'**로 명시. 수정 없음 권고."},
    ("google/gemini-2.5-flash", "10_real_main_py_login"):
        {"tp": 5, "integrity": 5, "note": "env vars + 자격증명 검증 + PII 마스킹. 가장 견고."},

    # ----- llama-3.1-70b-instruct -----
    ("meta-llama/llama-3.1-70b-instruct", "01_sql_injection"):
        {"tp": 5, "integrity": 5, "note": "정확. ```lang 누락."},
    ("meta-llama/llama-3.1-70b-instruct", "02_command_injection"):
        {"tp": 5, "integrity": 5, "note": "리스트 인자."},
    ("meta-llama/llama-3.1-70b-instruct", "03_hardcoded_secret"):
        {"tp": 5, "integrity": 5, "note": "환경변수."},
    ("meta-llama/llama-3.1-70b-instruct", "04_path_traversal"):
        {"tp": 3, "integrity": 5,
         "note": "normpath만 사용 + sep 없는 startswith — `/var/app/uploadsX` 같은 경로에 우회 가능. realpath 권장."},
    ("meta-llama/llama-3.1-70b-instruct", "05_xss_react"):
        {"tp": 5, "integrity": 5, "note": "{comment} 텍스트 렌더링."},
    ("meta-llama/llama-3.1-70b-instruct", "06_weak_hash_md5"):
        {"tp": 4, "integrity": 4,
         "note": "코드는 PBKDF2 사용 — 안전. 그러나 **주석에 'bcrypt'라고 잘못 명시** (코드/주석 불일치)."},
    ("meta-llama/llama-3.1-70b-instruct", "07_unsafe_deserialization"):
        {"tp": 5, "integrity": 5, "note": "json.loads."},
    ("meta-llama/llama-3.1-70b-instruct", "08_fp_safe_param_sql"):
        {"fp": 2, "note": "FP 인지 못 함. ?를 :post_id로 교체 — 의미 없는 변경."},
    ("meta-llama/llama-3.1-70b-instruct", "09_fp_safe_subprocess"):
        {"fp": 3, "note": "FP 일부 인지 ('false positive를 피하기 위해'). 그러나 Popen으로 무의미 리팩토링."},
    ("meta-llama/llama-3.1-70b-instruct", "10_real_main_py_login"):
        {"tp": 5, "integrity": 5, "note": "env vars + 'Login success' 단순 출력. PII 제거."},

    # ----- gpt-4o-mini -----
    ("openai/gpt-4o-mini", "01_sql_injection"):
        {"tp": 5, "integrity": 5, "note": "정확. 요약이 괄호로 감싸진 형식 일탈."},
    ("openai/gpt-4o-mini", "02_command_injection"):
        {"tp": 5, "integrity": 5, "note": "리스트 인자."},
    ("openai/gpt-4o-mini", "03_hardcoded_secret"):
        {"tp": 5, "integrity": 5, "note": "getenv. 깔끔."},
    ("openai/gpt-4o-mini", "04_path_traversal"):
        {"tp": 4, "integrity": 5,
         "note": "basename만으로 처리 — flat dir 가정에선 안전하지만 컨테인먼트 검증 부재."},
    ("openai/gpt-4o-mini", "05_xss_react"):
        {"tp": 5, "integrity": 5, "note": "{comment} 텍스트 렌더링."},
    ("openai/gpt-4o-mini", "06_weak_hash_md5"):
        {"tp": 5, "integrity": 5, "note": "PBKDF2 100k + salt 결합 저장 — 견고."},
    ("openai/gpt-4o-mini", "07_unsafe_deserialization"):
        {"tp": 5, "integrity": 5, "note": "json.loads."},
    ("openai/gpt-4o-mini", "08_fp_safe_param_sql"):
        {"fp": 2,
         "note": "FP 인지 못 함. 게다가 isdigit() 으로 변경해 **음수 ID 거부 부작용** 도입."},
    ("openai/gpt-4o-mini", "09_fp_safe_subprocess"):
        {"fp": 2, "note": "FP 인지 못 함. `[\"...\"] + [action]` 은 원본과 동일 — 무의미 변경."},
    ("openai/gpt-4o-mini", "10_real_main_py_login"):
        {"tp": 2, "integrity": 5,
         "note": "**치명적 결함: 주석은 'PII 출력 안 함'이라 했는데 result[2]/result[4] print는 그대로 남김.** 코드와 주장이 모순."},
}

# 사용성 (model -> {explain, summary, readability, comment})
USABILITY = {
    "anthropic/claude-3.5-haiku":
        {"explain": 4, "summary": 5, "readability": 5,
         "comment": "짧고 명확. ```python 일관. 입문자도 따라가기 쉬움."},
    "anthropic/claude-sonnet-4.6":
        {"explain": 5, "summary": 5, "readability": 5,
         "comment": "'왜 위험한지'를 가장 풍부하게 설명. 다소 길지만 교육 효과 최고."},
    "deepseek/deepseek-chat":
        {"explain": 4, "summary": 4, "readability": 3,
         "comment": "내용은 정확하지만 ```lang 자주 누락 + '주석:' 같은 형식 일탈 잦음."},
    "google/gemini-2.5-flash":
        {"explain": 5, "summary": 5, "readability": 5,
         "comment": "도입부 설명 + 코드 + 요약 3-part 구조 일관. 한국어 자연스러움."},
    "meta-llama/llama-3.1-70b-instruct":
        {"explain": 3, "summary": 3, "readability": 3,
         "comment": "기능적이지만 짧고 일반적. ```lang 일관 누락. 입문자에겐 불충분할 수 있음."},
    "openai/gpt-4o-mini":
        {"explain": 3, "summary": 3, "readability": 4,
         "comment": "매우 간결. 빠르지만 '왜'에 대한 설명이 부족한 경우가 많음."},
}


def render_scoring(slug: str) -> str:
    spec = by_slug(slug)
    label = spec.label

    # raw 데이터 로드 — 자동 메트릭 재계산
    latencies, costs, struct_pass, struct_total = [], [], 0, 0
    per_sample_cons = []
    for s in SAMPLES:
        runs = []
        for r in range(3):
            p = RAW_DIR / f"{safe_filename(slug)}__{s['id']}__r{r}.json"
            if p.exists():
                runs.append(json.loads(p.read_text(encoding="utf-8")))
        if not runs:
            continue
        responses = [d.get("response_text") or "" for d in runs]
        per_sample_cons.append((s["id"], metrics.consistency_score(responses)))
        for d in runs:
            if d.get("latency_s") is not None: latencies.append(d["latency_s"])
            if d.get("cost_usd") is not None: costs.append(d["cost_usd"])
            if d.get("structure") is not None:
                struct_pass += d["structure"]["score"]
                struct_total += d["structure"]["max_score"]

    lat = metrics.latency_summary(latencies)
    compliance = (struct_pass / struct_total) if struct_total else 0.0
    avg_cons = sum(c for _, c in per_sample_cons) / len(per_sample_cons) if per_sample_cons else 0
    avg_cost = sum(costs) / len(costs) if costs else None
    ops = (metrics.latency_to_ops_score(lat["avg"])
           + metrics.structure_to_ops_score(compliance)
           + metrics.consistency_to_ops_score(avg_cons))

    # 점수 합산
    tp_sum = integ_sum = fp_sum = 0
    tp_max = integ_max = fp_max = 0
    used_samples = []
    for s in SAMPLES:
        key = (slug, s["id"])
        if key not in SCORES:
            continue  # 응답 없음 (sonnet 10번)
        used_samples.append(s)
        if s["expected_label"] == "vulnerable":
            tp_sum += SCORES[key]["tp"]; tp_max += 5
            integ_sum += SCORES[key]["integrity"]; integ_max += 5
        else:
            fp_sum += SCORES[key]["fp"]; fp_max += 5

    accuracy_sum = tp_sum + integ_sum + fp_sum
    accuracy_max = tp_max + integ_max + fp_max
    u = USABILITY[slug]
    usability_sum = u["explain"] + u["summary"] + u["readability"]

    grand_total = accuracy_sum + usability_sum + ops
    grand_max = accuracy_max + 15 + 15

    cons_map = dict(per_sample_cons)
    cost_str = f"${avg_cost:.4f}" if avg_cost is not None else "N/A"

    lines = [f"# 채점: {label}\n",
             f"슬러그: `{slug}` — 역할: {spec.role}\n",
             "## 자동 메트릭 요약\n",
             f"- 평균 지연: {lat['avg']}s | p95: {lat['p95']}s (n={lat['n']})",
             f"- 평균 비용/call: {cost_str}",
             f"- 구조 준수율: {struct_pass}/{struct_total} ({compliance*100:.0f}%)",
             f"- 일관성 (Jaccard 평균): {round(avg_cons, 3)}",
             f"- **운영 적합성 자동 점수: {ops} / 15**\n",
             "## 1. 정확성 (Security Accuracy) — 자동 채점\n"]

    for s in used_samples:
        key = (slug, s["id"])
        sc = SCORES[key]
        cons = cons_map.get(s["id"], 0)
        lines.append(f"### {s['id']} (expected: **{s['expected_label']}**, consistency: {cons:.2f})")
        if s["expected_label"] == "vulnerable":
            lines.append(f"- TP 수정 품질: **{sc['tp']}**/5")
            lines.append(f"- 코드 무결성: **{sc['integrity']}**/5")
        else:
            lines.append(f"- FP 필터링: **{sc['fp']}**/5")
        lines.append(f"- 메모: {sc['note']}\n")

    lines.append("## 2. 사용성 (UX/Education) — 자동 채점\n")
    lines.append(f"- 설명 난이도: **{u['explain']}**/5")
    lines.append(f"- 요약의 핵심: **{u['summary']}**/5")
    lines.append(f"- 가독성: **{u['readability']}**/5")
    lines.append(f"- 메모: {u['comment']}\n")

    lines.append("## 3. 종합 점수\n")
    lines.append(f"- 정확성: **{accuracy_sum} / {accuracy_max}**")
    lines.append(f"- 사용성: **{usability_sum} / 15**")
    lines.append(f"- 운영 적합성: **{ops} / 15**")
    lines.append(f"- **총점: {grand_total} / {grand_max} ({grand_total/grand_max*100:.1f}%)**")
    return "\n".join(lines), {
        "slug": slug, "label": label, "spec": spec,
        "lat": lat, "avg_cost": avg_cost, "compliance": compliance,
        "avg_cons": avg_cons, "ops": ops,
        "accuracy_sum": accuracy_sum, "accuracy_max": accuracy_max,
        "usability_sum": usability_sum,
        "grand_total": grand_total, "grand_max": grand_max,
        "pct": grand_total / grand_max * 100,
        "n_samples": len(used_samples),
    }


def render_report(summaries: list[dict]) -> str:
    summaries_sorted = sorted(summaries, key=lambda x: -x["pct"])
    lines = ["# SecureVibe 모델 평가 리포트\n",
             "**자동 채점 완료** — Claude(평가자)가 raw JSON 응답을 검토해 점수를 매김. ",
             "각 모델별 sample-level 평가는 `scoring_<model>.md` 참조.\n",
             "## 최종 종합 순위\n",
             "| 순위 | 모델 | 정확성 | 사용성 | 운영 | 총점 | % | 비용/call | 평균지연 |",
             "|---|---|---|---|---|---|---|---|---|"]
    for i, s in enumerate(summaries_sorted, 1):
        cost = f"${s['avg_cost']:.4f}" if s['avg_cost'] is not None else "N/A"
        lines.append(
            f"| **{i}** | **{s['label']}** ({s['n_samples']} samples) | "
            f"{s['accuracy_sum']}/{s['accuracy_max']} | "
            f"{s['usability_sum']}/15 | {s['ops']}/15 | "
            f"**{s['grand_total']}/{s['grand_max']}** | "
            f"**{s['pct']:.1f}%** | {cost} | {s['lat']['avg']}s |"
        )

    lines.append("\n## 자동 메트릭 표\n")
    lines.append("| 모델 | 평균 지연(s) | p95(s) | 비용/call | 구조 준수 | 일관성 | 운영점수/15 |")
    lines.append("|---|---|---|---|---|---|---|")
    for s in summaries_sorted:
        cost = f"${s['avg_cost']:.4f}" if s['avg_cost'] is not None else "N/A"
        lines.append(
            f"| {s['label']} | {s['lat']['avg']} | {s['lat']['p95']} | {cost} | "
            f"{s['compliance']*100:.0f}% | {round(s['avg_cons'], 3)} | {s['ops']} |"
        )

    lines.append("\n## 핵심 관찰\n")
    lines.append("- **True Positive 처리**는 모든 모델이 우수 (대부분 5/5). "
                 "단 `04_path_traversal`에서 llama가 `realpath` 미사용, "
                 "`06_weak_hash_md5`에서 haiku는 SHA-256(빠른 해시)만 적용해 감점.")
    lines.append("- **False Positive 인식** 이 가장 큰 차별점:")
    lines.append("  - `gemini-2.5-flash`: 08·09 모두 '안전, 수정 불필요' 명시 — **유일하게 완벽**")
    lines.append("  - `claude-sonnet-4.6`: 08은 정확히 FP 인지, 09는 과잉 방어")
    lines.append("  - 나머지 4 모델: FP 인지 실패. 불필요한 수정·잉여 코드 추가")
    lines.append("- **gpt-4o-mini는 sample 10에서 치명적 모순** — 주석은 'PII 출력 안 함'인데 "
                 "실제 코드는 `result[2]/result[4]` print 그대로 둠. 안전성 환각 위험.")
    lines.append("- **응답 속도/비용**: gemini-2.5-flash(2.7s, $0.0006), gpt-4o-mini(3.0s, $0.0001) 가 우수. "
                 "deepseek은 7s로 가장 느림.")
    lines.append("- **일관성(temperature 0.1, 3회 응답)**: haiku 0.91 > gpt-4o-mini 0.86 > "
                 "llama 0.81 > gemini 0.68 > sonnet 0.65 > deepseek 0.63. "
                 "haiku가 가장 안정적이지만, 그만큼 다양성 부족.")

    winner = summaries_sorted[0]
    runner = summaries_sorted[1]
    lines.append("\n## 권장 모델\n")
    lines.append(f"### `/suggest-fix` — **{winner['label']}** 권장")
    lines.append(f"- 총점 **{winner['pct']:.1f}%** ({winner['grand_total']}/{winner['grand_max']})")
    lines.append(f"- True Positive·False Positive 모두 정확, 평균 지연 {winner['lat']['avg']}s, "
                 f"비용 ${winner['avg_cost']:.4f}/call")
    lines.append(f"- 현재 베이스라인 `claude-3.5-haiku` 대비 정확성·UX 모두 우위")
    lines.append(f"\n### `/chat` — **{winner['label']}** 또는 **{runner['label']}** 권장")
    lines.append("- 챗봇은 코드 수정보다 설명 풍부함이 중요 → 사용성 점수가 높은 모델 우선")
    lines.append("- 정답지(sonnet-4.6)는 품질 최고이나 비용이 5~9배 → 사용자 챗 자유발화에는 부담")
    lines.append("\n## 운영 적용 가이드\n")
    lines.append("1. `backend/main.py:251`의 `~anthropic/claude-haiku-latest` → "
                 f"`{winner['spec'].slug}` 로 교체")
    lines.append("2. 프론트엔드 `/chat` 페이지에 모델 선택 드롭다운 추가 시, "
                 f"기본값을 `{winner['spec'].slug}`로 설정")
    lines.append("3. claude-sonnet-4.6은 비용 부담이 있으므로, 사용자가 '더 자세히' 요청 시에만 폴백으로 호출")
    return "\n".join(lines)


def main():
    summaries = []
    for spec in MODELS:
        md, summary = render_scoring(spec.slug)
        out = RES_DIR / f"scoring_{safe_filename(spec.slug)}.md"
        out.write_text(md, encoding="utf-8")
        print(f"  scoring → {out.name}")
        summaries.append(summary)
    report = render_report(summaries)
    (RES_DIR / "REPORT.md").write_text(report, encoding="utf-8")
    print("\n  REPORT.md updated")


if __name__ == "__main__":
    main()
