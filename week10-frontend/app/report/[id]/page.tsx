"use client"

import { useScanStore } from "@/store/scanStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { getVulnerabilityInfo } from "@/lib/constants/severityMapping"
import ChatBot from "@/components/ChatBot"

export default function IssueDetailPage() {
    const router = useRouter()
    const selectedResult = useScanStore((state) => state.selectedResult)

    useEffect(() => {
        if (!selectedResult) {
            router.push("/report")
        }
    }, [selectedResult, router])

    if (!selectedResult) {
        return null
    }

    // CWE 코드 추출 (예: "CWE-89: ..." → "CWE-89")
    const cweRaw = selectedResult.extra.metadata.cwe?.[0] ?? ""
    const cweCode = cweRaw.split(":")[0].trim()
    const vulnInfo = getVulnerabilityInfo(cweCode)

    return (
        <div className="min-h-screen bg-zinc-50/50 flex flex-col font-sans">
            <div className="max-w-[1440px] mx-auto w-full px-8 py-12 flex-1">

                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                    {/* 돌아가기 링크 */}
                    <Link
                        href="/report"
                        className="inline-flex items-center gap-2 text-[15px] font-semibold text-miro-blue/60 hover:text-miro-blue transition-colors group"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        취약점 리스트로 돌아가기
                    </Link>

                    {/* 헤더 카드 - 전체 너비 */}
                    <section className="bg-white rounded-[32px] border border-hairline p-10 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${vulnInfo.severity === 'critical' ? 'bg-miro-coral-light text-miro-coral-dark' :
                                        vulnInfo.severity === 'high' ? 'bg-miro-yellow-light text-miro-yellow-dark' :
                                            'bg-miro-teal-light text-miro-teal-dark'
                                        }`}>
                                        {vulnInfo.severity.toUpperCase()}
                                    </span>
                                </div>
                                <h1 className="text-[32px] md:text-[42px] font-bold text-miro-blue leading-tight tracking-tight">
                                    {vulnInfo.title}
                                </h1>
                                <div className="flex items-center gap-4 text-[15px] text-slate opacity-60">
                                    <span className="flex items-center gap-1.5 font-mono">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {selectedResult.path}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16" />
                                        </svg>
                                        Line {selectedResult.start.line}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[220px]">
                                <div className="bg-zinc-50 rounded-2xl p-4 border border-hairline flex items-center gap-4">
                                    <span className="text-[12px] font-bold text-slate/40 uppercase w-14">CWE</span>
                                    <div className="w-[1px] h-4 bg-zinc-200" />
                                    <span className="text-[15px] font-bold text-miro-blue font-mono">{cweCode}</span>
                                </div>
                                <div className="bg-zinc-50 rounded-2xl p-4 border border-hairline flex items-center gap-4">
                                    <span className="text-[12px] font-bold text-slate/40 uppercase w-14">OWASP</span>
                                    <div className="w-[1px] h-4 bg-zinc-200" />
                                    <span className="text-[15px] font-bold text-miro-blue font-mono">{vulnInfo.owasp}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/2 rounded-full ${vulnInfo.severity === 'critical' ? 'bg-miro-coral' :
                            vulnInfo.severity === 'high' ? 'bg-miro-yellow' :
                                'bg-miro-teal'
                            }`} />
                    </section>

                    {/* 본문 영역 */}
                    <div className="space-y-12 pb-20">
                        {/* 1. 위험 요소 (The Risk) */}
                        <section>
                            <h2 className="text-[24px] font-semibold text-miro-blue mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-miro-yellow flex items-center justify-center text-[16px]">1</span>
                                위험 요소 — 한눈에 보기
                            </h2>
                            <div className="bg-white rounded-[28px] border border-hairline p-8 leading-relaxed text-[17px] text-zinc-700 shadow-sm">
                                {vulnInfo.risk ?? vulnInfo.description}
                            </div>
                        </section>

                        {/* 2. 해결 방법 (How to Fix) */}
                        <section>
                            <h2 className="text-[24px] font-semibold text-miro-blue mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-miro-teal-light flex items-center justify-center text-[16px]">2</span>
                                해결 방법 가이드
                            </h2>
                            <div className="bg-white rounded-[28px] border border-hairline p-8 shadow-sm space-y-8">
                                <div className="space-y-4">
                                    {vulnInfo.howToFix ? (
                                        <ul className="space-y-4">
                                            {vulnInfo.howToFix.map((fix, i) => (
                                                <li key={i} className="flex gap-4 items-start text-[16px] text-zinc-700">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-miro-blue shrink-0" />
                                                    {fix}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-slate italic">수정 방법 정보가 없습니다.</p>
                                    )}
                                </div>

                                {/* 참고 자료 - 섹션 내부 회색 박스 */}
                                <div className="bg-zinc-50 rounded-2xl p-6 border border-hairline">
                                    <h4 className="text-[14px] font-bold text-miro-blue/40 uppercase tracking-widest mb-4">참고 자료</h4>
                                    <div className="space-y-3">
                                        {selectedResult.extra.metadata.references && selectedResult.extra.metadata.references.length > 0 ? (
                                            selectedResult.extra.metadata.references.map((ref, i) => (
                                                <a
                                                    key={i}
                                                    href={ref}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[14px] text-miro-blue hover:underline break-all group"
                                                >
                                                    <svg className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    {ref}
                                                </a>
                                            ))
                                        ) : (
                                            <p className="text-[13px] text-slate italic">관련 링크가 없습니다.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. 코드 비교 (Before / After) */}
                        {vulnInfo.beforeCode && vulnInfo.afterCode && (
                            <section>
                                <h2 className="text-[24px] font-semibold text-miro-blue mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-miro-coral-light flex items-center justify-center text-[16px]">3</span>
                                    코드 변경 제안 (Before / After)
                                </h2>
                                <div className="flex flex-col gap-6">
                                    <div className="bg-[#FFF5F5] rounded-[24px] border border-[#FFDADA] overflow-hidden shadow-sm">
                                        <div className="px-6 py-3 border-b border-[#FFDADA] bg-[#FFE8E8] text-[13px] font-bold text-[#E53E3E] uppercase tracking-wider flex items-center justify-between">
                                            <span>Vulnerable Code</span>
                                            <span className="text-[11px] opacity-50 font-mono">BEFORE</span>
                                        </div>
                                        <pre className="p-6 overflow-x-auto text-[14px] font-mono leading-relaxed text-zinc-800">
                                            {vulnInfo.beforeCode}
                                        </pre>
                                    </div>
                                    <div className="bg-[#F0FFF4] rounded-[24px] border border-[#C6F6D5] overflow-hidden shadow-sm">
                                        <div className="px-6 py-3 border-b border-[#C6F6D5] bg-[#E6FFFA] text-[13px] font-bold text-[#38A169] uppercase tracking-wider flex items-center justify-between">
                                            <span>Secure Fix</span>
                                            <span className="text-[11px] opacity-50 font-mono">AFTER</span>
                                        </div>
                                        <pre className="p-6 overflow-x-auto text-[14px] font-mono leading-relaxed text-zinc-800">
                                            {vulnInfo.afterCode}
                                        </pre>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
            <ChatBot context={`${vulnInfo.title}: ${vulnInfo.description}`} />
        </div>

    )
}