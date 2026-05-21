# 채점: llama-3.1-70b

슬러그: `meta-llama/llama-3.1-70b-instruct` — 역할: 오픈소스 대표

## 자동 메트릭 요약

- 평균 지연: 4.976s | p95: 9.697s (n=30)
- 평균 비용/call: $0.0002
- 구조 준수율: 60/60 (100%)
- 일관성 (Jaccard 평균): 0.811
- **운영 적합성 자동 점수: 13 / 15**

## 1. 정확성 (Security Accuracy) — 자동 채점

### 01_sql_injection (expected: **vulnerable**, consistency: 1.00)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 정확. ```lang 누락.

### 02_command_injection (expected: **vulnerable**, consistency: 0.71)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 리스트 인자.

### 03_hardcoded_secret (expected: **vulnerable**, consistency: 1.00)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 환경변수.

### 04_path_traversal (expected: **vulnerable**, consistency: 0.94)
- TP 수정 품질: **3**/5
- 코드 무결성: **5**/5
- 메모: normpath만 사용 + sep 없는 startswith — `/var/app/uploadsX` 같은 경로에 우회 가능. realpath 권장.

### 05_xss_react (expected: **vulnerable**, consistency: 0.66)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: {comment} 텍스트 렌더링.

### 06_weak_hash_md5 (expected: **vulnerable**, consistency: 0.64)
- TP 수정 품질: **4**/5
- 코드 무결성: **4**/5
- 메모: 코드는 PBKDF2 사용 — 안전. 그러나 **주석에 'bcrypt'라고 잘못 명시** (코드/주석 불일치).

### 07_unsafe_deserialization (expected: **vulnerable**, consistency: 0.67)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: json.loads.

### 08_fp_safe_param_sql (expected: **safe**, consistency: 0.93)
- FP 필터링: **2**/5
- 메모: FP 인지 못 함. ?를 :post_id로 교체 — 의미 없는 변경.

### 09_fp_safe_subprocess (expected: **safe**, consistency: 0.84)
- FP 필터링: **3**/5
- 메모: FP 일부 인지 ('false positive를 피하기 위해'). 그러나 Popen으로 무의미 리팩토링.

### 10_real_main_py_login (expected: **vulnerable**, consistency: 0.72)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: env vars + 'Login success' 단순 출력. PII 제거.

## 2. 사용성 (UX/Education) — 자동 채점

- 설명 난이도: **3**/5
- 요약의 핵심: **3**/5
- 가독성: **3**/5
- 메모: 기능적이지만 짧고 일반적. ```lang 일관 누락. 입문자에겐 불충분할 수 있음.

## 3. 종합 점수

- 정확성: **81 / 90**
- 사용성: **9 / 15**
- 운영 적합성: **13 / 15**
- **총점: 103 / 120 (85.8%)**