# SecureVibe IDOR/BOLA Analyzer

OpenAPI 명세를 기반으로 BOLA/IDOR 의심 후보를 찾고, 대상 API에 대한 안전한 HTTP 요청 결과와 Links2CPN replay 결과를 결합하여 실행별 분석 결과를 웹에서 확인하는 프로젝트입니다.

> **연구 원칙**
>
> - Links2CPN 원본 저장소는 수정하지 않습니다.
> - Links2CPN 저장소를 SecureVibe 안으로 복사하지 않습니다.
> - SecureVibe의 adapter 코드인 `app/links2cpn_two_stage_detector.py`만 수정·관리합니다.
> - 기본 실행은 `GET`, `HEAD`, `OPTIONS`만 수행합니다.
> - `POST`, `PUT`, `PATCH`, `DELETE`는 체크박스를 선택한 경우에만 실행됩니다.
> - `200` 응답은 자동으로 확정 취약점으로 판정하지 않습니다. 소유자 baseline, 권한 비교, 응답 데이터 비교가 필요합니다.

---

## 1. 프로젝트 구성

SecureVibe 프로젝트의 기본 구조는 다음과 같습니다.

```text
idor-explainable-web/
├─ app/
│  ├─ main.py
│  ├─ links2cpn_two_stage_detector.py
│  ├─ bola_idor_detector.py
│  └─ explain.py
├─ static/
│  ├─ index.html
│  ├─ app.js
│  └─ style.css
└─ requirements.txt
```

현재 웹 API의 주요 동작은 다음과 같습니다.

1. OpenAPI 파일 또는 OpenAPI URL을 입력합니다.
2. OpenAPI 정적 분석으로 ID 후보를 찾습니다.
3. 대상 API 호스트가 입력되면 OpenAPI의 endpoint를 읽어 HTTP 요청을 생성합니다.
4. 생성된 JSONL 이벤트 로그를 정규화합니다.
5. 외부 경로에 있는 Links2CPN을 subprocess로 실행합니다.
6. Links2CPN 출력과 이벤트 로그를 endpoint/method 기준으로 병합합니다.
7. 정적 후보, HTTP 결과, CPN 상태를 포함한 JSON 응답을 웹 화면에 표시합니다.

---

## 2. 사전 준비

### 2.1 필요한 프로그램

Windows 환경에서 다음을 준비합니다.

- Python 3.12
- Docker Desktop
- Git
- SecureVibe 프로젝트
- Radware vulnerable API 테스트 컨테이너
- Links2CPN 원본 저장소

### 2.2 권장 폴더 위치

예시는 다음 경로를 기준으로 합니다.

```text
SecureVibe:
C:\Users\kimsunmin\OneDrive\바탕 화면\idor-explainable-web

Radware API:
C:\Users\kimsunmin\OneDrive\바탕 화면\radware-vulnerable-api-application

Links2CPN:
C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs
```

경로가 다르면 본인의 실제 경로로 변경합니다.

---

## 3. Radware API 실행

### 3.1 Docker Desktop 시작

Windows 시작 메뉴에서 `Docker Desktop`을 실행합니다.

Docker Desktop이 실행된 후 새 CMD 창에서 확인합니다.

```cmd
docker version
```

`Client`와 `Server`가 모두 출력되어야 합니다.

다음 오류가 나오면 Docker Desktop이 아직 완전히 시작되지 않은 것입니다.

```text
failed to connect to the docker API
```

Docker Desktop이 `Running` 상태가 될 때까지 기다린 후 다시 실행합니다.

