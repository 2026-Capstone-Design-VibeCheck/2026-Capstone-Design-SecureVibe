# backend/main.py
import os
import uuid
import json
import subprocess
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import shutil
import stat
import oracledb
import google.genai 
from google.genai import Client
from pydantic import BaseModel
import asyncio



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)


@app.post("/scan")
async def scan_code(
    code_file: UploadFile = File(None),
    code_text: str = Form(""),
    language: str = Form(".txt"),
    codeurl: str = Form("")
):
    code_content = ""
    file_extension = ".py"

    if code_file and code_file.filename:
        code_content = (await code_file.read()).decode("utf-8")
        _, file_extension = os.path.splitext(code_file.filename)
    elif code_text.strip():
        code_content = code_text
        file_extension = language
    elif codeurl.strip():
        print(f"[URL 스캔 요청] URL: {codeurl}")
        return await scan_from_url(codeurl)
    else:
        raise HTTPException(status_code=400, detail="입력된 코드나 파일이 없습니다.")

    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix=file_extension,
        prefix='scan_target_',
        delete=False,
        encoding='utf-8'
    ) as tmp_file:
        tmp_file.write(code_content)
        tmp_filename = tmp_file.name

    try:
        # 강력한 p/security 룰셋을 적용하여 취약점을 샅샅이 찾아냅니다.
        command = ["semgrep", "scan", "--config", "p/python", "--config", "p/security-audit", "--json", tmp_filename]

        custom_env = os.environ.copy()
        custom_env["PYTHONUTF8"] = "1"

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=120,
            encoding="utf-8",
            env=custom_env
        )

        if result.returncode != 0 and not result.stdout.strip().startswith("{"):
            raise HTTPException(status_code=500, detail="Semgrep 실행 오류.")

        try:
            parsed_output = json.loads(result.stdout)
            results_array = parsed_output.get("results", [])

            # 보안상 실제 파일 이름(랜덤)을 숨기고 깔끔하게 보여줍니다.
            for res in results_array:
                res["path"] = f"scanned_target{file_extension}"

            print(results_array)
            return results_array

        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="결과를 처리할 수 없습니다.")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")
    finally:
        # 검사가 끝나면 생성했던 파일 삭제
        if os.path.exists(tmp_filename):
            os.remove(tmp_filename)

async def scan_from_url(github_url: str):
    # GitHub URL 기본 검증
    if "github.com" not in github_url:
        raise HTTPException(status_code=400, detail="GitHub URL만 지원합니다.")
    
    # .git이 없으면 자동으로 붙여줌
    clone_url = github_url if github_url.endswith(".git") else github_url + ".git"
    
    tmp_dir = tempfile.mkdtemp()
    repo_path = os.path.join(tmp_dir, "repo")

    try:
        # 1. git clone (shallow clone으로 속도 향상)
        clone_result = subprocess.run(
            ["git", "clone", "--depth=1", clone_url, repo_path],
            capture_output=True,
            text=True,
            timeout=60  # 대형 레포 고려해 60초
        )

        if clone_result.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=f"레포지토리 클론 실패: {clone_result.stderr.strip()}"
            )

        # 2. 클론된 디렉토리 전체를 semgrep으로 스캔
        return run_semgrep(repo_path)

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="레포지토리 클론 시간이 초과되었습니다.")
    finally:
        # 클론된 레포 정리
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, onerror=remove_readonly)

            # ✅ semgrep 실행 공통 함수
def run_semgrep(scan_target: str):
    command = [
        "semgrep", "scan",
        "--config", "auto",
        "--json",
        scan_target
    ]

    custom_env = os.environ.copy()
    custom_env["PYTHONUTF8"] = "1"

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=600,  # 디렉토리 스캔은 오래 걸릴 수 있음
            encoding="utf-8",
            env=custom_env
        )

        if result.returncode != 0 and not result.stdout.strip().startswith("{"):
            print("[Semgrep 내부 에러 발생]\n", result.stderr)
            raise HTTPException(status_code=500, detail="Semgrep 실행 오류. 서버 터미널을 확인하세요.")

        parsed_output = json.loads(result.stdout)

        # 경로 마스킹: 서버 내부 경로 숨기기
        if "results" in parsed_output:
            for res in parsed_output["results"]:
                    # 레포 내 상대 경로만 표시 (repo/ 이후 경로)
                    path = res.get("path", "")
                    res["path"] = path.split("repo/", 1)[-1] if "repo/" in path else path


        return parsed_output.get("results", [])

    except json.JSONDecodeError:
        print("[JSON 파싱 에러] Semgrep 출력값:\n", result.stdout)
        raise HTTPException(status_code=500, detail="Semgrep 결과를 처리할 수 없습니다.")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")
