"use client"

import { useScanStore } from "@/store/scanStore"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getVulnerabilityInfo } from "@/lib/constants/severityMapping"


export default function ReportPage() {
    const results = useScanStore((state) => state.results)
    const setSelectedResult = useScanStore((state) => state.setSelectedResult)
    const [activeFilter, setActiveFilter] = useState("전체")

    const router = useRouter()
    const critical = results.filter(r => r.extra.severity === "ERROR")
    const high = results.filter(r => r.extra.severity === "WARNING")
    const medium = results.filter(r => r.extra.severity === "INFO")

    const filteredResults = results.filter(r => {
        if (activeFilter === "전체") return true;
        if (activeFilter === "Critical") return r.extra.severity === "ERROR";
        if (activeFilter === "High") return r.extra.severity === "WARNING";
        if (activeFilter === "Medium") return r.extra.severity === "INFO";
        return true;
    })

    useEffect(() => {
        if (results.length === 0) {
            router.push("/")
        }
    }, [results, router])

    return (
        <div className="min-h-screen bg-zinc-50/50 flex flex-col font-sans">
            <div className="max-w-[1440px] mx-auto w-full px-8 py-12 flex-1">
                <header className="mb-12">
                    <h1 className="text-[32px] font-semibold text-miro-blue tracking-tight">보안 스캔 결과</h1>
                    <p className="text-slate text-[15px]">분석된 코드에서 발견된 잠재적 보안 취약점 목록입니다.</p>
                </header>

                {/* 사이드바 + 메인 레이아웃 */}
                <div className="flex gap-10 items-start">

                    {/* 왼쪽 사이드바: 필터 및 요약 */}
                    <aside className="w-[260px] sticky top-24 space-y-6 animate-fade-in">
                        {/* 보안 상태 요약 - 강렬한 디자인 */}
                        <div style={{
                            backgroundColor: critical.length > 0 ? '#DC2626' :
                                high.length > 0 ? 'var(--miro-yellow)' :
                                    'var(--miro-teal)',
                        }} className="rounded-[28px] p-7 shadow-xl">
                            <div className={`text-[12px] font-extrabold uppercase tracking-[0.2em] mb-2 ${critical.length > 0 || (results.length > 0 && high.length === 0) ? 'text-white/70' : 'text-miro-blue/50'
                                }`}>
                                {critical.length > 0 ? 'Caution' : high.length > 0 ? 'Warning' : 'Safe'}
                            </div>
                            <div className="text-[24px] font-black flex items-center gap-2 tracking-tight">
                                {critical.length > 0 ? '🚫 배포 금지' : high.length > 0 ? '⚠️ 주의 필요' : '✅ 안전'}
                            </div>
                            {critical.length > 0 && (
                                <div className="mt-3 text-[13px] font-medium text-white/90 leading-tight">
                                    심각한 취약점이 발견되었습니다. 즉시 수정이 필요합니다.
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-[24px] border border-hairline p-6 shadow-sm">
                            <h3 className="text-[13px] font-bold uppercase tracking-wider text-miro-blue/40 mb-6">심각도 필터</h3>
                            <ul className="space-y-2">
                                {[
                                    { label: "전체", count: results.length, color: "bg-miro-blue text-white" },
                                    { label: "Critical", count: critical.length, color: "bg-miro-coral-light text-miro-coral-dark" },
                                    { label: "High", count: high.length, color: "bg-miro-yellow-light text-miro-yellow-dark" },
                                    { label: "Medium", count: medium.length, color: "bg-miro-teal-light text-miro-teal-dark" }
                                ].map((item, i) => (
                                    <li
                                        key={i}
                                        className="group cursor-pointer"
                                        onClick={() => setActiveFilter(item.label)}
                                    >
                                        <div className={`flex items-center justify-between p-3 rounded-xl transition-all hover:bg-zinc-50 ${activeFilter === item.label ? 'bg-zinc-50 font-semibold ring-1 ring-zinc-200' : ''}`}>
                                            <span className="text-[15px] text-miro-blue">{item.label}</span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>
                                                {item.count}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-miro-yellow-light/50 rounded-[24px] border border-miro-yellow/10 p-6">
                            <h4 className="text-[15px] font-semibold mb-2">보안 팁</h4>
                            <p className="text-[13px] text-miro-yellow-dark/80 leading-relaxed">
                                발견된 취약점은 CWE 표준에 따라 분류되었습니다. 상세 정보를 클릭하여 해결 방법을 확인하세요.
                            </p>
                        </div>
                    </aside>

                    {/* 오른쪽 메인: 이슈 카드 리스트 */}
                    <main className="flex-1 space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        {filteredResults.length > 0 ? (
                            filteredResults.map((result, index) => {
                                const isCritical = result.extra.severity === "ERROR";
                                const isHigh = result.extra.severity === "WARNING";

                                // CWE 코드 추출 및 한국어 정보 매핑
                                const cweRaw = result.extra.metadata.cwe?.[0] ?? ""
                                const cweCode = cweRaw.split(":")[0].trim()
                                const vulnInfo = getVulnerabilityInfo(cweCode)

                                // 원본 results 배열에서의 인덱스를 찾아 상세 페이지 이동에 사용
                                const originalIndex = results.findIndex(r => r === result);

                        return (
                        <div
                            key={index}
                            className="block cursor-pointer"
                            onClick={() => {
                                setSelectedResult(result)
                                router.push(`/report/${originalIndex}`)
                            }}
                        >
                            <div className="bg-white rounded-[24px] border border-hairline p-6 transition-all hover:border-miro-blue/20 hover:shadow-[0_8px_20px_-4px_rgba(5,0,56,0.06)] hover:translate-y-[-2px] group">
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isCritical ? 'bg-miro-coral-light text-miro-coral-dark' :
                                                isHigh ? 'bg-miro-yellow-light text-miro-yellow-dark' :
                                                    'bg-miro-teal-light text-miro-teal-dark'
                                                }`}>
                                                {result.extra.severity === "ERROR" ? "Critical" : result.extra.severity === "WARNING" ? "High" : "Medium"}
                                            </span>
                                            <span className="text-[13px] font-medium text-slate">
                                                {vulnInfo.title}
                                            </span>
                                        </div>
                                        <h3 className="text-[19px] font-semibold text-miro-blue mb-2 leading-snug group-hover:text-zinc-700 transition-colors">
                                            {vulnInfo.description.length > 60
                                                ? vulnInfo.description.slice(0, 60) + "..."
                                                : vulnInfo.description}
                                        </h3>
                                        <div className="flex items-center gap-4 text-[13px] text-slate opacity-60">
                                            <span className="flex items-center gap-1.5 font-mono">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {result.path}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16" />
                                                </svg>
                                                L{result.start.line}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-miro-blue opacity-0 group-hover:opacity-100 transition-all">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                            })
                        ) : (
                        <div className="bg-white rounded-[32px] border border-hairline border-dashed py-24 text-center">
                            <p className="text-slate mb-2">해당 심각도의 분석 결과가 없습니다.</p>
                            <button
                                onClick={() => setActiveFilter("전체")}
                                className="text-miro-blue font-semibold hover:underline"
                            >
                                전체 목록 보기
                            </button>
                        </div>
                        )}
                    </main>

                </div>
            </div>
        </div>
    )
}