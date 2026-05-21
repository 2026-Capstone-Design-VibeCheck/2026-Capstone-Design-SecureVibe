import os
import uuid
import json
import subprocess
import tempfile
import shutil
import stat
import oracledb
import openai
from openai import AsyncOpenAI
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# 프론트엔드 도메인 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","http://localhost:3001", 
        "http://127.0.0.1:3001" ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# .env 파일 로드
load_dotenv()

def remove_readonly(func, path, excinfo):
    os.chmod(path, stat.S_IWRITE)
    func(path)

# 챗봇 메시지 기록을 위한 Pydantic 데이터 모델 정의
class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "openai/gpt-3.5-turbo"

# 1. Semgrep 코드 스캔 API
@app.post("/scan")
async def scan_code(
    code_file: UploadFile = File(None),
    code_text: str = Form(""),
    language: str = Form(".txt"),
    codeurl: str = Form("")
):
    code_content = ""
    file_extension = ".txt"

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

    # OS 임시 폴더 대신 현재 폴더에 랜덤한 이름으로 직접 파일 생성
    tmp_filename = f"scan_target_{uuid.uuid4().hex}{file_extension}"

    with open(tmp_filename, 'w', encoding='utf-8') as tmp_file:
        tmp_file.write(code_content)

    try:
        command = ["semgrep", "scan", "--config", "auto", "--json", tmp_filename]

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

            # 보안상 실제 파일 이름(랜덤)을 숨김
            for res in results_array:
                res["path"] = f"scanned_target{file_extension}"

            return results_array

        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="결과를 처리할 수 없습니다.")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")
    finally:
        if os.path.exists(tmp_filename):
            os.remove(tmp_filename)

# 2. GitHub URL 스캔 공통 함수
async def scan_from_url(github_url: str):
    if "github.com" not in github_url:
        raise HTTPException(status_code=400, detail="GitHub URL만 지원합니다.")
    
    clone_url = github_url if github_url.endswith(".git") else github_url + ".git"
    
    tmp_dir = tempfile.mkdtemp()
    repo_path = os.path.join(tmp_dir, "repo")

    try:
        clone_result = subprocess.run(
            ["git", "clone", "--depth=1", clone_url, repo_path],
            capture_output=True,
            text=True,
            timeout=60
        )

        if clone_result.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=f"레포지토리 클론 실패: {clone_result.stderr.strip()}"
            )

        return run_semgrep(repo_path)

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="레포지토리 클론 시간이 초과되었습니다.")
    finally:
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, onerror=remove_readonly)

# 3. Semgrep 디렉토리 스캔 공통 함수
def run_semgrep(scan_target: str):
    command = ["semgrep", "scan", "--config", "auto", "--json", scan_target]

    custom_env = os.environ.copy()
    custom_env["PYTHONUTF8"] = "1"

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=600,
            encoding="utf-8",
            env=custom_env
        )

        if result.returncode != 0 and not result.stdout.strip().startswith("{"):
            print("[Semgrep 내부 에러 발생]\n", result.stderr)
            raise HTTPException(status_code=500, detail="Semgrep 실행 오류. 서버 터미널을 확인하세요.")

        parsed_output = json.loads(result.stdout)

        if "results" in parsed_output:
            for res in parsed_output["results"]:
                path = res.get("path", "")
                res["path"] = path.split("repo/", 1)[-1] if "repo/" in path else path

        return parsed_output.get("results", [])

    except json.JSONDecodeError:
        print("[JSON 파싱 에러] Semgrep 출력값:\n", result.stdout)
        raise HTTPException(status_code=500, detail="Semgrep 결과를 처리할 수 없습니다.")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")

# 4. 오라클 DB 로그인 API
@app.post("/login")
async def login(id: str = Form(...), password: str = Form(...)):
    try:
        connection = oracledb.connect(
            user="c##manager",
            password="hellocnu",
            dsn="localhost:1521/xe"
        )
        print('Logging in with:', id, password)
        
        cursor = connection.cursor()
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
        raise HTTPException(status_code=500, detail="데이터베이스 접속 오류")
    finally:
        if 'connection' in locals():
            connection.close()

# 5. OpenRouter 무료 GPT 모델 연동 API
@app.post("/suggest-fix")
async def suggest_fix(
    vulnerability_description: str = Form(...),
    vulnerable_code: str = Form(...)
):
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not openrouter_api_key:
        raise HTTPException(
            status_code=500, detail="API 키가 설정되지 않았습니다. .env 파일을 확인해주세요."
        )

    try:
        client = AsyncOpenAI(
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )

        prompt = f"""You are a highly skilled software security engineer. Provide a corrected code snippet.
Analyze the vulnerability and provide *only* the corrected code snippet that addresses it. Do not include explanations or surrounding text. The code should be fully functional and directly usable.

Vulnerability Description: {vulnerability_description}

Vulnerable Code:
Corrected Code:"""

        response = await client.chat.completions.create(
            model="openai/gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional software security assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1000,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SecureVibe-Capstone",
            }
        )
        return {"suggested_fix": response.choices[0].message.content.strip()}
    except openai.APIError as e:
        raise HTTPException(status_code=getattr(e, "status_code", 400), detail=f"OpenRouter API 오류: {getattr(e, 'message', str(e))}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"수정 코드 제안 중 오류 발생: {str(e)}")

# 6. 오라클 DB 회원가입 API
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
            
        cursor.execute("SELECT id FROM userlist")
        results = cursor.fetchall()
        ids = [row[0] for row in results]

        cursor.execute(
            "INSERT INTO userlist (USERID, ID, NAME, PASSWORD, KEY) VALUES (:ids, :sid, :sname, :spassword, :sapikey)",
            {"ids": len(ids), "sid": sid, "sname": sname, "spassword": spassword, "sapikey": sapikey}
        )
        connection.commit()
        print('회원가입 성공')
        return {"message": "회원가입 성공"}

    except oracledb.Error as e:
        print(f"접속 중 오류 발생: {e}")
        return {"message": "회원가입 중 오류가 발생했습니다."}
    finally:
        if 'connection' in locals():
            connection.close()

# 7. 보안 분석 및 대화형 챗봇 API
@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not openrouter_api_key:
        raise HTTPException(
            status_code=500, detail="API 키가 설정되지 않았습니다. .env 파일을 확인해주세요."
        )

    try:
        client = AsyncOpenAI(
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1"
        )

        system_prompt = {
            "role": "system",
            "content": (
                "You are the core AI agent of 'SecureVibe', an advanced SAST and vulnerability remediation platform. "
                "Analyze code context, explain vulnerabilities like OWASP Top 10, and provide secure coding practices."
            )
        }
        
        formatted_messages = [system_prompt] + [{"role": msg.role, "content": msg.content} for msg in request.messages]

        response = await client.chat.completions.create(
            model=request.model,
            messages=formatted_messages,
            temperature=0.4,
            max_tokens=2000,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SecureVibe-Capstone-Chat",
            }
        )
        
        return {
            "status": "success",
            "reply": response.choices[0].message.content.strip()
        }

    except openai.APIError as e:
        raise HTTPException(
            status_code=getattr(e, "status_code", 400), 
            detail=f"OpenRouter LLM 연동 오류: {getattr(e, 'message', str(e))}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"챗봇 응답 처리 중 내부 오류 발생: {str(e)}")