@app.post("/login")
async def login(id: str = Form(...), password: str = Form(...)):
    # 여기에 로그인 로직을 구현합니다.
    # 예: API 호출하여 로그인 처리, 세션 저장 등
    try:
        connection = oracledb.connect(
            user="c##manager",
            password="hellocnu",
            dsn="localhost:1521/xe"
        )
        print('Logging in with:', id, password)
        
        cursor = connection.cursor()
        # 딕셔너리 형태로 전달하여 변수명을 명확히 매칭
        cursor.execute(
        "SELECT * FROM userlist WHERE ID = :u_id AND PASSWORD = :u_pw", 
        {"u_id": id, "u_pw": password}
        )
        result = cursor.fetchone()
        if result:
            print("name:", result[2], "key:", result[4], "id:", result[1], "userID:", result[0])
            print('로그인 성공')
            return {"message": "로그인 성공", "user": {"id": result[1], "name": result[2], "key": result[4]}}
        else:
            print(result)
            print('로그인 실패')
            return {"message": "로그인 실패"}
    except oracledb.Error as e:
        print(f"접속 중 오류 발생: {e}")

    finally:
        if 'connection' in locals():
            connection.close()

@app.post("/signup")
async def signup(sid: str = Form(...), sname: str = Form(...), spassword: str = Form(...), sapikey: str = Form(...)):
    
    print('Signing up with:', sid, sname, spassword, sapikey)
    try:
        connection = oracledb.connect(
            user="c##manager",
            password="hellocnu",
            dsn="localhost:1521/xe"
        )
        
        cursor = connection.cursor()
        cursor.execute(
            "SELECT * FROM userlist WHERE ID = :sid", 
            {"sid": sid}
        )
        existing_user = cursor.fetchone()
        if existing_user:
            print('이미 존재하는 id입니다.')
            return {"message": "이미 존재하는 id입니다."}
        cursor.execute(
            "SELECT id FROM userlist"
        )
        results = cursor.fetchall()
        print(results)
        ids = [row[0] for row in results]
        print(ids)

        cursor.execute(
            "INSERT INTO userlist (USERID, ID, NAME, PASSWORD, KEY) VALUES (:ids, :sid, :sname, :spassword, :sapikey)",
            {"ids": len(ids), "sid": sid, "sname": sname, "spassword": spassword, "sapikey": sapikey}
        )
        connection.commit()
        print('회원가입 성공')

    except oracledb.Error as e:
        print(f"접속 중 오류 발생: {e}")
        return {"message": "회원가입 중 오류가 발생했습니다."}

    finally:
        if 'connection' in locals():
            connection.close()
    return {"message": "회원가입 성공"}

    

