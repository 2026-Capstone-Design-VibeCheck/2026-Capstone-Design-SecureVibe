"""
main.py의 /suggest-fix 및 /chat 시스템 프롬프트와 동일한 본을 유지한다.
평가가 실서비스와 동일한 입력을 받도록 보장.
"""

SUGGEST_FIX_SYSTEM = "You are a professional software security assistant."


def build_suggest_fix_prompt(vulnerability_description: str, vulnerable_code: str) -> str:
    return f"""당신은 보안 전문가 코드 리뷰어입니다.
아래 코드는 다음 취약점이 발견되었습니다:
- 설명: {vulnerability_description}

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


CHAT_SYSTEM_PROMPT = (
    "당신은 보안 전문가 AI입니다. "
    "사용자가 제공한 실제 코드를 참고해서 구체적으로 답변하세요. "
    "일반론이 아닌 이 코드의 변수명·구조를 짚어 설명하고, "
    "OWASP Top 10 등 보안 취약점 맥락에서 안전한 코딩 방법을 제안하세요."
)
