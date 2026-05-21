"use client"  // ← 맨 위에 꼭!

import Image from "next/image";
import Link from "next/link";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { scanFile, scanUrl, scanText } from '@/services/scan'
import { useScanStore } from "@/store/scanStore"



export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const setResults = useScanStore((state) => state.setResults)
  const [githubUrl, setGithubUrl] = useState("")
  const [loadingStep, setLoadingStep] = useState(0)
  const [codeText, setCodeText] = useState("")
  const [codeLanguage, setCodeLanguage] = useState(".py")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("code_file", file)

    setIsLoading(true)
    setLoadingStep(1)  // 파일 업로드 중

    setTimeout(() => setLoadingStep(2), 1000)  // 1초 후 분석 중

    const res = await scanFile(formData)
    setLoadingStep(3)  // 완료

    setTimeout(() => {
      setIsLoading(false)
      setResults(res.data)
      router.push("/report")
    }, 500)
  }

  const handleUrlScan = async () => {
    if (!githubUrl.trim()) return

    setIsLoading(true)
    setLoadingStep(1) // 저장소 확인 중

    // 분석 중임을 보여주기 위한 자연스러운 지연
    setTimeout(() => setLoadingStep(2), 1000)

    const res = await scanUrl(githubUrl)
    setLoadingStep(3) // 분석 완료

    setTimeout(() => {
      setIsLoading(false)
      setResults(res.data)
      router.push("/report")
    }, 500)
  }

  const handleCodeScan = async () => {
    if (!codeText.trim()) return

    setIsLoading(true)
    setLoadingStep(1) // 코드 업로드 중

    setTimeout(() => setLoadingStep(2), 1000)

    const res = await scanText(codeText, codeLanguage)
    setLoadingStep(3) // 분석 완료

    setTimeout(() => {
      setIsLoading(false)
      setResults(res.data)
      router.push("/report")
    }, 500)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-miro-blue selection:bg-miro-yellow/30 font-sans relative">

      {/* 전체 화면 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-[32px] shadow-[0_20px_60px_-10px_rgba(5,0,56,0.15)] p-10 flex flex-col gap-6 min-w-[360px] border border-hairline animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-miro-blue text-xl tracking-tight">보안 분석 진행 중</h3>
              <div className="w-6 h-6 border-3 border-miro-blue/10 border-t-miro-blue rounded-full animate-spin" />
            </div>

            <div className="space-y-4">
              <div className={`flex items-center gap-4 text-[15px] font-medium transition-all ${loadingStep >= 1 ? 'text-miro-blue' : 'text-zinc-300'}`}>
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-50 border border-hairline">
                  {loadingStep >= 2 ? '✅' : '1'}
                </span>
                파일 및 데이터 업로드
              </div>
              <div className={`flex items-center gap-4 text-[15px] font-medium transition-all ${loadingStep >= 2 ? 'text-miro-blue' : 'text-zinc-300'}`}>
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-50 border border-hairline">
                  {loadingStep >= 3 ? '✅' : loadingStep === 2 ? '⟳' : '2'}
                </span>
                취약점 데이터베이스 대조
              </div>
              <div className={`flex items-center gap-4 text-[15px] font-medium transition-all ${loadingStep >= 3 ? 'text-miro-blue' : 'text-zinc-300'}`}>
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-50 border border-hairline">
                  {loadingStep >= 3 ? '✅' : '3'}
                </span>
                보안 리포트 생성 완료
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <section className="py-[120px] px-8 overflow-hidden bg-white">
          <div className="max-w-[1280px] mx-auto text-center">
            <h2 className="text-[48px] md:text-[64px] font-medium leading-[1.1] mb-4 text-miro-blue tracking-tight relative inline-block">
              코드를 점검해 보세요
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-miro-yellow" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </h2>

            <p className="text-[18px] md:text-[20px] text-slate mb-16 max-w-xl mx-auto">
              저장소 주소를 붙여넣거나 파일을 드래그하여 <br className="hidden sm:block" />
              취약점을 즉시 찾아낼 수 있습니다.
            </p>

            {/* Whiteboard Frame Wrapper */}
            <div className="relative max-w-6xl mx-auto rounded-[32px] border border-hairline shadow-[0_24px_64px_-12px_rgba(5,0,56,0.12)] bg-zinc-50 p-6 overflow-hidden animate-fade-in">
              <div className="bg-white rounded-[24px] py-20 px-8 md:px-16 text-center">

                <div className="grid md:grid-cols-2 gap-8 items-stretch mb-6">
                  {/* 왼쪽: 파일 드래그앤드롭 (Miro Yellow Pastel) */}
                  <div className="bg-miro-yellow-light p-10 rounded-[28px] border border-miro-yellow/20 flex flex-col items-center justify-center min-h-[320px] transition-all hover:translate-y-[-4px]">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-miro-yellow-dark">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">파일 업로드</h3>
                    <p className="text-miro-yellow-dark/70 text-sm mb-8">.zip · 폴더 · 단일 파일 지원</p>

                    <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} disabled={isLoading} />
                    <label
                      htmlFor="file-upload"
                      className="px-8 py-3 bg-miro-blue text-white rounded-full font-medium text-sm cursor-pointer hover:bg-zinc-800 transition-all active:scale-95"
                    >
                      파일 찾아보기
                    </label>
                  </div>

                  {/* 오른쪽: GitHub URL (Miro Teal Pastel) */}
                  <div className="bg-miro-teal-light p-10 rounded-[28px] border border-miro-teal-light/50 flex flex-col items-center justify-center min-h-[320px] transition-all hover:translate-y-[-4px]">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-miro-teal-dark">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">GitHub 저장소</h3>
                    <p className="text-miro-teal-dark/70 text-sm mb-8">공개 저장소 즉시 분석 가능</p>

                    <div className="w-full max-w-sm flex flex-col gap-3">
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/org/repo"
                        className="w-full px-5 py-3 rounded-xl border border-hairline bg-white text-miro-blue text-sm focus:outline-none focus:ring-2 focus:ring-miro-blue/10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={handleUrlScan}
                        disabled={isLoading || !githubUrl.trim()}
                        className="w-full py-3 bg-miro-blue text-white rounded-full font-medium text-sm hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "분석 중..." : "분석 시작하기 →"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 코드 직접 입력 — 와이드 패널 (Miro Coral Pastel) */}
                <div className="bg-miro-coral-light p-8 rounded-[28px] border border-miro-coral/20 mb-6 transition-all hover:translate-y-[-2px]">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-miro-coral-dark flex-shrink-0">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold">코드 직접 입력</h3>
                        <p className="text-miro-coral-dark/70 text-sm">코드를 붙여넣어 즉시 분석</p>
                      </div>
                    </div>

                    {/* 언어 선택 pill 드롭다운 */}
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-white border border-miro-coral/30 rounded-full text-sm text-miro-blue font-medium focus:outline-none focus:border-miro-blue-action cursor-pointer disabled:opacity-50"
                    >
                      <option value=".py">Python</option>
                      <option value=".js">JavaScript</option>
                      <option value=".ts">TypeScript</option>
                      <option value=".java">Java</option>
                      <option value=".go">Go</option>
                      <option value=".c">C</option>
                      <option value=".cpp">C++</option>
                      <option value=".rb">Ruby</option>
                      <option value=".php">PHP</option>
                    </select>
                  </div>
                  <textarea
                    value={codeText}
                    onChange={(e) => setCodeText(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-36 px-4 py-3 bg-white border border-miro-coral/30 rounded-xl text-sm text-miro-blue resize-none focus:outline-none focus:border-miro-blue-action font-mono placeholder:text-miro-coral-dark/40 disabled:opacity-60"
                    placeholder="// 여기에 코드를 붙여넣으세요..."
                  />
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={handleCodeScan}
                      disabled={isLoading || !codeText.trim()}
                      className="px-8 py-3 bg-miro-blue text-white rounded-full font-medium text-sm hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "분석 중..." : "분석 시작하기 →"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center text-miro-blue/40 text-base font-bold tracking-tight">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    코드는 안전하게 암호화되어 외부로 유출되지 않습니다
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Massive Dark Footer
      <footer className="bg-miro-blue text-white py-20 px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-miro-yellow rounded-sm flex items-center justify-center font-black text-miro-blue">
                  SV
                </div>
                <span className="text-2xl font-bold tracking-tight">SecureVibe</span>
              </div>
              <p className="text-sm opacity-60 max-w-xs leading-relaxed mb-8">
                팀이 더 안전한 소프트웨어를 더 빠르게 배포할 수 있도록 돕는 비주얼 보안 플랫폼입니다.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </div>
              </div>
            </div>
            {[
              { title: "제품", links: ["기능소개", "보안", "연동", "요금제"] },
              { title: "솔루션", links: ["엔터프라이즈", "스타트업", "DevOps", "교육"] },
              { title: "리소스", links: ["문서", "API 레퍼런스", "보안 블로그", "커뮤니티"] },
              { title: "회사", links: ["소개", "채용", "연락처", "개인정보처리방침"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[16px] font-semibold mb-6">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link, j) => (
                    <li key={j}><Link href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">{link}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs opacity-40">
              © {new Date().getFullYear()} SecureVibe Security Inc. All rights reserved.
            </p>
            <div className="flex gap-8 text-xs opacity-40">
              <Link href="#" className="hover:opacity-100 transition-opacity">이용약관</Link>
              <Link href="#" className="hover:opacity-100 transition-opacity">쿠키 정책</Link>
              <Link href="#" className="hover:opacity-100 transition-opacity">쿠키 관리</Link>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
