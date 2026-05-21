# 채점: deepseek-chat

슬러그: `deepseek/deepseek-chat` — 역할: DeepSeek-V3 (코딩 가성비)

## 자동 메트릭 요약

- 평균 지연: 7.021s | p95: 14.167s (n=30)
- 평균 비용/call: $0.0001
- 구조 준수율: 60/60 (100%)
- 일관성 (Jaccard 평균): 0.629
- **운영 적합성 자동 점수: 9 / 15**

## 1. 정확성 (Security Accuracy) — 자동 채점

### 01_sql_injection (expected: **vulnerable**, consistency: 0.75)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 정확. 단 '주석:' 추가 섹션은 형식 일탈.

### 02_command_injection (expected: **vulnerable**, consistency: 0.60)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 리스트 인자. ```lang 누락.

### 03_hardcoded_secret (expected: **vulnerable**, consistency: 0.70)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: getenv 사용. 변수명 유지.

### 04_path_traversal (expected: **vulnerable**, consistency: 0.49)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: normpath + sep 포함 startswith 검증.

### 05_xss_react (expected: **vulnerable**, consistency: 0.73)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: DOMPurify 사용.

### 06_weak_hash_md5 (expected: **vulnerable**, consistency: 0.56)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: PBKDF2-HMAC-SHA256 + 100k iter. 가장 견고한 구현.

### 07_unsafe_deserialization (expected: **vulnerable**, consistency: 0.71)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: json.loads로 교체.

### 08_fp_safe_param_sql (expected: **safe**, consistency: 0.67)
- FP 필터링: **2**/5
- 메모: FP 인지 못 함. '정수 변환으로 SQL Injection 방지' 라고 잘못 설명.

### 09_fp_safe_subprocess (expected: **safe**, consistency: 0.53)
- FP 필터링: **3**/5
- 메모: check=True 추가만. '이미 안전한 구조였지만'으로 일부 인지.

### 10_real_main_py_login (expected: **vulnerable**, consistency: 0.55)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: env + logging + 예외 처리까지. 견고.

## 2. 사용성 (UX/Education) — 자동 채점

- 설명 난이도: **4**/5
- 요약의 핵심: **4**/5
- 가독성: **3**/5
- 메모: 내용은 정확하지만 ```lang 자주 누락 + '주석:' 같은 형식 일탈 잦음.

## 3. 종합 점수

- 정확성: **85 / 90**
- 사용성: **11 / 15**
- 운영 적합성: **9 / 15**
- **총점: 105 / 120 (87.5%)**