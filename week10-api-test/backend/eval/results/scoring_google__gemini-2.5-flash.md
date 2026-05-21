# 채점: gemini-2.5-flash

슬러그: `google/gemini-2.5-flash` — 역할: 가성비 + 속도

## 자동 메트릭 요약

- 평균 지연: 2.72s | p95: 6.871s (n=30)
- 평균 비용/call: $0.0006
- 구조 준수율: 60/60 (100%)
- 일관성 (Jaccard 평균): 0.676
- **운영 적합성 자동 점수: 13 / 15**

## 1. 정확성 (Security Accuracy) — 자동 채점

### 01_sql_injection (expected: **vulnerable**, consistency: 0.81)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 파라미터 바인딩 + 친절한 도입부.

### 02_command_injection (expected: **vulnerable**, consistency: 0.81)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 리스트 인자.

### 03_hardcoded_secret (expected: **vulnerable**, consistency: 0.68)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 환경변수 + 주석 친절.

### 04_path_traversal (expected: **vulnerable**, consistency: 0.44)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: realpath + 검증. 도입 설명 길지만 명확.

### 05_xss_react (expected: **vulnerable**, consistency: 0.55)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: {comment} 텍스트 렌더링.

### 06_weak_hash_md5 (expected: **vulnerable**, consistency: 0.52)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: bcrypt + 자동 salt.

### 07_unsafe_deserialization (expected: **vulnerable**, consistency: 0.72)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: json.loads.

### 08_fp_safe_param_sql (expected: **safe**, consistency: 0.97)
- FP 필터링: **5**/5
- 메모: **'이미 SQL Injection에 안전합니다. Semgrep이 잘못 탐지한 것'**으로 정확히 FP 판단.

### 09_fp_safe_subprocess (expected: **safe**, consistency: 0.65)
- FP 필터링: **5**/5
- 메모: **'Semgrep이 잘못된 긍정(false positive)을 보고한 경우'**로 명시. 수정 없음 권고.

### 10_real_main_py_login (expected: **vulnerable**, consistency: 0.61)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: env vars + 자격증명 검증 + PII 마스킹. 가장 견고.

## 2. 사용성 (UX/Education) — 자동 채점

- 설명 난이도: **5**/5
- 요약의 핵심: **5**/5
- 가독성: **5**/5
- 메모: 도입부 설명 + 코드 + 요약 3-part 구조 일관. 한국어 자연스러움.

## 3. 종합 점수

- 정확성: **90 / 90**
- 사용성: **15 / 15**
- 운영 적합성: **13 / 15**
- **총점: 118 / 120 (98.3%)**