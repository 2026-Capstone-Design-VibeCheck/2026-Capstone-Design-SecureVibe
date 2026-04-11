import os
import json
import tempfile
import subprocess
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware  # CORS 미들웨어 추가

app = FastAPI()

# CORS 설정 추가: 브라우저에서의 교차 출처 요청을 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (개발 환경)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# index.html 파일의 내용을 읽어서 메인 화면으로 제공합니다.
@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("main.html", "r", encoding="utf-8") as f:
        return f.read()

# 파일 업로드와 텍스트 입력을 모두 처리하는 API 엔드포인트입니다.
@app.post("/scan")
async def scan_code(
    code_file: UploadFile = File(None), 
    code_text: str = Form(""), 
    language: str = Form(".txt")
):
    code_content = ""
    file_extension = ".txt"

    # 1. 파일이 업로드된 경우 (우선순위 높음)
    if code_file and code_file.filename:
        code_content = (await code_file.read()).decode("utf-8")
        # 원본 파일명에서 확장자를 추출하여 Semgrep이 언어를 인식하게 합니다.
        _, file_extension = os.path.splitext(code_file.filename)
    
    # 2. 텍스트 영역에 코드를 직접 입력한 경우
    elif code_text.strip():
        code_content = code_text
        file_extension = language
        
    else:
        raise HTTPException(status_code=400, detail="입력된 코드나 파일이 없습니다.")

    # 임시 파일을 생성하여 코드를 저장합니다.
    with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False, mode='w', encoding='utf-8') as tmp_file:
        tmp_file.write(code_content)
        tmp_path = tmp_file.name

    try:
        # 1. auto 대신 p/default를 사용하여 로그인 없이 기본 보안 룰셋을 적용합니다.
        # p/default 외에 OWASP Top 10 웹 취약점 전용 룰셋을 함께 적용합니다.
        command = ["semgrep", "scan", "--config", "p/default", "--config", "p/owasp-top-ten", "--json", tmp_path]

        # Windows cp949 에러 방지를 위해 Semgrep 실행 환경에 강제로 UTF-8을 적용합니다.
        custom_env = os.environ.copy()
        custom_env["PYTHONUTF8"] = "1"
        
        # subprocess 자체의 입출력 인코딩도 utf-8로 명시합니다.
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            timeout=20, 
            encoding="utf-8", 
            env=custom_env
        )
        # 3. 만약 Semgrep 실행 중 내부 에러가 났다면 터미널에 원인을 출력하도록 합니다.
        if result.returncode != 0 and not result.stdout.strip().startswith("{"):
            print("[Semgrep 내부 에러 발생]\n", result.stderr)
            raise HTTPException(status_code=500, detail=f"Semgrep 실행 오류. 서버 터미널을 확인하세요.")

        try:
            parsed_output = json.loads(result.stdout)
            
            # 클라이언트 화면에 보안상 서버 내부 경로가 노출되지 않도록 마스킹 처리합니다.
            if "results" in parsed_output:
                for res in parsed_output["results"]:
                    res["path"] = f"scanned_target{file_extension}"
            
            # 전체 데이터 대신 "results" 배열만 반환합니다. (없을 경우를 대비해 빈 배열 [] 기본값 설정)
            return parsed_output.get("results", [])

            
        except json.JSONDecodeError:
            # 파싱 실패 시 터미널에 실제 출력값을 찍어보아 디버깅을 돕습니다.
            print("[JSON 파싱 에러] Semgrep 출력값:\n", result.stdout)
            raise HTTPException(status_code=500, detail="Semgrep 결과를 처리할 수 없습니다. 서버 터미널 로그를 확인하세요.")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")
    finally:
        # 검사 완료 후 서버 공간 확보를 위해 즉시 임시 파일을 삭제합니다.
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
