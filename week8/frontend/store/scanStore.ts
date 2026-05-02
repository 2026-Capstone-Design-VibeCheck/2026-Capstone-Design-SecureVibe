import { create } from 'zustand'

interface ScanResult {
    check_id: string
    path: string
    start: {
        line: number
        col: number
    }
    end: {
        line: number
        col: number
    }
    extra: {
        message: string
        severity: string
        metadata: {
            cwe: string[]
            owasp: string[]
            vulnerability_class: string[]
            likelihood: string
            impact: string
            confidence: string
            references: string[]
        }
        lines: string
        fingerprint: string
    }
}

interface ScanStore {
    results: ScanResult[]
    setResults: (results: ScanResult[]) => void
    selectedResult: ScanResult | null        // ← 추가
    setSelectedResult: (result: ScanResult) => void  // ← 추가
}

export const useScanStore = create<ScanStore>((set) => ({
    results: [],
    setResults: (results) => set({ results }),
    selectedResult: null,                    // ← 추가
    setSelectedResult: (result) => set({ selectedResult: result }), // ← 추가
}))

/*
check_id      ← 취약점 ID
path          ← 파일 경로
start.line    ← 몇 번째 줄
extra.message ← 취약점 설명
extra.severity ← ERROR / WARNING
extra.metadata.cwe    ← CWE 번호
extra.metadata.owasp  ← OWASP
extra.metadata.vulnerability_class ← SQL Injection 등
extra.metadata.likelihood ← 위험도
extra.metadata.impact    ← 영향도
*/