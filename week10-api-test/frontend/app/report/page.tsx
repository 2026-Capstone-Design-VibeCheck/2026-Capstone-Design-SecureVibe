"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatButton from "@/src/presentation/components/features/ChatButton"; // 👉 챗봇 버튼 불러오기

export default function ReportPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[] | null>(null);
  const [codeContext, setCodeContext] = useState<string>("");
  const [suggestedFix, setSuggestedFix] = useState<string>("");
  const [fixLoading, setFixLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedResults = sessionStorage.getItem("scanResults");
    const savedContext = sessionStorage.getItem("scanContext");
    if (savedResults) {
      setResults(JSON.parse(savedResults));
      setCodeContext(savedContext || "");
    } else {
      router.push("/");
    }
  }, [router]);

  const handleSuggestFix = async (description: string, vulnerableCode: string) => {
    setFixLoading(true);
    setSuggestedFix("");
    try {
      const formData = new FormData();
      formData.append("vulnerability_description", description);
      formData.append("vulnerable_code", vulnerableCode || codeContext);

      const response = await fetch("http://127.0.0.1:8000/suggest-fix", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("수정 코드 제안 실패");
      
      const data = await response.json();
      setSuggestedFix(data.suggested_fix);
      
      // 👉 핵심: AI가 새로 제안한 코드를 챗봇이 읽을 수 있게 세션에 저장!
      sessionStorage.setItem("latestAiFix", data.suggested_fix);
      
    } catch (error: any) {
      alert(`AI 오류: ${error.message}`);
    } finally {
      setFixLoading(false);
    }
  };

  if (!results) return <div className="p-20 text-center text-xl">결과를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Arial,Helvetica,sans-serif]">
      {/* ... (기존 header 영역 유지) ... */}
      <header className="bg-white border-b p-6 flex justify-between items-center shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900">Security Analysis Report</h1>
        <button 
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300"
        >
          새로운 스캔하기
        </button>
      </header>

      {/* ... (기존 main 내용 동일하게 유지) ... */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4">
            {results.length === 0 
              ? <span className="text-green-600">✅ 취약점이 발견되지 않았습니다.</span>
              : <span className="text-red-600">🚨 총 {results.length}개의 보안 위협 발견</span>
            }
          </h2>

          <div className="space-y-6">
            {results.map((vuln, index) => (
              <div key={index} className="border border-red-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-200 font-bold text-red-900 flex justify-between">
                  <span>Issue #{index + 1} | Line: {vuln.start?.line}</span>
                  <span className="bg-red-200 px-2 py-1 rounded text-xs">{vuln.extra?.severity}</span>
                </div>
                <div className="p-5 bg-white space-y-4">
                  <p className="font-medium text-gray-800">{vuln.extra?.message}</p>
                  
                  {vuln.extra?.lines && (
                    <pre className="bg-gray-100 p-3 rounded text-sm text-gray-700 overflow-x-auto border">
                      <code>{vuln.extra.lines}</code>
                    </pre>
                  )}

                  <button
                    onClick={() => handleSuggestFix(vuln.extra?.message, vuln.extra?.lines)}
                    disabled={fixLoading}
                    className="mt-2 px-5 py-2 bg-[#0f172a] text-white rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50"
                  >
                    {fixLoading ? "AI가 코드 작성 중..." : "✨ AI 해결책 보기"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {suggestedFix && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-4 border-green-400 p-6 shadow-2xl z-40">
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-400">✨ AI 컨설턴트 제안 코드</h3>
                <button onClick={() => setSuggestedFix("")} className="text-white hover:text-red-400 font-bold">
                  닫기 ✕
                </button>
              </div>
              <pre className="text-gray-300 font-mono text-sm max-h-60 overflow-y-auto">
                <code>{suggestedFix}</code>
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* 👉 화면 우측 상단에 챗봇 버튼 추가 */}
      <ChatButton />
    </div>
  );
}
