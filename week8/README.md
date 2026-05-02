# SecureVibe 🛡️

**SecureVibe**는 AI 기반의 코드 보안 취약점 점검 및 분석 플랫폼입니다. 사용자가 제출한 코드나 GitHub 레포지토리를 분석하여 보안 취약점을 찾아내고, AI 보안 전문가와의 채팅을 통해 해결 방안을 제시받을 수 있습니다.

## 🚀 주요 기능

- **코드 보안 스캔**:
  - 파일 업로드 및 코드 직접 입력을 통한 실시간 취약점 분석.
  - GitHub 레포지토리 URL을 통한 프로젝트 단위 스캔 지원.
- **Semgrep 기반 진단**: 정밀한 보안 규칙(Rule)을 바탕으로 코드 내 잠재적인 위험 요소 탐지.
- **AI 보안 전문가 (VibeCheck AI)**:
  - Google Gemini AI를 활용하여 탐지된 취약점에 대한 상세 설명 및 조치 방법 안내.
  - 보안 관련 대화형 인터페이스 제공.
- **사용자 관리**: Oracle Database 연동을 통한 안정적인 회원가입 및 로그인 기능.
- **Miro 스타일 UI**: 직관적이고 세련된 디자인 시스템을 적용하여 사용자 경험(UX) 극대화.

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS 4, Vanilla CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Analysis Tool**: Semgrep
- **Database**: Oracle Database (oracledb)
- **AI**: Google Generative AI (Gemini 2.5 Flash)

## 📁 프로젝트 구조

```text
.
├── frontend/          # Next.js 프론트엔드 애플리케이션
│   ├── app/           # 페이지 및 라우팅
│   ├── components/    # 재사용 가능한 UI 컴포넌트
│   ├── services/      # API 통신 로직
│   └── store/         # 상태 관리 (Zustand)
└── backend/           # FastAPI 백엔드 서버
    ├── main.py        # API 엔드포인트 및 핵심 로직
    └── requirements.txt # 파이썬 의존성 패키지
```

## ⚙️ 시작하기

### 1. Backend 설정
```bash
cd backend
pip install -r requirements.txt
# Semgrep 설치 필수
pip install semgrep
# 서버 실행
uvicorn main:app --reload
```

### 2. Frontend 설정
```bash
cd frontend
npm install
npm run dev
```
- 브라우저에서 `http://localhost:3000` 접속

## 📜 라이선스
이 프로젝트는 캡스톤 디자인 결과물로 제작되었습니다.
