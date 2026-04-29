'use client'

import { useState } from 'react'
import { executeScan, ScanPayload, VulnerabilityResult } from '../../../application/usecases/ExecuteScanUseCase'

interface Props {
  payload: ScanPayload
}

export default function ScanAction({ payload }: Props) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<VulnerabilityResult[] | null>(null)

  const handleScan = async () => {
    setError(null)
    setResults(null)
    setIsScanning(true)

    try {
      const data = await executeScan(payload)
      setResults(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during scan'
      setError(errorMessage)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full mt-12 mb-16">
      <button
        type="button"
        onClick={handleScan}
        disabled={isScanning}
        className={`px-12 py-4 rounded-full font-bold text-lg tracking-wide transition-all ${
          isScanning
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-obsidian-green text-gray-900 hover:bg-teal-300 hover:shadow-[0_0_15px_rgba(94,234,212,0.6)]'
        }`}
      >
        {isScanning ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Scanning...</span>
          </span>
        ) : (
          'INITIATE SECURITY SCAN'
        )}
      </button>
      {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}

      {results !== null && (
        <div className="w-full max-w-3xl mt-8">
          {results.length === 0 ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold text-center">
              ✅ No vulnerabilities found. Your code looks safe!
            </div>
          ) : (
            <div>
              <h4 className="text-red-600 font-bold text-lg mb-4">
                🚨 {results.length} vulnerability{results.length > 1 ? 's' : ''} found
              </h4>
              <div className="flex flex-col gap-4">
                {results.map((vuln, index) => {
                  const cwe = vuln.extra.metadata.cwe?.[0] ?? 'No CWE'
                  return (
                    <div key={index} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
                      <p className="font-bold text-gray-800">
                        [{index + 1}] Line {vuln.start.line} — Severity: {vuln.extra.severity}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{cwe}</p>
                      <p className="text-sm text-gray-700 mt-2">{vuln.extra.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
