"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => router.push("/chat")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // 👉 bottom 대신 top: '100px'을 주어 내비게이션 바 바로 아래 우측 상단에 띄움
      style={{ position: 'fixed', top: '100px', right: '40px', zIndex: 99999 }}
      className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300"
      aria-label="보안 AI 챗봇 열기"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <span className={`font-bold transition-all duration-300 ${isHovered ? "ml-2 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}>
        AI 컨설턴트
      </span>
    </button>
  );
}
