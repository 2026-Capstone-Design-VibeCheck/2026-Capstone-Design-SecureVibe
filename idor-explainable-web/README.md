# SecureVibe IDOR/BOLA Analyzer

OpenAPI 명세를 기반으로 BOLA/IDOR 의심 후보를 탐지하고, 대상 API의 HTTP 실행 결과와 Links2CPN replay 결과를 결합하여 실행별 분석 결과를 제공하는 웹 애플리케이션입니다.

## 핵심 기능

- OpenAPI JSON/YAML 파일 또는 URL 입력
- OpenAPI 기반 IDOR/BOLA 정적 후보 탐지
- 대상 API에 대한 HTTP 동적 검증
- JSONL 이벤트 로그 자동 생성 및 정규화
- 외부 Links2CPN 저장소 실행
- HTTP 결과와 Links2CPN replay 결과 결합
- 정적 후보, 동적 상태 및 CPN evidence를 웹 화면에 표시
- `GET`, `HEAD`, `OPTIONS` 중심의 안전한 기본 실행
- 실행별 분석 결과를 보고서 형태로 확인

> **주의:** HTTP `200` 응답만으로 IDOR/BOLA 취약점을 확정하지 않습니다. owner baseline, cross-owner 요청, 권한 비교 및 응답 본문 비교가 필요합니다.

---

## 1. 연구 및 저장소 원칙

이 프로젝트는 Links2CPN 원본 저장소를 변경하지 않는 방식으로 연동합니다.

- Links2CPN 원본 소스는 수정하지 않습니다.
- Links2CPN 저장소를 SecureVibe 프로젝트 안으로 복사하지 않습니다.
- SecureVibe의 adapter 파일만 수정합니다.
- Links2CPN은 별도의 로컬 저장소와 가상환경에서 실행합니다.
- SecureVibe는 `subprocess`를 통해 Links2CPN 원본의 replay entry point를 호출합니다.
- CPN 매칭 실패를 취약점 확정으로 해석하지 않습니다.

논문 실험에서는 다음을 별도로 기록하는 것을 권장합니다.

1. 원본 Links2CPN 저장소의 commit 또는 release 정보
2. SecureVibe adapter의 변경 내역
3. OpenAPI 문서의 해시
4. 생성된 이벤트 로그
5. Links2CPN replay 출력
6. SecureVibe 최종 분석 결과

---

## 2. 프로젝트 구조

GitHub 저장소에는 다음과 같은 구조로 업로드합니다.

```text
SecureVibe/
├─ app/
│  ├─ __init__.py
│  ├─ main.py
│  ├─ links2cpn_two_stage_detector.py
│  ├─ bola_idor_detector.py
│  └─ explain.py
├─ static/
│  ├─ index.html
│  ├─ app.js
│  └─ style.css
├─ requirements.txt
├─ README.md
└─ .gitignore
```

Links2CPN 원본은 이 저장소에 포함하지 않습니다.

```text
SecureVibe 저장소/
└─ Links2CPN 원본 없음

별도 로컬 경로/
└─ openapi-links-to-CPNs/
```

---

## 3. 설치 환경

권장 환경:

- Windows 10/11 또는 Linux
- Python 3.12
- Git
- 별도 체크아웃한 Links2CPN 원본 저장소
- 대상 API 서버

### 3.1 SecureVibe 저장소 복제

```bash
git clone <YOUR_SECUREVIBE_REPOSITORY_URL>
cd SecureVibe
```

Windows CMD에서는 다음과 같이 실행할 수 있습니다.

```cmd
git clone <YOUR_SECUREVIBE_REPOSITORY_URL>
cd SecureVibe
```

`<YOUR_SECUREVIBE_REPOSITORY_URL>`은 GitHub에 생성한 SecureVibe 저장소 주소로 변경합니다.

---

## 4. Python 가상환경 및 의존성 설치

### 4.1 가상환경 생성

Windows CMD:

```cmd
py -3.12 -m venv .venv
.venv\Scripts\activate
```

Linux/macOS:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

### 4.2 `requirements.txt` 교체

이 프로젝트에서 Links2CPN을 사용하려면 기존 `requirements.txt`를 이 저장소에 포함된 `requirements.txt`로 교체해야 합니다.

즉, 다음 파일을 SecureVibe 프로젝트 루트에 저장합니다.

```text
SecureVibe/requirements.txt
```

이 `requirements.txt`에는 Links2CPN 실행에 필요한 OpenAPI 검증·분석 및 SNAKES 관련 의존성이 포함되어 있습니다. 특히 다음 항목이 포함되어 있어야 합니다.

