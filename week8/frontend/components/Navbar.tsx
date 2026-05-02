"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/authStore"

export default function Navbar() {
    const user = useAuthStore((state) => state.user)
    const clearUser = useAuthStore((state) => state.clearUser)

    return (
        <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-hairline">
            <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    {/* Left: Logo */}
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

                    {/* Left: Main Links (Moved from center) */}
                    <div className="flex items-center gap-6 text-[15px] font-medium text-miro-blue/60">
                        <Link href="/" className="hover:text-miro-blue transition-colors">Scan</Link>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <Link href="/report" className="hover:text-miro-blue transition-colors">Report</Link>
                    </div>
                </div>

                {/* Right: Actions */}
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

                    <button className="p-2.5 rounded-full text-miro-blue/40 hover:text-miro-blue hover:bg-zinc-100 transition-all" title="설정">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    )
}