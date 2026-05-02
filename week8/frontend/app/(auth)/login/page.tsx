"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { login } from "@/services/auth"
import { useAuthStore } from "@/store/authStore"


export default function LoginPage() {
    const router = useRouter()
    const [id, setId] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const setUser = useAuthStore((state) => state.setUser)

    const handleLogin = async () => {
        if (!id.trim() || !password.trim()) return

        setIsLoading(true)
        const res = await login(id, password)
        setIsLoading(false)

        if (res.data.message === "로그인 성공") {
            setUser(res.data.user)
            router.push("/")
        } else {
            setError("아이디 또는 비밀번호가 틀렸습니다.")
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-[400px] space-y-10 animate-fade-in">
                <header className="text-center space-y-3">
                    <div className="flex justify-center mb-8">
                        <div className="bg-miro-yellow w-12 h-12 rounded-xl flex items-center justify-center font-black text-miro-blue text-2xl shadow-sm">
                            S
                        </div>
                    </div>
                    <h1 className="text-[32px] md:text-[40px] font-bold text-miro-blue tracking-tight leading-tight">로그인</h1>
                    <p className="text-slate text-[16px]">SecureVibe에 다시 오신 것을 환영합니다</p>
                </header>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate/60 uppercase tracking-widest ml-1">아이디</label>
                            <input
                                type="text"
                                placeholder="아이디를 입력하세요"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="w-full h-[52px] px-5 rounded-[12px] border border-hairline bg-white text-miro-blue text-[15px] focus:border-miro-blue-action focus:ring-1 focus:ring-miro-blue-action outline-none transition-all placeholder:text-zinc-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate/60 uppercase tracking-widest ml-1">비밀번호</label>
                            <input
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full h-[56px] bg-miro-blue text-white rounded-full font-bold text-[16px] hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm mt-4"
                    >
                        {isLoading ? "로그인 중..." : "로그인"}
                    </button>
                </div>

                <footer className="text-center pt-4">
                    <p className="text-slate text-[15px]">
                        계정이 없으신가요?{" "}
                        <Link href="/signup" className="text-miro-blue font-bold hover:underline decoration-2 underline-offset-4">
                            회원가입
                        </Link>
                    </p>
                </footer>
            </div>
        </div>
    )
}