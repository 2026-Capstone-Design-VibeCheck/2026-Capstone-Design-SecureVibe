async function runScanner() {
    const form = document.getElementById('scanForm');
    const resultOutput = document.getElementById('resultOutput');
    const fileInput = document.getElementById('codeFile').files[0];
    const textInput = document.getElementById('codeText').value;

    if (!fileInput && !textInput.trim()) {
        alert("파일을 업로드하거나 코드를 직접 입력해주세요.");
        return;
    }

    resultOutput.textContent = "Semgrep 분석 진행 중... (최대 10초 소요)";

    // 폼 데이터를 캡처하여 multipart/form-data 형식으로 준비합니다.
    const formData = new FormData(form);

    try {
        const response = await fetch('/scan', {
            method: 'POST',
            body: formData // Content-Type은 브라우저가 자동으로 설정합니다.
        });

        const data = await response.json();

        if (response.ok) {
          // 서버로부터 받은 data는 이제 배열(Array) 형태입니다.
          if (data.length === 0) {
              resultOutput.innerHTML = "<span style='color: green; font-weight: bold;'>✅ 보안 취약점이 발견되지 않았습니다. 안전한 코드입니다!</span>";
          } else {
              // 취약점이 발견된 경우
              let htmlContent = `<h4 style="color: red;">🚨 총 ${data.length}개의 보안 위협이 발견되었습니다.</h4><hr>`;

              data.forEach((vuln, index) => {
                  const lineNum = vuln.start.line; // 에러가 발생한 줄 번호
                  const severity = vuln.extra.severity; // 심각도 (WARNING, ERROR 등)
                  const message = vuln.extra.message; // 취약점 설명
                  const cwe = vuln.extra.metadata.cwe ? vuln.extra.metadata.cwe[0] : "분류 없음"; // CWE 보안 분류

                  htmlContent += `
                  <div style="margin-bottom: 15px; padding: 10px; background-color: #ffe6e6; border-left: 4px solid red; border-radius: 4px;">
                      <strong>[${index + 1}] 라인 ${lineNum} - 심각도: ${severity}</strong><br>
                      <span style="font-size: 13px; color: #555;">분류: ${cwe}</span><br><br>
                      ${message}
                  </div>
                  `;
              });

              resultOutput.innerHTML = htmlContent;
          }

        } else {
            resultOutput.textContent = "오류 발생: " + data.detail;
        }
    } catch (error) {
        resultOutput.textContent = "네트워크 오류: " + error;
    }
}
