# SecureVibe

**SecureVibe**는 AI 기반의 코드 보안 취약점 점검 및 분석 플랫폼입니다. 업로드한 코드나 GitHub 레포지토리를 Semgrep으로 정밀 분석하고, Gemini AI를 통해 취약점 설명과 수정 코드를 제안받을 수 있습니다.

## 주요 기능

- **코드 보안 스캔**: 파일 업로드, 코드 직접 입력, GitHub URL 세 가지 방식 지원
- **Semgrep 정밀 분석**: `auto` 룰셋 기반으로 CWE·OWASP 분류까지 제공
- **AI 수정안 제안**: 취약 코드 Before/After 비교 (취약 라인 하이라이트 포함)
- **AI 채팅**: 탐지된 취약점에 대해 Gemini와 대화형 Q&A
- **로그인 없이 사용 가능**: 네브바 설정 아이콘에서 Gemini API 키 입력 후 즉시 AI 기능 사용
- **회원가입/로그인**: Oracle DB 연동 (추후 스캔 결과 기록 용도)

## 기술 스택

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Analysis**: Semgrep (`auto` 룰셋)
- **AI**: Google Gemini 2.5 Flash (`google-genai`)
- **Database**: Oracle Database (`oracledb`)

## 프로젝트 구조

```
.
├── frontend/
│   ├── app/            # 페이지 및 라우팅
│   ├── components/     # Navbar, ChatBot 등 공통 컴포넌트
│   ├── services/       # API 통신 (scan, chat, suggestFix 등)
│   └── store/          # Zustand 상태 (auth, scan)
└── backend/
    └── main.py         # FastAPI 엔드포인트 (/scan, /chat, /suggest-fix, /login, /signup)
```

## 시작하기

### 1. Backend

```bash
cd backend
pip install fastapi uvicorn python-multipart oracledb google-genai semgrep
uvicorn main:app --reload --reload-exclude scan_tmp
```

서버: `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

브라우저: `http://localhost:3000`

### 3. AI 기능 사용

1. 네브바 우측 상단 설정(기어) 아이콘 클릭
2. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급한 Gemini API 키 입력
3. 저장 후 AI 수정안 생성 및 채팅 사용 가능 (로그인 불필요)

## 라이선스

이 프로젝트는 캡스톤 디자인 결과물로 제작되었습니다.