### 3.2 Radware 폴더 이동

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\radware-vulnerable-api-application"
```

### 3.3 SQLite 대신 PostgreSQL 구성 실행

SQLite 구성에서 다음 오류가 발생한 사례가 있습니다.

```text
sqlite3.InterfaceError: Error binding parameter 0 - probably unsupported type.
```

따라서 계정 생성 테스트에는 PostgreSQL 구성을 권장합니다.

기존 SQLite 컨테이너와 볼륨을 제거합니다.

```cmd
docker compose -f docker-compose.sqlite.yml down -v
```

PostgreSQL 구성을 실행합니다.

```cmd
docker compose -f docker-compose.rva-db.yml up -d
```

상태를 확인합니다.

```cmd
docker compose -f docker-compose.rva-db.yml ps
```

로그를 확인해야 하는 경우:

```cmd
docker compose -f docker-compose.rva-db.yml logs --tail=100
```

### 3.4 OpenAPI 응답 확인

```cmd
curl -i http://127.0.0.1:8060/openapi.json
```

정상적인 경우 다음과 같이 `200 OK`가 반환됩니다.

```text
HTTP/1.1 200 OK
```

`/docs`는 Swagger 화면이며, SecureVibe의 OpenAPI 입력값에는 다음 URL을 사용합니다.

```text
http://127.0.0.1:8060/openapi.json
```

---

## 4. 테스트 계정 생성

컨테이너가 실행되고 `/openapi.json`이 `200 OK`를 반환한 뒤 계정을 생성합니다.

```cmd
curl -i -X POST "http://127.0.0.1:8060/api/auth/register?username=user1&email=user1@example.com&password=Password123!"
```

```cmd
curl -i -X POST "http://127.0.0.1:8060/api/auth/register?username=user2&email=user2@example.com&password=Password123!"
```

각 응답에서 `user_id`를 기록합니다.

```json
{
  "username": "user2",
  "user_id": "새로 생성된 UUID"
}
```

DB를 초기화했다면 이전 실행에서 사용했던 UUID를 재사용하면 안 됩니다. 반드시 이번 실행의 응답에 포함된 UUID를 사용합니다.

### 4.1 user1 로그인

```cmd
curl -s -X POST "http://127.0.0.1:8060/api/auth/login?username=user1&password=Password123!"
```

응답 예시:

```json
{
  "access_token": "새로 발급된 JWT",
  "token_type": "bearer"
}
```

`access_token`만 SecureVibe의 User A 토큰 입력란에 붙여 넣습니다. `Bearer ` 접두사는 웹 화면이 자동으로 추가하므로 입력하지 않습니다.

> JWT가 CMD, 로그, 화면에 노출되었다면 해당 토큰은 폐기하고 새로 로그인하여 토큰을 재발급합니다.

---

## 5. SecureVibe 설치 및 실행

### 5.1 SecureVibe 폴더 이동

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\idor-explainable-web"
```

### 5.2 가상환경 생성

가상환경이 이미 있다면 이 단계는 생략해도 됩니다.

```cmd
py -3.12 -m venv .venv
```

가상환경을 활성화합니다.

```cmd
.venv\Scripts\activate
```

정상적으로 활성화되면 CMD 앞에 다음과 유사한 표시가 나타납니다.

```text
(.venv)
```

### 5.3 패키지 설치

```cmd
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Links2CPN을 별도 환경에서 실행한다면 Links2CPN의 가상환경과 의존성도 별도로 준비해야 합니다.

### 5.4 SecureVibe 실행

SecureVibe 프로젝트 루트에서 실행합니다.

```cmd
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

브라우저에서 다음 주소를 엽니다.

```text
http://127.0.0.1:8000
```

---

## 6. 웹 화면 입력값

현재 Radware 테스트에 사용할 입력값은 다음과 같습니다.

| 입력 항목 | 입력값 |
|---|---|
| GitHub 저장소 URL | `https://github.com/Radware/radware-vulnerable-api-application` |
| OpenAPI URL | `http://127.0.0.1:8060/openapi.json` |
| 대상 API 호스트 | `http://127.0.0.1:8060` |
| User A 토큰 | 새로 로그인한 `access_token`만 입력 |
| Actor ID | `userA` |
| Links2CPN 경로 | `C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs` |

객체·Query 파라미터 예시는 다음과 같이 입력할 수 있습니다.

```json
{
  "userId": "이번 실행에서 생성된 user2의 user_id",
  "productId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Laptop",
  "q": "test",
  "role": "user",
  "coupon_code": "test",
  "orderId": "00000000-0000-4000-8000-000000000001",
  "cardId": "00000000-0000-4000-8000-000000000001"
}
```

### 첫 번째 권장 실행

처음에는 다음 체크박스를 해제합니다.

```text
POST/PUT/PATCH/DELETE 실행 허용: 해제
```

이 상태에서는 기본적으로 `GET`, `HEAD`, `OPTIONS`만 요청하여 데이터 변경 위험을 줄입니다.

