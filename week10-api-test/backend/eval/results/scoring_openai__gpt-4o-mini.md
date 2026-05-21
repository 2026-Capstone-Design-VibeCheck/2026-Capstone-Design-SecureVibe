# 채점: gpt-4o-mini

슬러그: `openai/gpt-4o-mini` — 역할: 모던 OpenAI 중급

## 자동 메트릭 요약

- 평균 지연: 3.024s | p95: 5.417s (n=30)
- 평균 비용/call: $0.0001
- 구조 준수율: 60/60 (100%)
- 일관성 (Jaccard 평균): 0.863
- **운영 적합성 자동 점수: 14 / 15**

## 1. 정확성 (Security Accuracy) — 자동 채점

### 01_sql_injection (expected: **vulnerable**, consistency: 0.78)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 정확. 요약이 괄호로 감싸진 형식 일탈.

### 02_command_injection (expected: **vulnerable**, consistency: 0.80)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 리스트 인자.

### 03_hardcoded_secret (expected: **vulnerable**, consistency: 0.85)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: getenv. 깔끔.

### 04_path_traversal (expected: **vulnerable**, consistency: 0.86)
- TP 수정 품질: **4**/5
- 코드 무결성: **5**/5
- 메모: basename만으로 처리 — flat dir 가정에선 안전하지만 컨테인먼트 검증 부재.

### 05_xss_react (expected: **vulnerable**, consistency: 0.94)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: {comment} 텍스트 렌더링.

### 06_weak_hash_md5 (expected: **vulnerable**, consistency: 0.89)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: PBKDF2 100k + salt 결합 저장 — 견고.

### 07_unsafe_deserialization (expected: **vulnerable**, consistency: 0.96)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: json.loads.

### 08_fp_safe_param_sql (expected: **safe**, consistency: 0.96)
- FP 필터링: **2**/5
- 메모: FP 인지 못 함. 게다가 isdigit() 으로 변경해 **음수 ID 거부 부작용** 도입.

### 09_fp_safe_subprocess (expected: **safe**, consistency: 0.72)
- FP 필터링: **2**/5
- 메모: FP 인지 못 함. `["..."] + [action]` 은 원본과 동일 — 무의미 변경.

### 10_real_main_py_login (expected: **vulnerable**, consistency: 0.87)
- TP 수정 품질: **2**/5
- 코드 무결성: **5**/5
- 메모: **치명적 결함: 주석은 'PII 출력 안 함'이라 했는데 result[2]/result[4] print는 그대로 남김.** 코드와 주장이 모순.

## 2. 사용성 (UX/Education) — 자동 채점

- 설명 난이도: **3**/5
- 요약의 핵심: **3**/5
- 가독성: **4**/5
- 메모: 매우 간결. 빠르지만 '왜'에 대한 설명이 부족한 경우가 많음.

## 3. 종합 점수

- 정확성: **80 / 90**
- 사용성: **10 / 15**
- 운영 적합성: **14 / 15**
- **총점: 104 / 120 (86.7%)**