```text
openapi-schema-validator==0.2.3
openapi-spec-validator==0.4.0
prance==0.22.11.4.0
PyYAML==6.0.2
ruamel.yaml==0.17.21
SNAKES==0.9.32
```

기존 가상환경에 설치된 패키지와 충돌할 수 있으므로, 처음 설치할 때는 새 가상환경을 사용하는 것을 권장합니다.

### 4.3 SecureVibe 의존성 설치

```cmd
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

설치 후 확인:

```cmd
python -m pip check
```

> `requirements.txt`를 교체한다고 해서 Links2CPN 원본 코드가 SecureVibe에 복사되거나 수정되는 것은 아닙니다. 이 파일은 SecureVibe와 Links2CPN 실행에 필요한 Python 패키지를 설치하기 위한 의존성 목록입니다.

---

## 5. Links2CPN 별도 설치

Links2CPN은 SecureVibe 저장소와 별도로 체크아웃합니다.

```cmd
cd /d "<WORKSPACE>"
git clone <LINKS2CPN_REPOSITORY_URL> openapi-links-to-CPNs
cd openapi-links-to-CPNs
```

Links2CPN 전용 가상환경을 생성합니다.

```cmd
py -3.12 -m venv .venv
.venv\Scripts\activate
```

Links2CPN 원본 저장소에 별도의 설치 문서나 requirements 파일이 있다면 그 문서를 우선 따릅니다.

예시:

```cmd
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

설치 후 SecureVibe의 작업 디렉터리로 돌아옵니다.

```cmd
cd /d "<SECUREVIBE_DIRECTORY>"
.venv\Scripts\activate
```

> SecureVibe용 `.venv`와 Links2CPN용 `.venv`는 서로 다른 가상환경입니다. SecureVibe는 Links2CPN용 Python 실행 파일을 사용하여 원본 replay 프로그램을 호출합니다.

---

## 6. Links2CPN 경로 구조 확인

현재 SecureVibe adapter는 다음 entry point를 기본으로 사용합니다.

```text
<LINKS2CPN_REPOSITORY>/src/openapiLinks2CPNs/execute_replay.py
```

Windows에서 확인합니다.

```cmd
dir "<LINKS2CPN_REPOSITORY>\src\openapiLinks2CPNs\execute_replay.py"
dir "<LINKS2CPN_REPOSITORY>\.venv\Scripts\python.exe"
```

Linux/macOS에서 확인합니다.

```bash
ls "<LINKS2CPN_REPOSITORY>/src/openapiLinks2CPNs/execute_replay.py"
ls "<LINKS2CPN_REPOSITORY>/.venv/bin/python"
```

실제 Links2CPN의 파일 구조 또는 CLI 인자가 다르면 Links2CPN 원본을 수정하지 않습니다. 다음 SecureVibe adapter의 경로와 `command` 배열만 실제 구조에 맞게 수정합니다.

```text
app/links2cpn_two_stage_detector.py
```

조정 가능한 항목:

- replay entry point 경로
- Python 실행 파일 경로
- subprocess working directory
- OpenAPI 파일 인자 순서
- 이벤트 로그 파일 인자 순서
- timeout

---

## 7. SecureVibe 실행

프로젝트 루트에서 실행합니다.

```cmd
python -m py_compile app\main.py
python -m py_compile app\links2cpn_two_stage_detector.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Linux/macOS:

```bash
python -m py_compile app/main.py
python -m py_compile app/links2cpn_two_stage_detector.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

브라우저에서 접속합니다.

```text
http://127.0.0.1:8000
```

서버 종료:

```text
Ctrl + C
```

---

## 8. 웹 화면 입력값

| 입력 항목 | 입력 방법 |
|---|---|
| GitHub 저장소 URL | 분석 대상 프로젝트 저장소 URL |
| OpenAPI URL | 대상 API의 OpenAPI JSON/YAML URL |
| 대상 API 호스트 | 실제 테스트할 API의 기본 URL |
| User A 토큰 | 필요한 경우 access token 입력 |
| Actor ID | 요청을 수행하는 사용자 식별자 |
| Links2CPN 경로 | 별도로 체크아웃한 Links2CPN 원본 경로 |
| 객체·Query 파라미터 | ID, query 및 body에 사용할 JSON 값 |

파라미터 JSON 예시:

```json
{
  "userId": "cross-owner-user-id",
  "resourceId": "target-resource-id",
  "productId": "target-product-id",
  "name": "test",
  "q": "test",
  "role": "user",
  "orderId": "target-order-id",
  "cardId": "target-card-id"
}
```