@app.post("/chat")
async def chat(
    message: str = Form(...),
    api_key: str = Form(...),
    context: str = Form(""),
    vulnerable_code: str = Form(""),
    fixed_code: str = Form("")
):
    try:
        client = genai.Client(api_key=api_key)
        

        prompt = f"""당신은 보안 전문가 AI입니다. 
사용자는 현재 화면에서 정적 분석 도구로 탐지된 보안 취약점의 상세 내역을 보고 있으며, 우측 하단의 작은 챗봇 창(너비 360px)을 통해 당신과 대화하고 있습니다. 

[취약점 정보]
{context}

[발견된 취약 코드]
{vulnerable_code if vulnerable_code else "(없음)"}

[AI가 제안한 수정 코드]
{fixed_code if fixed_code else "(아직 생성되지 않음)"}

사용자 질문: {message}

당신은 아래의 [답변 작성 규칙]을 엄격히 준수하여 짧고 명확하게 답변해야 합니다.

■ 답변 작성 규칙

1. 반드시 [발견된 취약 코드]와 [AI가 제안한 수정 코드]에 나타난 실제 '변수명', '함수명', 'DB 라이브러리/엔진'을 직접 인용하여 콕 짚어서 설명하세요.
2. 챗봇 화면이 작으므로 전체 답변은 공백 포함 400자 이내, 세 줄 요약 형태로 가독성 있게 작성하세요.
3. 불필요한 마크다운 표(Table)나 광범위한 타사 DB 예시는 절대 포함하지 마세요. 사용자의 코드 환경에만 집중하세요.
4. 기술적 설명이 필요한 경우에도, 비전공자도 이해할 수 있도록 최대한 쉽게 설명하세요. 전문 용어는 한글로 풀어서 설명하거나 괄호 안에 간단한 정의를 덧붙이세요.
"""
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"message": response.text}


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/suggest-fix")
async def suggest_fix(
    vulnerable_code: str = Form(...),
    cwe: str = Form(""),
    message: str = Form(""),
    api_key: str = Form(...)
):
    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""당신은 보안 전문가 코드 리뷰어입니다.
아래 코드는 다음 취약점이 발견되었습니다:
- CWE: {cwe}
- 설명: {message}

[취약 코드]
```
{vulnerable_code}
```

위 코드만 수정해서 동등한 동작을 하되 취약점이 사라진 버전을 반환하세요.
- 변수명·함수 시그니처는 가능한 유지
- 주석으로 변경 이유를 한국어 1줄 추가
- 응답은 코드 블록 1개만. 설명 텍스트는 코드 블록 밖에 1~2문장으로.

응답 형식:
```
(수정된 코드)
```
한줄 요약: (변경 이유)
"""

        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"suggestion": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    raw_results: list
    target_code: str
    api_key: str

# 1. 단일 취약점 아이템을 분석하는 핵심 비동기 함수 분리
async def analyze_single_item(item, target_code, client):
    extra = item.get("extra", {})
    metadata = extra.get("metadata", {})

    # 각 아이템별 독립된 컨텍스트 구성
    context = {
        "check_id": item.get("check_id", ""),
        "path": item.get("path", ""),
        "line": item.get("start", {}).get("line", ""),
        "lines": extra.get("lines", ""),
        "message": extra.get("message", ""),
        "severity": item.get("severity", ""),
        "cwe": metadata.get("cwe", []),
        "owasp": metadata.get("owasp", []),
        "vulnerability_class": metadata.get("vulnerability_class", []),
        "likelihood": metadata.get("likelihood", ""),
        "impact": metadata.get("impact", ""),
        "confidence": metadata.get("confidence", ""),
    }

    prompt = f"""당신은 정적 분석 도구(SAST)의 결과를 검증하는 세계 최고 수준의 애플리케이션 보안 전문가입니다.
Semgrep이 탐지한 결과와 실제 소스 코드를 비교 분석하여, 이것이 실제 취약점(True Positive)인지 오탐(False Positive)인지 판별하세요.

[1. Semgrep 탐지 정보]
{json.dumps(context, ensure_ascii=False, indent=2)}

[2. 실제 대상 소스 코드]
{target_code}

[분석 가이드라인]
1. Semgrep의 'confidence'가 LOW이더라도, 실제 코드상에서 검증되지 않은 사용자 입력값이 쿼리나 명령어에 직접 결합(문자열 더하기, f-string 등)된다면 그것은 반드시 'True Positive(진탐)'입니다. 룰 이름이나 기술 스택이 완벽히 일치하지 않더라도 취약한 구조가 성립한다면 진탐으로 판단하세요.
2. 'lines' 필드에 찍힌 한 줄만 보지 말고, 제공된 [실제 대상 소스 코드]의 데이터 흐름(Data Flow)을 추적하세요. 외부 입력값이 취약한 싱크(Sink) 함수까지 도달하는지 확인해야 합니다.
3. 최종 판단을 내리기 전, JSON의 'analysis_process' 필드에서 단계별로 논리적 추론을 먼저 수행하세요.

