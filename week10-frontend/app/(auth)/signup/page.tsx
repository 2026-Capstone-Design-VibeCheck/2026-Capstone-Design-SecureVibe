"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signup } from "@/services/auth"

export default function SignupPage() {
    const router = useRouter()
    const [sid, setSid] = useState("")
    const [sname, setSname] = useState("")
    const [spassword, setSpassword] = useState("")
    const [sapikey, setSapikey] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSignup = async () => {
        if (!sid.trim() || !sname.trim() || !spassword.trim() || !sapikey.trim()) return

        setIsLoading(true)
        const res = await signup(sid, sname, spassword, sapikey)
        setIsLoading(false)

        if (res.data.message === "회원가입 성공") {
            router.push("/login")
        } else {
            setError(res.data.message)
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-[440px] space-y-10 animate-fade-in">
                <header className="text-center space-y-3">
                    <div className="flex justify-center mb-8">
                        <div className="bg-miro-yellow w-12 h-12 rounded-xl flex items-center justify-center font-black text-miro-blue text-2xl shadow-sm">
                            S
                        </div>
                    </div>
                    <h1 className="text-[32px] md:text-[40px] font-bold text-miro-blue tracking-tight leading-tight">회원가입</h1>
                    <p className="text-slate text-[16px]">SecureVibe의 강력한 보안 분석을 시작하세요</p>
                </header>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate/60 uppercase tracking-widest ml-1">아이디</label>
                                <input
                                    type="text"
                                    placeholder="아이디"
                                    value={sid}
                                    onChange={(e) => setSid(e.target.value)}
                                    className="w-full h-[52px] px-5 rounded-[12px] border border-hairline bg-white text-miro-blue text-[15px] focus:border-miro-blue-action focus:ring-1 focus:ring-miro-blue-action outline-none transition-all placeholder:text-zinc-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-slate/60 uppercase tracking-widest ml-1">이름</label>
                                <input
                                    type="text"
                                    placeholder="이름"
                                    value={sname}
                                    onChange={(e) => setSname(e.target.value)}
                                    className="w-full h-[52px] px-5 rounded-[12px] border border-hairline bg-white text-miro-blue text-[15px] focus:border-miro-blue-action focus:ring-1 focus:ring-miro-blue-action outline-none transition-all placeholder:text-zinc-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate/60 uppercase tracking-widest ml-1">비밀번호</label>
                            <input
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={spassword}
                                onChange={(e) => setSpassword(e.target.value)}
                                className="w-full h-[52px] px-5 rounded-[12px] border border-hairline bg-white text-miro-blue text-[15px] focus:border-miro-blue-action focus:ring-1 focus:ring-miro-blue-action outline-none transition-all placeholder:text-zinc-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate/60 uppercase tracking-widest ml-1">API Key</label>
                            <input
                                type="text"
                                placeholder="분석을 위한 API Key"
                                value={sapikey}
                                onChange={(e) => setSapikey(e.target.value)}
                                className="w-full h-[52px] px-5 rounded-[12px] border border-hairline bg-white text-miro-blue text-[15px] focus:border-miro-blue-action focus:ring-1 focus:ring-miro-blue-action outline-none transition-all placeholder:text-zinc-300"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-miro-coral-light border border-miro-coral/10 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                            <svg className="w-5 h-5 text-miro-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[14px] text-miro-coral-dark font-medium">{error}</p>
                        </div>
                    )}

                    <button 
                        onClick={handleSignup} 
                        disabled={isLoading}
                        className="w-full h-[56px] bg-miro-blue text-white rounded-full font-bold text-[16px] hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm mt-4"
                    >
                        {isLoading ? "가입 중..." : "회원가입"}
                    </button>
                </div>

                <footer className="text-center pt-4">
                    <p className="text-slate text-[15px]">
                        이미 계정이 있으신가요?{" "}
                        <Link href="/login" className="text-miro-blue font-bold hover:underline decoration-2 underline-offset-4">
                            로그인
                        </Link>
                    </p>
                </footer>
            </div>
        </div>
    )
}