토큰을 입력하는 경우 전체 토큰을 README, GitHub, 로그, 보고서에 저장하지 않습니다. 토큰이 노출되었다면 폐기하고 재발급합니다.

### 안전한 첫 실행

처음에는 다음 옵션을 해제합니다.

```text
POST/PUT/PATCH/DELETE 실행 허용: 해제
```

이 경우 기본적으로 다음 method만 실행합니다.

```text
GET, HEAD, OPTIONS
```

데이터 변경 요청이 필요한 경우에만 옵션을 선택합니다.

```text
POST/PUT/PATCH/DELETE 실행 허용: 선택
```

---

## 9. Links2CPN 연동 과정

SecureVibe의 분석 요청은 다음 순서로 처리됩니다.

```text
OpenAPI 입력
    ↓
정적 IDOR/BOLA 후보 분석
    ↓
대상 API HTTP 요청
    ↓
JSONL 이벤트 로그 생성
    ↓
이벤트 로그 정규화
    ↓
Links2CPN 원본 replay 실행
    ↓
replay 출력 파싱
    ↓
HTTP 이벤트와 CPN evidence 병합
    ↓
웹 분석 결과 표시
```

SecureVibe는 Links2CPN 원본을 import하여 내부 로직을 복사하지 않습니다. 별도 저장소에 있는 실행 파일을 외부 프로세스로 호출합니다.

---

## 10. 이벤트 JSONL 형식

각 이벤트에는 다음 필드를 유지합니다.

```json
{
  "method": "GET",
  "uri": "/api/resources/00000000-0000-0000-0000-000000000002",
  "statusCode": 200,
  "ip": "userA",
  "headerAuthorization": "Bearer <REDACTED>",
  "requestBody": {},
  "openapiPath": "/api/resources/{resource_id}",
  "operationId": "getResource"
}
```

Links2CPN transition 검색에서 중요한 필드는 다음입니다.

- `method`
- `uri`
- `statusCode`

`message` 필드만 추가한다고 해서 `not-present-in-model` 문제가 해결되는 것은 아닙니다. 실제 모델 transition과 이벤트의 method, URI, 상태 코드가 호환되어야 합니다.

---

## 11. 분석 결과 해석

### HTTP 상태 코드

| 상태 코드 | 의미 |
|---:|---|
| `200` | 성공. 타인 데이터가 반환되면 동적 BOLA 후보가 될 수 있음 |
| `201` | 리소스 생성 성공 |
| `400` | 잘못된 요청 또는 비즈니스 검증 실패 가능성 |
| `401` | 인증 실패, 토큰 누락 또는 토큰 만료 |
| `403` | 권한 거부 |
| `404` | 객체 없음 또는 존재 은닉 가능성 |
| `422` | 요청 형식, 필수 파라미터 또는 body 검증 실패 |
| `500` | 대상 API 또는 테스트 환경 오류 |

### Links2CPN 상태

| 상태 | 의미 |
|---|---|
| `confirmed-flow` | replay 출력에서 해당 흐름이 모델에 존재함 |
| `not-present-in-cpn` | replay line이 모델에 존재하지 않음 |
| `transition-not-enabled` | 관련 transition은 있으나 실행되지 않음 |
| `observed-not-in-cpn` | HTTP 이벤트는 관찰되었지만 CPN 매칭 근거가 없음 |
| `not-replayed` | replay 결과가 없음 |

다음 두 결과는 서로 다릅니다.

```text
HTTP 요청 실행 성공 != Links2CPN 모델 매칭 성공
```

따라서 HTTP 동적 결과, CPN 상태 및 최종 취약점 판정을 분리해서 기록합니다.

---

## 12. `not-present-in-model` 확인 절차

1. SecureVibe가 생성한 이벤트 JSONL을 확인합니다.
2. `method`, `uri`, `statusCode`가 올바른지 확인합니다.
3. `uri`가 전체 URL이 아닌 경로 형식인지 확인합니다.
4. OpenAPI path template과 실제 URI의 parameter 위치가 일치하는지 확인합니다.
5. Links2CPN 모델 생성에 사용한 OpenAPI 문서와 현재 입력 문서가 동일한지 확인합니다.
6. 해당 endpoint와 method가 CPN 모델에 포함되어 있는지 확인합니다.
7. 모델에 없는 endpoint의 replay 결과를 취약점 확정 근거로 사용하지 않습니다.

---

## 13. CLI 2단계 분석

