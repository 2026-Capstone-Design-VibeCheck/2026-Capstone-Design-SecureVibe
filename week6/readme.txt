1. 백엔드 세팅
# 1. backend 폴더로 이동
cd backend

# 2. 필요한 파이썬 라이브러리 설치 (multipart는 파일 업로드를 위해 필수입니다)
pip install fastapi uvicorn python-multipart

# 3. Semgrep 설치 (이미 설치되어 있다면 생략 가능)
pip install semgrep

# 4. FastAPI 서버 실행 (포트 8000번)
uvicorn main:app --reload

2.프론트엔드 세팅
# 1. frontend 폴더로 이동
cd frontend

# 2. package.json에 명시된 모든 패키지 설치
npm install

# 3. Next.js 개발 서버 실행 (포트 3000번)
npm run dev

