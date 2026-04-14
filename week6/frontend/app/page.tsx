'use client'

import { useState } from 'react'
import NavBar from '@/src/presentation/components/layout/NavBar'
import ScanInputSelector from '@/src/presentation/components/features/ScanInputSelector'
import FileDropzone from '@/src/presentation/components/features/FileDropzone'
import CodeEditorInput from '@/src/presentation/components/features/CodeEditorInput'
import SecurityInfoCard from '@/src/presentation/components/features/SecurityInfoCard'
import { ScanMode } from '@/src/domain/entities/ScanType'
import { SecurityFeature } from '@/src/domain/entities/SecurityFeature'

const SECURITY_FEATURES: SecurityFeature[] = [
  {
    id: 'ai-scan',
    title: 'Deep AI Scanning',
    description: 'Advanced AI analysis to detect zero-day vulnerabilities and complex logic flaws that traditional scanners miss.',
    iconType: 'ai'
  },
  {
    id: 'owasp',
    title: 'OWASP Top 10',
    description: 'Complete coverage of OWASP top 10 security risks including Injection, Broken Authentication, and XSS.',
    iconType: 'shield'
  },
  {
    id: 'zk',
    title: 'Zero-Knowledge',
    description: 'Your code never leaves your browser. All static analysis is performed locally for ultimate privacy.',
    iconType: 'lock'
  }
]

export default function Home() {
  const [scanMode, setScanMode] = useState<ScanMode>('UPLOAD_FILES')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [codeContent, setCodeContent] = useState('')
  const [language, setLanguage] = useState('.py')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 새로 추가된 상태: 검사 진행 여부와 서버에서 받은 결과를 저장합니다.
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<any[] | null>(null)

  const handleFilesSelected = (files: File[]) => {
    setErrorMsg(null)
    setScanResults(null)
    setSelectedFiles(files)
  }

  const handleError = (msg: string) => {
    setErrorMsg(msg)
  }

  // ScanAction 대신 직접 백엔드와 통신하는 함수입니다.
  const executeScan = async () => {
    if (scanMode === 'UPLOAD_FILES' && selectedFiles.length === 0) {
      setErrorMsg('업로드할 파일을 선택해주세요.')
      return
    }
    if (scanMode === 'DIRECT_CODE' && !codeContent.trim()) {
      setErrorMsg('검사할 코드를 입력해주세요.')
      return
    }

    setIsScanning(true)
    setErrorMsg(null)
    setScanResults(null)

    const formData = new FormData()

    if (scanMode === 'UPLOAD_FILES') {
      formData.append('code_file', selectedFiles[0])
    } else {
      formData.append('code_text', codeContent)
      formData.append('language', language)
    }

    try {
      // 중요: 백엔드 주소로 정확히 요청합니다. FastAPI의 기본 포트인 8000번을 명시합니다.
      const response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || '스캔 중 오류가 발생했습니다.')
      }

      // 서버로부터 받은 취약점 배열 데이터를 상태에 저장합니다.
      setScanResults(data)
    } catch (err: any) {
      setErrorMsg(`서버 연결 오류: ${err.message}. 백엔드가 켜져 있는지 확인해주세요.`)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Arial,Helvetica,sans-serif]">
      <NavBar />

      <main className="flex-1 flex flex-col pt-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Secure your code with continuous <br /> <span className="text-obsidian-green">Intelligent Analysis</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Drag and drop your project files or paste snippets instantly. Detect vulnerabilities before they hit production.
          </p>
        </div>

        {/* Input area */}
        <div className="max-w-3xl mx-auto w-full mb-8 relative z-10">
          <ScanInputSelector currentMode={scanMode} onChange={setScanMode} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            {scanMode === 'UPLOAD_FILES' ? (
              <FileDropzone onFilesSelected={handleFilesSelected} onError={handleError} />
            ) : (
              <>
                <CodeEditorInput value={codeContent} onChange={(val) => {
                  setErrorMsg(null)
                  setScanResults(null)
                  setCodeContent(val)
                }} />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-2 ml-2 p-1 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                >
                  <option value=".py">Python</option>
                  <option value=".js">JavaScript</option>
                  <option value=".java">Java</option>
                  <option value=".c">C/C++</option>
                </select>
              </>
            )}
            {errorMsg && <p className="text-red-500 mt-2 text-sm text-center font-medium">{errorMsg}</p>}
            {scanMode === 'UPLOAD_FILES' && selectedFiles.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {selectedFiles.map(f => (
                  <span key={f.name} className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-medium border border-teal-200">
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 기존 ScanAction 컴포넌트를 대체하는 스캔 버튼 */}
        <div className="flex justify-center mb-12">
          <button
            onClick={executeScan}
            disabled={isScanning}
            className={`px-8 py-3 rounded-lg font-bold text-white transition-colors ${
              isScanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0f172a] hover:bg-obsidian-green hover:text-[#0f172a]'
            }`}
          >
            {isScanning ? '분석 진행 중...' : 'INITIATE SECURITY SCAN'}
          </button>
        </div>

        {/* 서버 분석 결과 출력 영역 */}
        {scanResults && (
          <div className="max-w-3xl mx-auto w-full mb-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold mb-4">
              {scanResults.length === 0 ? (
                 <span className="text-green-600">✅ 보안 취약점이 발견되지 않았습니다. 안전한 코드입니다!</span>
              ) : (
                 <span className="text-red-600">🚨 총 {scanResults.length}개의 보안 위협이 발견되었습니다.</span>
              )}
            </h3>

            <div className="space-y-4">
              {scanResults.map((vuln, index) => (
                <div key={index} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
                  <p className="font-semibold text-red-900">
                    [{index + 1}] 라인 {vuln.start.line} - 심각도: {vuln.extra.severity}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    분류: {vuln.extra.metadata?.cwe ? vuln.extra.metadata.cwe[0] : '분류 없음'}
                  </p>
                  <p className="text-gray-800 font-mono text-sm bg-red-100 p-2 rounded mt-2">
                    {vuln.extra.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Grid for Security Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-auto pb-16">
          {SECURITY_FEATURES.map(feature => (
            <SecurityInfoCard key={feature.id} feature={feature} />
          ))}
        </div>

      </main>
    </div>
  )
}
