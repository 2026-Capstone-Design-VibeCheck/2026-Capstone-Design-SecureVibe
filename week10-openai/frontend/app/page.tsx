'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/src/presentation/components/layout/NavBar' // 위에 내비 바 - 유저프로필이랑 알림창으로 연결
import ScanInputSelector from '@/src/presentation/components/features/ScanInputSelector' // 인풋 뭐할지 선택
import FileDropzone from '@/src/presentation/components/features/FileDropzone' // 파일 드롭존 컴포넌트
import CodeEditorInput from '@/src/presentation/components/features/CodeEditorInput' // 코드 입력하는존
import SecurityInfoCard from '@/src/presentation/components/features/SecurityInfoCard' // 보안 기능 설명 카드 컴포넌트
import { ScanMode } from '@/src/domain/entities/ScanType' // 스캔모드 저장하는 파일
import { SecurityFeature } from '@/src/domain/entities/SecurityFeature' // 보안모드 설명하는 파일
import ChatButton from '@/src/presentation/components/features/ChatButton'
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
  const router = useRouter()
  // 기본 스캔 관련 상태
  const [scanMode, setScanMode] = useState<ScanMode>('UPLOAD_FILES')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [codeContent, setCodeContent] = useState('')
  const [language, setLanguage] = useState('.py')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [codeurl, setCodeUrl] = useState('')

  // 검사 진행 여부와 서버에서 받은 결과를 저장하는 상태
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<any[] | null>(null)

  // 코드가 정상적으로 컴포넌트 "내부"로 들어왔습니다.
  const [suggestedFix, setSuggestedFix] = useState<string>('')
  const [fixLoading, setFixLoading] = useState<boolean>(false)

  const handleFilesSelected = (files: File[]) => {
    setErrorMsg(null)
    setScanResults(null)
    setSelectedFiles(files)
  }

  const handleError = (msg: string) => {
    setErrorMsg(msg)
  }

  // ScanAction 대신 직접 백엔드와 통신하는 함수
  const executeScan = async () => {
    if (scanMode === 'UPLOAD_FILES' && selectedFiles.length === 0) {
      setErrorMsg('업로드할 파일을 선택해주세요.')
      return
    }
    if (scanMode === 'DIRECT_CODE' && !codeContent.trim()) {
      setErrorMsg('검사할 코드를 입력해주세요.')
      return
    }
    if (scanMode === 'URL' && !codeurl.trim()) {
      setErrorMsg('주소를 입력해주세요')
      return
    }
    
    setIsScanning(true)
    setErrorMsg(null)
    setScanResults(null)
    setSuggestedFix('') // 새로운 스캔 시 이전 제안 초기화

    const formData = new FormData()

    if (scanMode === 'UPLOAD_FILES') {
      formData.append('code_file', selectedFiles[0])
    } else if (scanMode === 'DIRECT_CODE') {
      formData.append('code_text', codeContent)
      formData.append('language', language)
    } else if (scanMode === 'URL') {
      formData.append('codeurl', codeurl)
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/scan', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || '스캔 중 오류가 발생했습니다.')
      }
      sessionStorage.setItem('scanResults', JSON.stringify(data))
      sessionStorage.setItem('scanContext', codeContent)
      router.push('/report')
    } catch (err: any) {
      setErrorMsg(`서버 연결 오류: ${err.message}. 백엔드가 켜져 있는지 확인해주세요.`)
    } finally {
      setIsScanning(false)
    }
  }

  // AI 수정 제안 함수도 컴포넌트 내부로 안전하게 이동
  const handleSuggestFix = async (description: string, vulnerableCode: string) => {
    setFixLoading(true)
    setSuggestedFix('')
    try {
      const formData = new FormData()
      formData.append('vulnerability_description', description)
      formData.append('vulnerable_code', vulnerableCode)

      const response = await fetch('http://127.0.0.1:8000/suggest-fix', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '수정 코드 제안 실패')
      }

      const data = await response.json()
      setSuggestedFix(data.suggested_fix)
    } catch (error: any) {
      console.error('Error suggesting fix:', error)
      alert(`수정 코드 제안 중 오류 발생: ${error.message}`)
    } finally {
      setFixLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Arial,Helvetica,sans-serif]">
      <NavBar />
      <ChatButton />
      <main className="flex-1 flex flex-col pt-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Sssecure your code with continuous <br /> <span className="text-obsidian-green">Intelligent Analysis</span>
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
            ) : (scanMode === 'DIRECT_CODE' ? (
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
            ) : (
              <input 
                value={codeurl} 
                onChange={(e) => { setCodeUrl(e.target.value); setErrorMsg(null); setScanResults(null) }} 
                placeholder="Enter URL" 
                className="mt-2 ml-2 p-1 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 w-[calc(100%-16px)]"
              />
            ))}
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

        {/* 스캔 버튼 */}
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

        {/* 서버 분석 결과 (리포트 뷰) 출력 영역 */}
        {scanResults && (
          <div className="max-w-4xl mx-auto w-full mb-12 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* 리포트 헤더 */}
            <div className={`p-6 border-b ${scanResults.length === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Security Scan Report
                </h2>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${scanResults.length === 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {scanResults.length === 0 ? 'SAFE' : `${scanResults.length} VULNERABILITIES FOUND`}
                </span>
              </div>
            </div>

            {/* 리포트 바디 (취약점 목록) */}
            <div className="p-6">
              {scanResults.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-5xl">🛡️</span>
                  <p className="mt-4 text-lg font-medium text-gray-600">축하합니다! 발견된 보안 취약점이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {scanResults.map((vuln, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      {/* 취약점 타이틀 영역 */}
                      <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded mr-2">
                            {vuln.extra?.severity || 'HIGH'}
                          </span>
                          <span className="font-bold text-gray-800">
                            Issue #{index + 1} : Line {vuln.start?.line || '알 수 없음'}
                          </span>
                        </div>
                        <span className="text-sm font-mono text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {vuln.extra?.metadata?.cwe ? vuln.extra.metadata.cwe[0].split(':')[0] : 'CWE-Unknown'}
                        </span>
                      </div>
                      
                      {/* 취약점 상세 내용 */}
                      <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">
                          {vuln.extra?.message}
                        </p>
                        
                        {/* 발견된 취약 코드 조각 (있을 경우) */}
                        {vuln.extra?.lines && (
                          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                            <pre className="text-red-400 font-mono text-sm">
                              <code>{vuln.extra.lines.trim()}</code>
                            </pre>
                          </div>
                        )}

                        {/* AI 수정 제안 버튼 영역 */}
                        <div className="pt-2">
                          <button
                            onClick={() => handleSuggestFix(vuln.extra?.message, vuln.extra?.lines || codeContent || '')}
                            disabled={fixLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-all text-sm shadow-sm"
                          >
                            {fixLoading ? (
                              <><span className="animate-spin">⏳</span> AI 분석 중...</>
                            ) : (
                              <><span className="text-blue-300">✨</span> AI 수정 코드 생성하기</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI가 제안한 결과 창 (가장 최근에 요청한 수정안이 모달처럼 하단에 고정 표시됨) */}
              {suggestedFix && (
                <div className="mt-8 border-2 border-green-400 rounded-xl overflow-hidden shadow-md animate-fade-in-up">
                  <div className="bg-green-50 p-4 border-b border-green-200 flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h4 className="text-lg font-extrabold text-green-900">AI 컨설턴트 제안 코드</h4>
                  </div>
                  <div className="bg-gray-900 p-5 overflow-x-auto">
                    <pre className="text-green-400 font-mono text-sm leading-relaxed">
                      <code>{suggestedFix}</code>
                    </pre>
                  </div>
                  <div className="bg-gray-50 p-3 text-right">
                    <button 
                      onClick={() => setSuggestedFix('')} 
                      className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-1"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
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