반드시 아래 지정된 JSON 형식으로만 응답하세요. 다른 설명 텍스트나 마크다운 코드블록(```)은 절대 포함하지 마세요.

{{
  "analysis_process": {{
    "step1_input_source": "외부 입력값(파라미터 등)이 어디서 유입되는지 분석",
    "step2_data_flow": "그 입력값이 취약한 함수(Sink)까지 안전하게 정제(Sanitize)되지 않고 도달하는지 추적",
    "step3_rule_match": "Semgrep이 경고한 취약점 유형이 이 흐름과 실제로 일치하는지 판별"
  }},
  "is_false_positive": true 또는 false,
  "severity": "critical | high | medium | low 중 하나 (is_false_positive가 false일 때만 작성, true면 null)",
  "title": "취약점 명칭 (한국어, true면 null)",
  "owasp": "OWASP 항목 (예: A03:2021-Injection, true면 null)",
  "description": "취약점에 대한 핵심 설명 (2~3문장, 한국어, true면 null)",
  "risk": "실제 악용되었을 때의 위험성 (문제 원인과 위험성을 비전공자도 이해하기 쉽도록 2~3문장으로 설명, 한국어, true면 null)",
  "howToFix": ["수정 방법 1", "수정 방법 2", ...] (실제 취약점이 맞다면, 구체적이고 실질적인 수정 방법을 3개 제시, 한국어, true면 null),
  "reason_if_false_positive": "만약 오탐(true)으로 판단했다면 그 구체적인 이유 (진탐이면 null)",
}}"""

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        content = response.text
        
        # 💡 개별 결과를 파싱하여 원본 스캔 데이터(original)와 결합 후 반환
        parsed_json = json.loads(content)
        parsed_json["original"] = item # 프론트엔드 useScanStore 구조 동기화용
        return parsed_json

    except Exception as e:
        print(f"단일 아이템 분석 실패 ({item.get('check_id')}): {e}")
        # 하나의 아이템이 실패하더라도 전체가 죽지 않도록 에러 포맷 리턴
        return {
            "parse_error": True,
            "title": f"분석 실패: {item.get('check_id')}",
            "description": str(e),
            "original": item
        }

@app.post("/analyze")
async def analyze(payload: AnalyzeRequest):
    raw_results = payload.raw_results
    target_code = payload.target_code
    api_key = payload.api_key

    if not api_key:
        raise HTTPException(status_code=400, detail="API Key가 누락되었습니다.")
    if not raw_results:
        return []

    client = genai.Client(api_key=api_key)

    # 2. 💡 리스트 컴프리헨션을 이용해 모든 취약점 아이템에 대한 비동기 Task 생성
    tasks = [
        analyze_single_item(item, target_code, client)
        for item in raw_results
    ]

    analyzed_batch_results = await asyncio.gather(*tasks)

    print(f"전체 {len(analyzed_batch_results)}개의 취약점 분석 파이프라인 처리 완료 완료.")
    
    # 4. 💡 최종 분석 완료 객체들이 쌓인 '배열(List)' 구조 반환 (프론트엔드 .filter 문제 해결)
    return analyzed_batch_results
class SaveHistoryRequest(BaseModel):
    mode: int
    aimod: int
    raw_results: list
    normal_results: list
    filename: str
    timestamp: str
    user_id: str
@app.post("/save")
async def save_results(payload: SaveHistoryRequest):
    safe_timestamp = payload.timestamp.replace(":", "-").replace("T", "_").replace("Z", "")
    safe_filename = payload.filename.replace(".", "_")
    
    dir_path = f"../frontend/app/history/data/{payload.user_id}"
    os.makedirs(dir_path, exist_ok=True)
    
    
    # 빠른 탐색을 위해 지정하신 네이밍 규칙 적용
    file_path = os.path.join(dir_path, f"{payload.mode}_{payload.aimod}_{safe_timestamp}_{safe_filename}.json")
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump({
                "normal_results": payload.normal_results,
                "raw_results": payload.raw_results
            }, f, ensure_ascii=False, indent=2)
        return {"message": "결과가 성공적으로 저장되었습니다.", "path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"결과 저장 중 오류 발생: {str(e)}")
# 2. 루트 경로 엔드포인트 명시 (404 방지)
@app.get("/")
async def root():
    return {"status": "online", "message": "Backend is running"}