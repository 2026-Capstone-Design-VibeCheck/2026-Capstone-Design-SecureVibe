# backend/main.py
import os
import uuid
import json
import subprocess
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/scan")
async def scan_code(
    code_file: UploadFile = File(None),
    code_text: str = Form(""),
    language: str = Form(".txt")
):
    code_content = ""
    file_extension = ".txt"

    if code_file and code_file.filename:
        code_content = (await code_file.read()).decode("utf-8")
        _, file_extension = os.path.splitext(code_file.filename)
    elif code_text.strip():
        code_content = code_text
        file_extension = language
    else:
        raise HTTPException(status_code=400, detail="입력된 코드나 파일이 없습니다.")

    # [핵심 수정] OS 임시 폴더 대신 현재 폴더에 랜덤한 이름으로 직접 파일을 생성합니다.
    # 이렇게 하면 Semgrep이 무시하지 않고 100% 정밀 검사합니다.
    tmp_filename = f"scan_target_{uuid.uuid4().hex}{file_extension}"

    with open(tmp_filename, 'w', encoding='utf-8') as tmp_file:
        tmp_file.write(code_content)

    try:
        # 강력한 p/security 룰셋을 적용하여 취약점을 샅샅이 찾아냅니다.
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

            # 보안상 실제 파일 이름(랜덤)을 숨기고 깔끔하게 보여줍니다.
            for res in results_array:
                res["path"] = f"scanned_target{file_extension}"

            return results_array

        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="결과를 처리할 수 없습니다.")

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="검사 시간이 초과되었습니다.")
    finally:
        # 검사가 끝나면 생성했던 파일을 깔끔하게 지웁니다.
        if os.path.exists(tmp_filename):
            os.remove(tmp_filename)
