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
