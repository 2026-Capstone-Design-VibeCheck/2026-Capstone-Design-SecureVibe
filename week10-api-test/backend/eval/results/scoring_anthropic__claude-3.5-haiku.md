# 채점: claude-3.5-haiku

슬러그: `anthropic/claude-3.5-haiku` — 역할: 현재 /suggest-fix 베이스라인 + 속도

## 자동 메트릭 요약

- 평균 지연: 3.851s | p95: 5.711s (n=30)
- 평균 비용/call: $0.0012
- 구조 준수율: 60/60 (100%)
- 일관성 (Jaccard 평균): 0.907
- **운영 적합성 자동 점수: 13 / 15**

## 1. 정확성 (Security Accuracy) — 자동 채점

### 01_sql_injection (expected: **vulnerable**, consistency: 1.00)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 파라미터 바인딩, 함수 시그니처 그대로.

### 02_command_injection (expected: **vulnerable**, consistency: 0.95)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 리스트 인자 + shell 미사용. shlex import만 잉여.

### 03_hardcoded_secret (expected: **vulnerable**, consistency: 0.97)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: dotenv + getenv. 변수명 유지.

### 04_path_traversal (expected: **vulnerable**, consistency: 0.96)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: basename + normpath + startswith 다중 방어.

### 05_xss_react (expected: **vulnerable**, consistency: 0.82)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: DOMPurify 사용. HTML 허용 케이스 고려.

### 06_weak_hash_md5 (expected: **vulnerable**, consistency: 0.80)
- TP 수정 품질: **3**/5
- 코드 무결성: **5**/5
- 메모: SHA-256+salt 사용. 빠른 해시라 패스워드용으론 여전히 약함 (bcrypt/PBKDF2 권장).

### 07_unsafe_deserialization (expected: **vulnerable**, consistency: 0.90)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: json.loads 교체. 깔끔.

### 08_fp_safe_param_sql (expected: **safe**, consistency: 0.88)
- FP 필터링: **2**/5
- 메모: FP 인지 못 함. connection.close() 추가는 가독성 개선이지만 취약점 무관.

### 09_fp_safe_subprocess (expected: **safe**, consistency: 0.89)
- FP 필터링: **2**/5
- 메모: FP 인지 못 함. shlex.quote 잉여 추가.

### 10_real_main_py_login (expected: **vulnerable**, consistency: 0.91)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: env vars + logging.info(아이디만). 비밀번호 로그 제거.

## 2. 사용성 (UX/Education) — 자동 채점

- 설명 난이도: **4**/5
- 요약의 핵심: **5**/5
- 가독성: **5**/5
- 메모: 짧고 명확. ```python 일관. 입문자도 따라가기 쉬움.

## 3. 종합 점수

- 정확성: **82 / 90**
- 사용성: **14 / 15**
- 운영 적합성: **13 / 15**
- **총점: 109 / 120 (90.8%)**