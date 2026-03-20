import os
import json
import tempfile
import subprocess
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles  # 추가된 부분

app = FastAPI()

# 추가된 부분: 'static' 폴더 안의 파일들을 '/static' URL 경로로 접근할 수 있게 연결합니다.
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
        # Semgrep을 실행하여 임시 파일을 스캔합니다 (자동 언어 감지 및 기본 룰셋 적용).
        command = ["semgrep", "scan", "--config", "auto", "--json", tmp_path]
        result = subprocess.run(command, capture_output=True, text=True, timeout=10)

        try:
            parsed_output = json.loads(result.stdout)
            
            # 클라이언트 화면에 보안상 서버 내부 경로가 노출되지 않도록 마스킹 처리합니다.
            if "results" in parsed_output:
                for res in parsed_output["results"]:
                    res["path"] = f"scanned_target{file_extension}"
            
            return parsed_output
            
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Semgrep 결과를 처리할 수 없습니다. 코드에 문법 오류가 없는지 확인하세요.")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")
    finally:
        # 검사 완료 후 서버 공간 확보를 위해 즉시 임시 파일을 삭제합니다.
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
