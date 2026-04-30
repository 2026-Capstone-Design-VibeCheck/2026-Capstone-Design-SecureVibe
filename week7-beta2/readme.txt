1. 백엔드 세팅
# 1. backend 폴더로 이동
cd backend

# 2. 필요한 파이썬 라이브러리 설치 (multipart는 파일 업로드를 위해 필수입니다)
pip install fastapi uvicorn python-multipart

# 3. Semgrep 설치 (이미 설치되어 있다면 생략 가능)
pip install semgrep

#3.5 oracledb 설치(로그인, 회원가입 정보 관리용)
      pip install oracledb
      sql로 유저 생성(cmd로) - id= c##manager, password = hellocnu
      테이블 생성 - CREATE TABLE userlist(USERID int, ID varchar(255), name varchar(255), password varchar(255), key varchar(255));
      테스트용 유저 생성 - INSERT INTO userlist(USERID, ID, NAME, PASSWORD, KEY) VALUES (0, 'hellocse', 'test', '12345', '1q2w3e4r!');
      

# 4. FastAPI 서버 실행 (포트 8000번)
uvicorn main:app --reload

2.프론트엔드 세팅
# 1. frontend 폴더로 이동
cd frontend

# 2. package.json에 명시된 모든 패키지 설치
npm install

# 3. Next.js 개발 서버 실행 (포트 3000번)
npm run dev

