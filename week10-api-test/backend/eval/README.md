# SecureVibe 모델 평가 하네스

`/suggest-fix` 엔드포인트에서 사용할 최적의 LLM을 데이터 기반으로 선정하기 위한 평가 도구.

## 구조

```
backend/eval/
├── run_eval.py        # 메인 실행 (CLI)
├── prompts.py         # main.py와 동기화된 프롬프트
├── models.py          # 6개 모델 슬러그 + OpenRouter 가격표
├── metrics.py         # 구조 준수·일관성·운영점수 환산
├── samples/           # 10개 평가 샘플 (vulnerable 7 + safe 2 + 실제 코드 1)
└── results/
    ├── raw/<model>__<sample>__r<n>.json   # 원본 응답
    ├── scoring_<model>.md                 # 수동 채점 체크리스트
    └── REPORT.md                          # 자동 메트릭 비교 표
```

## 평가 대상 모델 (6종)

| 슬러그 | 역할 |
|---|---|
| `anthropic/claude-3.5-sonnet` | 정답지 (최고 품질 벤치마크) |
| `anthropic/claude-3.5-haiku` | 현재 베이스라인 |
| `openai/gpt-4o-mini` | 모던 OpenAI 중급 |
| `google/gemini-flash-1.5` | 가성비 + 속도 |
| `deepseek/deepseek-chat` | DeepSeek-V3 |
| `meta-llama/llama-3.1-70b-instruct` | 오픈소스 |

## 사전 준비

```powershell
# backend/.env 에 OPENROUTER_API_KEY 필요 (main.py와 동일)
# 의존성은 main.py와 공유: openai, python-dotenv (이미 설치됨)
```

## 사용법

### 1. Dry run — API 호출 없이 프롬프트 확인

```powershell
python backend/eval/run_eval.py --dry-run
```

### 2. Smoke test — 1 모델 × 1 샘플 × 1 회

```powershell
python backend/eval/run_eval.py --models anthropic/claude-3.5-haiku --samples 01_sql_injection --runs 1 -y
```

### 3. 풀 런 — 6 모델 × 10 샘플 × 3 회 (180 call, ~$0.5–$2)

```powershell
python backend/eval/run_eval.py
# 비용 확인 후 y 입력
```

### 4. 부분 재실행

```powershell
# 모델만 한정
python backend/eval/run_eval.py --models openai/gpt-4o-mini,deepseek/deepseek-chat

# 샘플만 한정
python backend/eval/run_eval.py --samples 01_sql_injection,08_fp_safe_param_sql
```

### 5. 채점 후 리포트 재집계

```powershell
# raw/ 결과는 그대로 두고 REPORT.md, scoring_*.md만 다시 생성
python backend/eval/run_eval.py --aggregate-only
```

## 채점 워크플로우

1. **풀 런 실행** → `results/raw/`에 180개 JSON 생성, `scoring_<model>.md` 6개 + `REPORT.md` 자동 생성
2. **수동 채점** — 각 `scoring_*.md`를 에디터로 열어 9개 체크포인트별 1~5점 입력
   - 정확성: True Positive 수정 품질, 코드 무결성, False Positive 필터링
   - 사용성: 설명 난이도, 요약 핵심, 가독성
   - (운영 적합성은 자동 산정됨)
3. **총점 합산** — 각 `scoring_*.md` 하단의 합계를 `REPORT.md` 표에 직접 추가
4. **권장 모델 결정** — `REPORT.md` 하단의 "권장 모델" 섹션 작성

## 자동 vs 수동 메트릭

| 항목 | 측정 방식 |
|---|---|
| 지연시간 (avg, p95) | 자동 (time.perf_counter) |
| 토큰 사용량 + 비용 | 자동 (OpenRouter usage + 가격표) |
| 구조 준수 (코드블록 + 한줄요약) | 자동 (정규식) |
| 일관성 (3회 응답 유사도) | 자동 (Jaccard) |
| **정확성 — TP 수정 품질** | **수동 (1~5점)** |
| **정확성 — 코드 무결성** | **수동 (1~5점)** |
| **정확성 — FP 필터링** | **수동 (1~5점)** |
| **사용성 — 설명 난이도** | **수동 (1~5점)** |
| **사용성 — 요약 핵심** | **수동 (1~5점)** |
| **사용성 — 가독성** | **수동 (1~5점)** |

## 비용 추정 (180 call 기준, 모델 평균)

- claude-3.5-sonnet: ~$1.20 (전체의 70%)
- llama-3.1-70b: ~$0.07
- claude-3.5-haiku: ~$0.05
- gpt-4o-mini: ~$0.015
- deepseek-chat: ~$0.015
- gemini-flash-1.5: ~$0.008

→ 총 ~$1.4. sonnet을 빼면 ~$0.2.

## 알려진 제한

- 수동 채점은 평가자 주관 — 팀원 3명이 분담 시 평가자별 편향 가능
- 6개 모델 외 후보 추가는 `models.py`에 ModelSpec 추가만 하면 됨
- `--chat` 모드는 아직 미구현 — 이번 작업은 `/suggest-fix` 단일 엔드포인트 평가만