```cmd
python -m app.links2cpn_two_stage_detector ^
  "<OPENAPI_FILE>" ^
  --event-log "<EVENT_LOG_FILE>" ^
  --links2cpn-repo "<LINKS2CPN_REPOSITORY>" ^
  --links2cpn-python "<LINKS2CPN_REPOSITORY>\.venv\Scripts\python.exe" ^
  --output two-stage-result.json
```

Linux/macOS:

```bash
python -m app.links2cpn_two_stage_detector \
  "<OPENAPI_FILE>" \
  --event-log "<EVENT_LOG_FILE>" \
  --links2cpn-repo "<LINKS2CPN_REPOSITORY>" \
  --links2cpn-python "<LINKS2CPN_REPOSITORY>/.venv/bin/python" \
  --output two-stage-result.json
```

실제 CLI 인자 형식은 Links2CPN 원본 entry point에 맞춰 확인합니다. 형식이 다르면 원본이 아니라 `app/links2cpn_two_stage_detector.py`의 `command` 배열만 수정합니다.

---

## 14. GitHub 업로드

### 14.1 `.gitignore` 작성

다음 파일과 폴더는 GitHub에 올리지 않는 것을 권장합니다.

```gitignore
.venv/
__pycache__/
*.py[cod]
.env
*.log
*.db
*.sqlite
*.sqlite3
reports/
outputs/
results/
secrets/
*.jsonl
*.token
```

OpenAPI 문서나 이벤트 로그에 개인정보, JWT, API key가 포함되어 있으면 반드시 제거하거나 비공개 저장소를 사용합니다.

### 14.2 Git 초기화 및 커밋

```cmd
git init
git add app static requirements.txt README.md .gitignore
git commit -m "Add SecureVibe IDOR BOLA analyzer with Links2CPN adapter"
```

### 14.3 GitHub 원격 저장소 연결

```cmd
git branch -M main
git remote add origin <YOUR_SECUREVIBE_REPOSITORY_URL>
git push -u origin main
```

GitHub 저장소 주소로 이동하여 다음 파일이 업로드되었는지 확인합니다.

```text
README.md
requirements.txt
app/
static/
.gitignore
```

Links2CPN 원본 폴더가 SecureVibe 저장소에 포함되어 있지 않은지 확인합니다.

---

## 15. 문제 해결

### SecureVibe import 오류

프로젝트 루트에서 실행합니다.

```cmd
python -m py_compile app\main.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Links2CPN Python을 찾지 못하는 경우

```cmd
dir "<LINKS2CPN_REPOSITORY>\.venv\Scripts\python.exe"
```

Linux/macOS:

```bash
ls "<LINKS2CPN_REPOSITORY>/.venv/bin/python"
```

### replay 결과가 비어 있는 경우

다음을 확인합니다.

- 이벤트 로그 파일이 비어 있지 않은지
- JSONL 각 줄이 유효한 JSON 객체인지
- `method`가 HTTP method인지
- `uri`가 올바른 경로인지
- `statusCode`가 정수인지
- OpenAPI path와 이벤트 URI가 일치하는지
- Links2CPN entry point가 실제로 존재하는지
- subprocess에 전달하는 CLI 인자 순서가 맞는지

---

## 16. 제한사항

1. 웹 입력의 `parameter_examples` 값이 모든 자동 요청 생성 과정에 직접 반영되지 않을 수 있습니다.
2. `POST`, `PUT`, `PATCH` 요청 body가 빈 JSON 객체로 생성될 수 있습니다.
3. `GET` 요청의 필수 query parameter 자동 생성은 제한적일 수 있습니다.
4. `not-present-in-model`은 CPN 모델 매칭 실패를 의미하며, 곧바로 취약점이 없다는 뜻도 아니고 취약점 확정이라는 뜻도 아닙니다.
5. 목록 endpoint와 사용자 소유 객체 endpoint는 동일한 기준으로 IDOR를 판정하지 않습니다.
6. 실제 연구 결론에는 owner baseline과 cross-owner 비교가 필요합니다.

---

## 17. 라이선스 및 인용

SecureVibe 자체 코드와 Links2CPN 원본의 라이선스를 각각 확인하여 준수합니다.

Links2CPN을 논문에 인용하는 경우:

- 원본 저장소의 공식 citation 정보를 사용합니다.
- 원본 코드와 SecureVibe adapter 변경을 구분하여 기록합니다.
- 실험에 사용한 commit, OpenAPI 문서, 이벤트 로그 및 결과를 별도로 보관합니다.
