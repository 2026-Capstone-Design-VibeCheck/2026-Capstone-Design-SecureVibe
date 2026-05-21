"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialContext, setInitialContext] = useState<string>(""); // 👉 배경지식을 담을 상태
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 👉 페이지 로딩 시, 기존 스캔 결과와 수정안을 불러와서 컨텍스트(배경지식)로 조립
  useEffect(() => {
    const savedResults = sessionStorage.getItem("scanResults");
    const savedAiFix = sessionStorage.getItem("latestAiFix"); // 리포트에서 생성한 AI 제안 코드
    
    let contextStr = "Here is the context of the user's current situation:\n";
    if (savedResults) {
      const parsed = JSON.parse(savedResults);
      if (parsed.length > 0) {
        contextStr += `- The code has ${parsed.length} vulnerabilities.\n`;
        contextStr += `- Example vulnerability: ${parsed[0].extra?.message}\n`;
      } else {
        contextStr += `- The code is currently safe with 0 vulnerabilities.\n`;
      }
    }
    if (savedAiFix) {
      contextStr += `- The AI recently suggested this fix code for the vulnerability:\n${savedAiFix}\n`;
    }
    
    setInitialContext(contextStr);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 👉 사용자가 채팅을 보낼 때, 첫 번째 메시지라면 백그라운드 지식을 system 권한으로 몰래 끼워넣습니다.
      const payloadMessages = [...messages, userMessage];
      if (messages.length === 0 && initialContext) {
        payloadMessages.unshift({ role: "system", content: initialContext });
      }

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          model: "openai/gpt-3.5-turbo",
        }),
      });

      if (!response.ok) throw new Error("네트워크 에러");
      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "통신 오류 발생." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... (기존 UI 리턴 코드와 100% 동일하므로 그대로 두시면 됩니다!) ...
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-[Arial,Helvetica,sans-serif]">
      {/* 헤더 */}
      <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">SecureVibe AI 컨설턴트</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-semibold"
        >
          뒤로 가기
        </button>
      </header>

      {/* 채팅 내역 영역 */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-xl font-bold text-gray-400 mb-2">무엇을 도와드릴까요?</p>
              <p className="text-sm">현재 페이지의 취약점과 수정 코드에 대해 무엇이든 질문해 보세요!</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#0f172a] text-white rounded-br-none"
                    : "bg-white border border-gray-200 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-4 bg-white border border-gray-200 rounded-2xl rounded-bl-none shadow-sm">
                <span className="animate-pulse text-blue-600 font-bold">AI가 분석 중입니다...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 입력 영역 */}
      <footer className="p-4 bg-white border-t">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="취약점이나 코드에 대해 질문해 보세요..."
              className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
