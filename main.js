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
            resultOutput.textContent = JSON.stringify(data, null, 2);
        } else {
            resultOutput.textContent = "오류 발생: " + data.detail;
        }
    } catch (error) {
        resultOutput.textContent = "네트워크 오류: " + error;
    }
}