### 변경 요청을 포함할 때

연구상 필요할 때만 체크박스를 선택합니다.

```text
POST/PUT/PATCH/DELETE 실행 허용: 선택
```

주의할 점:

- 실제 대상 서버의 데이터가 변경될 수 있습니다.
- 회원가입, 주문, 카드, 상품 생성 endpoint가 실행될 수 있습니다.
- 테스트 전용 DB 또는 초기화 가능한 환경에서만 사용합니다.
- 자동 생성 요청의 body는 현재 코드에서 기본적으로 빈 JSON 객체입니다.
- 따라서 `POST`가 `422` 또는 `400`을 반환할 수 있으며, 이것은 곧 취약점 확정이 아닙니다.

---

## 7. 결과 해석

### 7.1 HTTP 상태 코드

| 상태 코드 | 의미 |
|---:|---|
| `200` | 요청 성공. 타인 데이터가 반환되면 동적 BOLA 후보가 될 수 있음 |
| `201` | 생성 성공. 생성 endpoint의 응답 |
| `400` | 잘못된 요청 또는 비즈니스 검증 실패 가능성 |
| `401` | 인증 실패 또는 토큰 누락/만료 |
| `403` | 권한 거부. 보호가 동작했을 가능성 |
| `404` | 객체 없음 또는 존재 은닉 가능성 |
| `422` | 요청 형식, 필수 파라미터 또는 body 검증 실패 |
| `500` | 대상 API 또는 테스트 환경 내부 오류 |

`200`만으로 IDOR/BOLA를 확정하지 않습니다. 다음 비교가 필요합니다.

1. user1이 자신의 객체를 요청한 baseline
2. user1이 user2 객체를 요청한 cross-owner 테스트
3. user2가 자신의 객체를 요청한 정상 owner 결과
4. 세 요청의 HTTP 상태 코드와 응답 본문 비교

### 7.2 Links2CPN 상태

| 상태 | 의미 |
|---|---|
| `confirmed-flow` | replay 출력에서 해당 흐름이 모델에 존재한다고 확인됨 |
| `not-present-in-cpn` | 해당 replay line이 모델에 존재하지 않음 |
| `transition-not-enabled` | 모델에 관련 transition이 있으나 실행되지 않음 |
| `observed-not-in-cpn` | 이벤트는 관찰되었으나 CPN 매칭 근거가 없음 |
| `not-replayed` | replay 결과가 없음 |

`replay 18건`은 Links2CPN이 18개 입력 라인을 처리했다는 의미일 수 있습니다. 모든 이벤트가 모델에 매칭되었다는 뜻은 아닙니다.

---

## 8. Links2CPN 관련 수정 원칙

### 8.1 수정하지 않는 파일

다음 저장소의 원본 파일은 수정하지 않습니다.

```text
C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs
```

논문 재현성과 원본 인용을 위해 GitHub 원본 코드와 실행 결과를 보존합니다.

### 8.2 SecureVibe에서 수정하는 adapter 파일

SecureVibe 안의 다음 파일만 수정 대상으로 둡니다.

```text
app\links2cpn_two_stage_detector.py
```

이 파일은 다음 역할만 수행해야 합니다.

1. 이벤트 JSONL을 읽습니다.
2. Links2CPN 원본의 실제 entry point를 호출합니다.
3. stdout/stderr를 수집합니다.
4. `Line N is not present in the model` 및 `Fire error, Line N`을 해석합니다.
5. 원래 이벤트 line 번호와 replay 결과를 병합합니다.
6. 정적 분석 결과에 CPN evidence를 추가합니다.

### 8.3 현재 adapter가 사용하는 Links2CPN entry point

현재 SecureVibe adapter는 다음 파일을 찾습니다.

```text
<Links2CPN 경로>\src\openapiLinks2CPNs\execute_replay.py
```

Windows 기준 실행 Python은 다음 위치를 우선 사용합니다.

```text
<Links2CPN 경로>\.venv\Scripts\python.exe
```

