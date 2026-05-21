# 채점: claude-sonnet-4.6

슬러그: `anthropic/claude-sonnet-4.6` — 역할: 정답지 (최고 품질 벤치마크)

## 자동 메트릭 요약

- 평균 지연: 5.541s | p95: 7.809s (n=27)
- 평균 비용/call: $0.0055
- 구조 준수율: 54/54 (100%)
- 일관성 (Jaccard 평균): 0.651
- **운영 적합성 자동 점수: 11 / 15**

## 1. 정확성 (Security Accuracy) — 자동 채점

### 01_sql_injection (expected: **vulnerable**, consistency: 0.66)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: 파라미터 바인딩 + 상세 해설.

### 02_command_injection (expected: **vulnerable**, consistency: 0.69)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: shell=False 명시 + 메타문자 설명까지.

### 03_hardcoded_secret (expected: **vulnerable**, consistency: 0.74)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: os.environ[]로 누락 시 즉시 실패 — 더 안전.

### 04_path_traversal (expected: **vulnerable**, consistency: 0.73)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: realpath + sep 보정 — 가장 정확한 방어.

### 05_xss_react (expected: **vulnerable**, consistency: 0.98)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: dangerouslySetInnerHTML 자체 제거 (가장 안전).

### 06_weak_hash_md5 (expected: **vulnerable**, consistency: 0.69)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: bcrypt 사용 + 타이밍 공격 언급.

### 07_unsafe_deserialization (expected: **vulnerable**, consistency: 0.87)
- TP 수정 품질: **5**/5
- 코드 무결성: **5**/5
- 메모: json + 타입 체크 + HTTPException 처리까지.

### 08_fp_safe_param_sql (expected: **safe**, consistency: 0.54)
- FP 필터링: **5**/5
- 메모: **'Semgrep 오탐(False Positive)'을 명시적으로 인지**. with문은 보너스.

### 09_fp_safe_subprocess (expected: **safe**, consistency: 0.60)
- FP 필터링: **2**/5
- 메모: 안전한데도 shlex.quote + env={} 과잉 방어. FP 인지 실패.

## 2. 사용성 (UX/Education) — 자동 채점

- 설명 난이도: **5**/5
- 요약의 핵심: **5**/5
- 가독성: **5**/5
- 메모: '왜 위험한지'를 가장 풍부하게 설명. 다소 길지만 교육 효과 최고.

## 3. 종합 점수

- 정확성: **77 / 80**
- 사용성: **15 / 15**
- 운영 적합성: **11 / 15**
- **총점: 103 / 110 (93.6%)**