"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { sendMessage } from "@/services/chat"

interface Message {
    role: "user" | "ai"
    content: string
}

interface ChatBotProps {
    context: string  // 취약점 정보 넘겨받기
}

export default function ChatBot({ context }: ChatBotProps) {
    const user = useAuthStore((state) => state.user)
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSend = async () => {
        if (!input.trim() || !user?.key) return

        const userMessage = input
        setInput("")
        setMessages((prev) => [...prev, { role: "user", content: userMessage }])

        setIsLoading(true)
        const res = await sendMessage(userMessage, user.key, context)
        setIsLoading(false)

        setMessages((prev) => [...prev, { role: "ai", content: res.data.message }])
    }

    return (
        <>
            {/* 플로팅 버튼 - Miro Pill Style */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-10 right-10 bg-miro-blue text-white rounded-full shadow-[0_8px_30px_rgb(5,0,56,0.15)] flex items-center gap-3 px-6 py-4 hover:scale-105 hover:bg-zinc-800 transition-all z-[100] active:scale-95 group"
            >
                <div className="w-6 h-6 bg-miro-yellow rounded-lg flex items-center justify-center text-miro-blue group-hover:rotate-12 transition-transform">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <span className="text-[15px] font-bold tracking-tight">AI 어시스턴트</span>
            </button>

            {/* 챗봇 창 - Miro Modal Style */}
            {isOpen && (
                <div className="fixed bottom-28 right-10 w-[360px] h-[520px] bg-white rounded-[24px] shadow-[0_16px_48px_-8px_rgba(5,0,56,0.12)] border border-hairline flex flex-col z-[100] animate-fade-in overflow-hidden">
                    {/* 헤더 - Yellow Light Background */}
                    <div className="p-5 bg-miro-yellow-light border-b border-hairline flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-miro-blue rounded-full flex items-center justify-center text-white">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                                    <path d="M12 6a1 1 0 1 0 1 1 1 1 0 0 0-1-1zm0 4v6" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-miro-blue text-[15px] leading-none mb-1">보안 AI 가이드</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-miro-teal rounded-full animate-pulse" />
                                    <span className="text-[11px] text-miro-blue/40 font-bold uppercase tracking-wider">Online Now</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-miro-blue/30 hover:text-miro-blue p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l18 18" />
                            </svg>
                        </button>
                    </div>

                    {/* 메시지 목록 */}
                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-zinc-50/30">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                    <span className="text-2xl">✨</span>
                                </div>
                                <p className="text-[14px] text-miro-blue/60 font-medium leading-relaxed">
                                    발견된 보안 취약점에 대해<br />무엇이든 물어보세요!
                                </p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed ${msg.role === "user"
                                    ? "bg-miro-blue text-white rounded-[18px] rounded-tr-none shadow-sm"
                                    : "bg-white text-miro-blue rounded-[18px] rounded-tl-none border border-hairline shadow-sm"
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-hairline px-4 py-3 rounded-[18px] rounded-tl-none flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-miro-blue/20 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-miro-blue/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-miro-blue/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 입력창 - Search Pill Style */}
                    <div className="p-5 border-t border-hairline bg-white">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="질문을 입력하세요..."
                                className="w-full pl-4 pr-12 py-3 bg-zinc-100 rounded-xl text-[14px] text-miro-blue focus:outline-none focus:ring-2 focus:ring-miro-blue/5 border-transparent focus:bg-white transition-all placeholder:text-miro-blue/20"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1.5 p-2 bg-miro-blue text-white rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-20 active:scale-90"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}