따라서 Links2CPN 원본 저장소에 다음 구조가 실제로 존재하는지 확인해야 합니다.

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs"
dir src\openapiLinks2CPNs\execute_replay.py
.venv\Scripts\python.exe --version
```

파일이 없거나 가상환경 경로가 다르면 Links2CPN 원본을 수정하지 말고 SecureVibe의 adapter에서 다음 항목을 조정합니다.

- entry point 경로
- Python 실행 파일 경로
- subprocess의 working directory
- OpenAPI 파일 인자 순서
- 이벤트 로그 파일 인자 순서
- timeout

### 8.4 이벤트 형식에서 반드시 유지할 필드

현재 adapter와 Links2CPN 연계를 위해 각 JSONL 행에 다음 필드를 유지합니다.

```json
{
  "method": "GET",
  "uri": "/api/users/00000000-0000-0000-0000-000000000002",
  "statusCode": 200,
  "ip": "userA",
  "headerAuthorization": "Bearer ...",
  "requestBody": {},
  "openapiPath": "/api/users/{user_id}",
  "operationId": "getUser"
}
```

중요한 필드는 다음 세 가지입니다.

- `method`
- `uri`
- `statusCode`

`message` 필드를 추가한다고 해서 `not-present-in-model` 문제가 자동으로 해결되지는 않습니다. `message`는 오류 출력 설명용일 수 있으며, 모델 transition 검색과 동일한 해결책이 아닙니다.

### 8.5 `not-present-in-model`이 계속 발생할 때 확인 순서

1. SecureVibe가 실제로 생성한 `generated-events.jsonl`을 확인합니다.
2. `method`, `uri`, `statusCode`가 Links2CPN이 기대하는 형식인지 확인합니다.
3. `uri`가 전체 URL이 아니라 경로 형식인지 확인합니다.
4. OpenAPI path와 실제 URI의 path parameter 위치가 일치하는지 확인합니다.
5. OpenAPI 문서가 Links2CPN 모델 생성에 사용한 문서와 동일한지 확인합니다.
6. API 요청이 성공했더라도 해당 endpoint가 CPN 모델에 포함되어 있는지 확인합니다.
7. 모델에 없는 endpoint를 취약점 확정 근거로 사용하지 않습니다.

이 상태는 단순히 HTTP 요청이 실패했다는 뜻이 아니라, Links2CPN이 현재 OpenAPI/이벤트를 자신의 모델 transition과 매칭하지 못했다는 뜻입니다.

---

## 9. 수동 Links2CPN 실행 확인

SecureVibe를 거치기 전에 Links2CPN 원본이 독립적으로 실행되는지 확인합니다. 정확한 인자 형식은 Links2CPN 저장소의 README와 entry point를 기준으로 확인합니다.

SecureVibe adapter가 기대하는 기본 명령 구조는 다음과 같습니다.

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs\src"
..\.venv\Scripts\python.exe openapiLinks2CPNs\execute_replay.py OPENAPI_FILE EVENT_LOG_FILE
```

Windows CMD에서 실제 경로를 사용할 때는 다음처럼 입력합니다.

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs\src"
"C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs\.venv\Scripts\python.exe" openapiLinks2CPNs\execute_replay.py "C:\경로\openapi.json" "C:\경로\events.jsonl"
```

> 위 명령은 SecureVibe adapter의 현재 호출 형태를 설명한 것입니다. Links2CPN 원본의 실제 CLI 인자 형식이 다르면 원본을 변경하지 말고 `app\links2cpn_two_stage_detector.py`의 `command` 배열만 원본 형식에 맞게 수정합니다.

---

## 10. SecureVibe CLI 2단계 분석

웹 UI가 아닌 명령행에서 2단계 분석을 실행하려면 다음과 같은 형태를 사용합니다.

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\idor-explainable-web"

python -m app.links2cpn_two_stage_detector ^
  "C:\경로\openapi.json" ^
  --event-log "C:\경로\events.jsonl" ^
  --links2cpn-repo "C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs" ^
  --links2cpn-python "C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs\.venv\Scripts\python.exe" ^
  --output two-stage-result.json
```

CMD에서 `^`는 여러 줄 명령을 연결하는 기호입니다. 한 줄로 입력해도 됩니다.

---

## 11. 문제 해결

### 11.1 Radware 컨테이너가 `unhealthy`인 경우

```cmd
docker compose -f docker-compose.rva-db.yml ps
docker compose -f docker-compose.rva-db.yml logs --tail=150
```

