"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuthStore } from "@/store/authStore"

export default function Navbar() {
    const user = useAuthStore((state) => state.user)
    const clearUser = useAuthStore((state) => state.clearUser)
    const guestApiKey = useAuthStore((state) => state.guestApiKey)
    const setGuestApiKey = useAuthStore((state) => state.setGuestApiKey)
    const [showKeyPopover, setShowKeyPopover] = useState(false)
    const [keyInput, setKeyInput] = useState(guestApiKey)

    const handleSaveKey = () => {
        setGuestApiKey(keyInput.trim())
        setShowKeyPopover(false)
    }

    const hasKey = !!guestApiKey

    return (
        <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-hairline">
            <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-6 h-6 bg-miro-yellow rounded-sm flex items-center justify-center text-miro-blue">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0110 0v4"></path>
                            </svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-miro-blue">
                            SecureVibe
                        </span>
                    </Link>

                    <div className="flex items-center gap-6 text-[15px] font-medium text-miro-blue/60">
                        <Link href="/" className="hover:text-miro-blue transition-colors">Scan</Link>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <Link href="/report" className="hover:text-miro-blue transition-colors">Report</Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3 bg-zinc-50 pl-4 pr-1.5 py-1.5 rounded-full border border-hairline shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-miro-yellow flex items-center justify-center text-[10px] font-black text-miro-blue border border-miro-yellow-deep/20">
                                    {user.name.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="text-[13px] font-bold text-miro-blue/70">{user.name}님</span>
                            </div>
                            <button
                                onClick={() => clearUser()}
                                className="px-4 py-1.5 bg-miro-blue text-white rounded-full text-[12px] font-bold hover:bg-zinc-800 transition-all active:scale-95"
                            >
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-6 py-2 bg-miro-yellow text-miro-blue rounded-full text-[14px] font-bold hover:bg-miro-yellow-deep transition-all shadow-sm active:scale-95"
                        >
                            로그인
                        </Link>
                    )}

                    {/* API 키 설정 버튼 */}
                    <div className="relative">
                        <button
                            onClick={() => { setKeyInput(guestApiKey); setShowKeyPopover(!showKeyPopover) }}
                            className="p-2.5 rounded-full text-miro-blue/40 hover:text-miro-blue hover:bg-zinc-100 transition-all relative"
                            title="API 키 설정"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {hasKey && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
                            )}
                        </button>

                        {showKeyPopover && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-hairline shadow-[0_8px_30px_rgba(5,0,56,0.1)] p-5 z-50">
                                <h4 className="text-[13px] font-bold text-miro-blue mb-1">Gemini API 키</h4>
                                <p className="text-[12px] text-zinc-400 mb-3">
                                    로그인 없이 AI 기능을 사용할 수 있어요.{" "}
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-miro-blue underline">키 발급 →</a>
                                </p>
                                <input
                                    type="password"
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                                    placeholder="AIza..."
                                    className="w-full px-3 py-2 text-[13px] border border-hairline rounded-xl focus:outline-none focus:ring-2 focus:ring-miro-blue/10 font-mono mb-3"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveKey}
                                        className="flex-1 py-2 bg-miro-blue text-white rounded-xl text-[13px] font-bold hover:bg-zinc-800 transition-all"
                                    >
                                        저장
                                    </button>
                                    {guestApiKey && (
                                        <button
                                            onClick={() => { setGuestApiKey(''); setKeyInput(''); setShowKeyPopover(false) }}
                                            className="px-4 py-2 text-[13px] text-red-400 hover:text-red-600 border border-hairline rounded-xl transition-all"
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showKeyPopover && (
                <div className="fixed inset-0 z-40" onClick={() => setShowKeyPopover(false)} />
            )}
        </nav>
    )
}
