'use client'

import { useState } from 'react'
import NavBar from '@/src/presentation/components/layout/NavBar'
import ScanInputSelector from '@/src/presentation/components/features/ScanInputSelector'
import FileDropzone from '@/src/presentation/components/features/FileDropzone'
import CodeEditorInput from '@/src/presentation/components/features/CodeEditorInput'
import ScanAction from '@/src/presentation/components/features/ScanAction'
import SecurityInfoCard from '@/src/presentation/components/features/SecurityInfoCard'
import { ScanMode } from '@/src/domain/entities/ScanType'
import { SecurityFeature } from '@/src/domain/entities/SecurityFeature'

const SECURITY_FEATURES: SecurityFeature[] = [
  {
    id: 'ai-scan',
    title: 'Deep AI Scanning',
    description: 'Advanced AI analysis to detect zero-day vulnerabilities and complex logic flaws that traditional scanners miss.',
    iconType: 'ai'
  },
  {
    id: 'owasp',
    title: 'OWASP Top 10',
    description: 'Complete coverage of OWASP top 10 security risks including Injection, Broken Authentication, and XSS.',
    iconType: 'shield'
  },
  {
    id: 'zk',
    title: 'Zero-Knowledge',
    description: 'Your code never leaves your browser. All static analysis is performed locally for ultimate privacy.',
    iconType: 'lock'
  }
]

export default function Home() {
  const [scanMode, setScanMode] = useState<ScanMode>('UPLOAD_FILES')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [codeContent, setCodeContent] = useState('')
  const [language, setLanguage] = useState('.py')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFilesSelected = (files: File[]) => {
    setErrorMsg(null)
    setSelectedFiles(files)
  }

  const handleError = (msg: string) => {
    setErrorMsg(msg)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Arial,Helvetica,sans-serif]">
      <NavBar />
      
      <main className="flex-1 flex flex-col pt-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Secure your code with continuous <br /> <span className="text-obsidian-green">Intelligent Analysis</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Drag and drop your project files or paste snippets instantly. Detect vulnerabilities before they hit production.
          </p>
        </div>

        {/* Input area */}
        <div className="max-w-3xl mx-auto w-full mb-8 relative z-10">
          <ScanInputSelector currentMode={scanMode} onChange={setScanMode} />
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            {scanMode === 'UPLOAD_FILES' ? (
              <FileDropzone onFilesSelected={handleFilesSelected} onError={handleError} />
            ) : (
              <>
                <CodeEditorInput value={codeContent} onChange={(val) => {
                  setErrorMsg(null)
                  setCodeContent(val)
                }} />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-2 ml-2 p-1 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                >
                  <option value=".py">Python</option>
                  <option value=".js">JavaScript</option>
                  <option value=".java">Java</option>
                  <option value=".c">C/C++</option>
                </select>
              </>
            )}
            {errorMsg && <p className="text-red-500 mt-2 text-sm text-center font-medium">{errorMsg}</p>}
            {scanMode === 'UPLOAD_FILES' && selectedFiles.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {selectedFiles.map(f => (
                  <span key={f.name} className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-medium border border-teal-200">
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ScanAction payload={{ mode: scanMode, files: selectedFiles, code: codeContent, language }} />
        
        {/* Responsive Grid for Security Info Cards */}
        {/* Mobile: 1 col, Tablet: 3 col. They stack on small screens! */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-auto pb-16">
          {SECURITY_FEATURES.map(feature => (
            <SecurityInfoCard key={feature.id} feature={feature} />
          ))}
        </div>
        
      </main>
    </div>
  )
}