SQLite 구성을 사용 중이면 다음 오류를 확인합니다.

```text
sqlite3.InterfaceError: Error binding parameter 0 - probably unsupported type.
```

이 경우 SQLite를 계속 사용하기보다 PostgreSQL Compose로 전환합니다.

```cmd
docker compose -f docker-compose.sqlite.yml down -v
docker compose -f docker-compose.rva-db.yml up -d
```

### 11.2 SecureVibe가 시작되지 않는 경우

```cmd
python -m py_compile app\main.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

상대 import 오류가 나면 프로젝트 루트에서 실행했는지 확인합니다.

### 11.3 `Links2CPN Python not found` 오류

SecureVibe 현재 구현은 기본적으로 다음 파일을 찾습니다.

```text
<repo>\.venv\Scripts\python.exe
```

다음 명령으로 확인합니다.

```cmd
dir "C:\Users\kimsunmin\OneDrive\바탕 화면\openapi-links-to-CPNs\.venv\Scripts\python.exe"
```

실제 가상환경 폴더 이름이 다르면 SecureVibe의 `app\main.py`에서 Python 경로를 자동 탐색하도록 수정하거나, adapter에 실제 실행 파일 경로를 전달하도록 변경합니다.

### 11.4 `not-present-in-model`이 나오는 경우

다음은 정상적으로 구분해야 하는 결과입니다.

```text
HTTP 요청 실행 성공 != CPN 모델 매칭 성공
```

먼저 SecureVibe가 생성한 이벤트가 실제 응답을 반영하는지 확인하고, 그 다음 OpenAPI 모델과 Links2CPN 모델에 해당 endpoint가 포함되는지 확인합니다.

---

## 12. 연구 기록 권장 항목

각 실행별로 다음 값을 저장하면 논문 실험 재현에 유용합니다.

- 실행 날짜와 시간
- OpenAPI 파일 해시
- Radware Docker Compose 파일명
- 대상 API 주소
- 요청한 actor
- 토큰 만료 시각 또는 토큰 식별자 일부
- 정적 후보 수
- 자동 HTTP 이벤트 수
- HTTP 상태 코드 분포
- Links2CPN replay 수
- `confirmed-flow` 수
- `not-present-in-cpn` 수
- `transition-not-enabled` 수
- `candidate-static-only` 수
- 실제 owner baseline 결과
- cross-owner 결과
- 최종 수동 판정

토큰 전체 문자열은 보고서나 논문 기록에 저장하지 않습니다.

---

## 13. 현재 구현의 제한사항

1. 웹 입력의 `parameter_examples` 값은 현재 `main.py`의 자동 요청 생성 함수에 직접 반영되지 않을 수 있습니다. 실제 요청 body와 query parameter를 정확히 넣으려면 `main.py`에 파라미터 전달·적용 로직을 추가해야 합니다.
2. `POST`, `PUT`, `PATCH` 요청 body는 현재 기본적으로 빈 JSON 객체입니다.
3. `GET` 요청의 필수 query parameter 자동 생성은 제한적입니다.
4. HTML 다운로드 버튼은 프론트엔드에 표시되어도 별도의 다운로드 핸들러가 추가되어야 실행별 보고서 파일을 자동 저장할 수 있습니다.
5. Links2CPN 결과가 `not-present-in-model`이면 정적 후보만 존재하는 상태이며, 이를 확정 취약점으로 보고하지 않습니다.
6. 회원 객체, 상품 객체, 목록 endpoint는 소유권 모델이 서로 다를 수 있으므로 같은 기준으로 IDOR를 판정하면 안 됩니다.

---

## 14. 실험 종료

SecureVibe 서버 종료:

```text
Ctrl + C
```

Radware 컨테이너 종료:

```cmd
cd /d "C:\Users\kimsunmin\OneDrive\바탕 화면\radware-vulnerable-api-application"
docker compose -f docker-compose.rva-db.yml down
```

데이터까지 삭제하려면 다음을 사용합니다.

```cmd
docker compose -f docker-compose.rva-db.yml down -v
```

`down -v`는 PostgreSQL 볼륨과 테스트 계정을 삭제할 수 있으므로, 다음 실험에서 초기화가 필요할 때만 실행합니다.
