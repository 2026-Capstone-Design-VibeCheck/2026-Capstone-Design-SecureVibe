export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface VulnerabilityInfo {
    severity: Severity;
    title: string;
    owasp: string;
    description: string;
    risk: string;
    howToFix: string[];
    beforeCode: string;
    afterCode: string;
}

export const CWE_MAPPING: Record<string, VulnerabilityInfo> = {
    // ────────────────────────────────────────────
    // Critical
    // ────────────────────────────────────────────
    'CWE-89': {
        severity: 'critical',
        title: 'SQL Injection',
        owasp: 'A03:2021-Injection',
        description: '애플리케이션이 외부 입력값을 적절히 검증하지 않고 SQL 쿼리 생성에 사용하여 데이터베이스를 조작할 수 있는 취약점입니다.',
        risk: '공격자가 데이터베이스의 모든 데이터를 탈취, 수정 또는 삭제할 수 있으며 관리자 권한을 획득할 수 있습니다.',
        howToFix: [
            '파라미터화된 쿼리(Prepared Statement) 사용',
            'ORM(TypeORM, Prisma 등) 보안 옵션 활용',
            '입력값에 대한 화이트리스트 기반 검증'
        ],
        beforeCode: "const query = 'SELECT * FROM users WHERE id = ' + userId;",
        afterCode: "const query = 'SELECT * FROM users WHERE id = ?'; // db.query(query, [userId])"
    },
    'CWE-78': {
        severity: 'critical',
        title: 'OS Command Injection',
        owasp: 'A03:2021-Injection',
        description: '외부 입력값이 운영체제 명령어의 일부로 실행되어 서버 권한을 탈취당할 수 있는 위험한 취약점입니다.',
        risk: '공격자가 서버 환경에서 임의의 명령어를 실행하여 전체 시스템을 장악하거나 내부망으로 침투할 수 있습니다.',
        howToFix: [
            '운영체제 명령어 실행 함수(exec, spawn 등) 사용 자제',
            '명령어 대신 언어 내장 API 사용',
            '입력값에서 특수문자(; | & $ 등) 필터링'
        ],
        beforeCode: "exec('ls -l ' + directoryName);",
        afterCode: "// OS 명령어 대신 내장 모듈 사용\nfs.readdirSync(directoryPath);"
    },
    'CWE-94': {
        severity: 'critical',
        title: 'Code Injection',
        owasp: 'A03:2021-Injection',
        description: '서버 측에서 외부 입력값이 코드로 해석되어 실행되는 취약점으로, 원격 코드 실행(RCE)으로 이어질 수 있습니다.',
        risk: '공격자가 서버에서 임의의 코드를 실행하여 데이터를 유출하거나 서버를 완전히 통제할 수 있습니다.',
        howToFix: [
            'eval(), new Function() 등 동적 코드 실행 함수 사용 금지',
            '사용자 입력을 직렬화된 데이터 처리 시 엄격한 타입 체크'
        ],
        beforeCode: "eval(req.body.config);",
        afterCode: "JSON.parse(req.body.config);"
    },
    'CWE-917': {
        severity: 'critical',
        title: 'Expression Language Injection',
        owasp: 'A03:2021-Injection',
        description: 'EL 구문에 외부 입력이 삽입되어 서버의 민감한 데이터에 접근하거나 임의 코드를 실행할 수 있습니다.',
        risk: '서버 환경의 객체에 접근하여 민감한 설정을 변경하거나 원격 코드 실행이 가능합니다.',
        howToFix: [
            '사용자 입력을 EL 표현식에 직접 전달하지 않음',
            '최신 버전의 템플릿 엔진 및 프레임워크 유지'
        ],
        beforeCode: "renderTemplate('${' + userInput + '}');",
        afterCode: "renderTemplate(userInput);"
    },

    // ────────────────────────────────────────────
    // High
    // ────────────────────────────────────────────
    'CWE-79': {
        severity: 'high',
        title: 'Cross-Site Scripting (XSS)',
        owasp: 'A03:2021-Injection',
        description: '사용자의 브라우저에서 악성 스크립트가 실행되도록 하여 세션 탈취나 페이지 변조를 유발하는 취약점입니다.',
        risk: '사용자의 세션 쿠키를 탈취하여 계정을 하이재킹하거나 피싱 사이트로 유도할 수 있습니다.',
        howToFix: [
            '출력 시 HTML 엔티티 인코딩 적용',
            'DOM Purify 등 라이브러리를 사용한 살균(Sanitize)',
            'Content Security Policy(CSP) 설정'
        ],
        beforeCode: "element.innerHTML = userInput;",
        afterCode: "element.textContent = userInput;"
    },
    'CWE-798': {
        severity: 'high',
        title: 'Use of Hardcoded Credentials',
        owasp: 'A07:2021-Identification and Authentication Failures',
        description: '소스코드 내에 암호, API 키 등 민감한 정보가 직접 노출되어 있어 공격자가 시스템 권한을 획득할 수 있습니다.',
        risk: '소스코드 유출 시 서비스의 모든 권한이 공격자에게 넘어가며 2차 피해를 유발합니다.',
        howToFix: [
            '환경 변수(.env) 파일 사용 및 관리',
            'AWS Secrets Manager, Vault 등 전문 비밀관리 도구 활용'
        ],
        beforeCode: "const dbPassword = 'super-secret-password';",
        afterCode: "const dbPassword = process.env.DB_PASSWORD;"
    },
    'CWE-434': {
        severity: 'high',
        title: 'Unrestricted Upload of File with Dangerous Type',
        owasp: 'A03:2021-Injection',
        description: '위험한 확장자를 가진 파일 업로드를 허용하여 웹쉘 실행 등 서버 장악의 원인이 될 수 있습니다.',
        risk: '악성 스크립트(Webshell)가 업로드되어 실행될 경우 서버 제어권을 완전히 상실합니다.',
        howToFix: [
            '파일 확장자 및 MIME 타입 화이트리스트 검증',
            '파일 이름을 임의의 문자열(UUID 등)로 변경하여 저장',
            '실행 권한이 없는 별도의 저장소(S3 등)에 저장'
        ],
        beforeCode: "saveFile(file.name, file.data);",
        afterCode: "if(allowedExtensions.includes(ext)) { saveFile(uuid() + ext, file.data); }"
    },
    'CWE-22': {
        severity: 'high',
        title: 'Path Traversal',
        owasp: 'A01:2021-Broken Access Control',
        description: '파일 경로 제어 문자를 이용해 의도하지 않은 시스템 디렉토리에 접근하고 파일을 열람할 수 있는 취약점입니다.',
        risk: '서버 내의 설정 파일(/etc/passwd 등)이나 소스코드 등 민감한 파일을 외부에 노출시킵니다.',
        howToFix: [
            '사용자 입력에서 .. / \ 등 경로 제어 문자 제거',
            '파일 시스템 접근 시 기준 경로(Base Path) 고정 및 basename() 사용'
        ],
        beforeCode: "readFile('/uploads/' + filename);",
        afterCode: "const safePath = path.join('/uploads/', path.basename(filename));\nreadFile(safePath);"
    },
    'CWE-918': {
        severity: 'high',
        title: 'Server-Side Request Forgery (SSRF)',
        owasp: 'A10:2021-Server-Side Request Forgery',
        description: '서버가 공격자가 의도한 주소로 요청을 보내게 하여 내부 자원을 노출시키거나 공격의 징검다리로 활용되는 취약점입니다.',
        risk: '외부에서 접근 불가능한 내부 관리 페이지나 클라우드 메타데이터 서비스(IMDS)에 접근할 수 있습니다.',
        howToFix: [
            '요청 대상 도메인/IP 화이트리스트 관리',
            '내부 사설 IP(10.x.x.x, 192.168.x.x 등) 대역으로의 요청 차단'
        ],
        beforeCode: "axios.get(req.query.url);",
        afterCode: "if(allowedDomains.includes(new URL(url).hostname)) { axios.get(url); }"
    },
    'CWE-611': {
        severity: 'high',
        title: 'XML External Entity (XXE) Injection',
        owasp: 'A03:2021-Injection',
        description: 'XML 파서가 외부 엔티티를 처리하는 과정에서 서버 내부 파일 열람이나 SSRF를 유발할 수 있습니다.',
        risk: '서버 내 민감 정보 유출 및 로컬 서비스 거부 공격(DoS)이 가능합니다.',
        howToFix: [
            'XML 파서 설정에서 외부 엔티티(DTD) 비활성화',
            '가능한 경우 XML 대신 JSON 데이터 포맷 사용'
        ],
        beforeCode: "parser.parseString(xmlData);",
        afterCode: "parser.parseString(xmlData, { noent: true }); // DTD 비활성화"
    },
    'CWE-287': {
        severity: 'high',
        title: 'Improper Authentication',
        owasp: 'A07:2021-Identification and Authentication Failures',
        description: '본인 확인 절차를 거치지 않거나 우회하여 타인의 계정으로 접근할 수 있는 취약점입니다.',
        risk: '공격자가 다른 사용자의 계정을 탈취하거나 권한이 없는 기능을 실행할 수 있습니다.',
        howToFix: [
            '강력한 비밀번호 정책 및 다중 인증(MFA) 도입',
            '세션 식별자의 안전한 생성 및 관리'
        ],
        beforeCode: "if(user.id === req.body.id) { login(user); }",
        afterCode: "const isValid = await bcrypt.compare(password, user.hash);\nif(isValid) { login(user); }"
    },
    'CWE-862': {
        severity: 'high',
        title: 'Missing Authorization',
        owasp: 'A01:2021-Broken Access Control',
        description: '적절한 권한 검증 절차가 누락되어 일반 사용자가 관리자 기능에 접근하거나 타인의 데이터를 조작할 수 있습니다.',
        risk: '비정상적인 접근을 통해 데이터 유출 및 시스템 설정이 변경될 수 있습니다.',
        howToFix: [
            '모든 엔드포인트에 대해 RBAC(역할 기반 접근 제어) 적용',
            '사용자 소유 데이터에 대한 식별자(ID) 검증 추가'
        ],
        beforeCode: "app.get('/api/admin/config', (req, res) => { ... });",
        afterCode: "app.get('/api/admin/config', checkRole('ADMIN'), (req, res) => { ... });"
    },

    // ────────────────────────────────────────────
    // Medium
    // ────────────────────────────────────────────
    'CWE-327': {
        severity: 'medium',
        title: 'Use of a Broken or Risky Cryptographic Algorithm',
        owasp: 'A02:2021-Cryptographic Failures',
        description: '보안성이 입증되지 않았거나 취약점이 발견된 암호화 알고리즘을 사용하여 데이터가 복호화될 위험이 있습니다.',
        risk: '암호화된 데이터가 비교적 짧은 시간 안에 복구되어 기밀성이 깨질 수 있습니다.',
        howToFix: [
            'MD5, SHA1 대신 SHA-256 이상의 최신 알고리즘 사용',
            'AES-256 등 표준화된 대칭키 암호화 알고리즘 권장'
        ],
        beforeCode: "const hash = crypto.createHash('md5').update(data).digest();",
        afterCode: "const hash = crypto.createHash('sha256').update(data).digest();"
    },
    'CWE-1104': {
        severity: 'medium',
        title: 'Use of Unmaintained Third-Party Components',
        owasp: 'A06:2021-Vulnerable and Outdated Components',
        description: '보안 업데이트가 중단되거나 알려진 취약점이 있는 외부 라이브러리를 사용하여 전체 시스템을 위험에 노출시킵니다.',
        risk: '알려진 취약점을 이용한 자동화된 공격 도구의 타겟이 되기 쉽습니다.',
        howToFix: [
            '정기적인 의존성 보안 스캔(npm audit, Snyk 등)',
            '사용하지 않는 라이브러리 및 종속성 제거'
        ],
        beforeCode: "// package.json 내 오래된 라이브러리 방치",
        afterCode: "// npm audit fix 실행 및 최신 버전 업데이트 유지"
    },
    'CWE-352': {
        severity: 'medium',
        title: 'Cross-Site Request Forgery (CSRF)',
        owasp: 'A01:2021-Broken Access Control',
        description: '사용자가 의도하지 않은 요청을 특정 웹사이트에 강제로 보내게 하여 데이터 변경 등을 유발하는 취약점입니다.',
        risk: '사용자 모르게 비밀번호가 변경되거나 게시글이 작성되는 등 원치 않는 행위가 수행됩니다.',
        howToFix: [
            'CSRF 토큰 사용',
            'SameSite 쿠키 속성을 Strict 또는 Lax로 설정',
            '민감한 기능에 대한 재인증 요구'
        ],
        beforeCode: "res.cookie('session', id);",
        afterCode: "res.cookie('session', id, { sameSite: 'strict', httpOnly: true });"
    },
    'CWE-312': {
        severity: 'medium',
        title: 'Cleartext Storage of Sensitive Information',
        owasp: 'A02:2021-Cryptographic Failures',
        description: '중요한 정보를 암호화하지 않고 평문으로 저장하여 물리적/논리적 접근 시 정보가 유출될 수 있습니다.',
        risk: '데이터베이스나 로그 파일이 노출될 경우 즉각적인 정보 유출로 이어집니다.',
        howToFix: [
            '중요 정보 저장 전 암호화 및 해싱 적용',
            '로그 출력 시 마스킹 처리'
        ],
        beforeCode: "db.save({ email, password });",
        afterCode: "const hashedPw = await bcrypt.hash(password, 10);\ndb.save({ email, password: hashedPw });"
    },
    'CWE-400': {
        severity: 'medium',
        title: 'Uncontrolled Resource Consumption',
        owasp: 'A04:2021-Insecure Design',
        description: 'CPU, 메모리 등 자원 사용을 제한하지 않아 서비스 거부(DoS) 상태를 유발할 수 있는 취약점입니다.',
        risk: '서버 자원 고갈로 인해 정상적인 서비스 운영이 중단될 수 있습니다.',
        howToFix: [
            '요청 크기 제한 및 Rate Limiting 설정',
            '루프 및 재귀 호출에 대한 최대 실행 횟수 제한'
        ],
        beforeCode: "app.post('/upload', (req, res) => { ... });",
        afterCode: "app.use('/upload', limit({ max: '1mb' })); // 파일 크기 제한"
    },
    'CWE-20': {
        severity: 'medium',
        title: 'Improper Input Validation',
        owasp: 'A03:2021-Injection',
        description: '사용자 입력값에 대한 검증이 부족하여 예기치 않은 시스템 동작을 유발하거나 다른 공격의 기반이 될 수 있습니다.',
        risk: '잘못된 데이터 형식 입력 시 시스템 에러를 발생시키거나 보안 로직을 우회할 수 있습니다.',
        howToFix: [
            '입력값에 대한 스키마 검증(Joi, Zod 등) 도입',
            '타입, 길이, 형식, 범위에 대한 엄격한 체크'
        ],
        beforeCode: "const age = req.body.age;",
        afterCode: "const age = Number(req.body.age);\nif(isNaN(age) || age < 0) throw Error();"
    },
    'CWE-330': {
        severity: 'medium',
        title: 'Use of Insufficiently Random Values',
        owasp: 'A02:2021-Cryptographic Failures',
        description: '예측 가능한 난수를 사용하여 세션 하이재킹이나 암호 우회 등이 발생할 수 있는 취약점입니다.',
        risk: '공격자가 난수 패턴을 예측하여 인증 토큰이나 비밀번호 재설정 링크를 생성할 수 있습니다.',
        howToFix: [
            '보안적으로 안전한 난수 생성기(crypto.randomBytes 등) 사용',
            'Math.random()과 같이 예측 가능한 함수 사용 금지'
        ],
        beforeCode: "const token = Math.random().toString();",
        afterCode: "const token = crypto.randomBytes(32).toString('hex');"
    },

    // ────────────────────────────────────────────
    // Low
    // ────────────────────────────────────────────
    'CWE-200': {
        severity: 'low',
        title: 'Exposure of Sensitive Information to an Unauthorized Actor',
        owasp: 'A02:2021-Cryptographic Failures',
        description: '시스템 구성 정보, 에러 메시지 등이 외부에 노출되어 공격자에게 유용한 정보를 제공하게 됩니다.',
        risk: '시스템 버전, 경로 정보 등이 공격자의 정찰 단계에서 악용될 수 있습니다.',
        howToFix: [
            '상세한 에러 스택 추적 정보를 사용자에게 노출하지 않음',
            'HTTP 응답 헤더에서 서버 정보(X-Powered-By 등) 제거'
        ],
        beforeCode: "res.status(500).send(error.stack);",
        afterCode: "res.status(500).send('Internal Server Error');"
    },
    'CWE-601': {
        severity: 'low',
        title: "URL Redirection to Untrusted Site ('Open Redirect')",
        owasp: 'A01:2021-Broken Access Control',
        description: '외부 입력에 의해 사용자를 악성 사이트로 리다이렉트시켜 피싱 공격 등에 활용될 수 있습니다.',
        risk: '신뢰할 수 있는 도메인을 통해 악성 사이트로 연결되므로 사용자가 속기 쉽습니다.',
        howToFix: [
            '리다이렉트 대상을 미리 정의된 화이트리스트로 한정',
            '도메인 상대 경로(/)만 허용'
        ],
        beforeCode: "res.redirect(req.query.next);",
        afterCode: "if(isSafeUrl(nextUrl)) res.redirect(nextUrl);"
    }
};

/**
 * CWE 코드를 입력받아 매핑된 정보를 반환합니다.
 */
export const getVulnerabilityInfo = (cwe: string): VulnerabilityInfo => {
    const key = cwe.startsWith('CWE-') ? cwe : `CWE-${cwe}`;

    return CWE_MAPPING[key] || {
        severity: 'medium',
        title: `Vulnerability ${key}`,
        owasp: 'A00:2021-Unknown',
        description: '해당 CWE 항목에 대한 상세 정보가 등록되지 않았습니다.',
        risk: '알 수 없는 보안 위험이 발생할 수 있습니다.',
        howToFix: ['보안 전문가에게 문의하세요.', '입력값 검증을 철저히 하세요.'],
        beforeCode: '// No sample available',
        afterCode: '// No sample available'
    };
};