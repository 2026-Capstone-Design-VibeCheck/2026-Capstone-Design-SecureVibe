'use client'

import { useState, useEffect } from 'react';
import { useScanStore } from '@/src/application/store/useScanStore';
import { 
  Shield, 
  Bell, 
  User, 
  AlertTriangle, 
  Info, 
  FileCode2, 
  Cpu 
} from 'lucide-react';
import NavBar from '@/src/presentation/components/layout/NavBar';

export default function ScanReportPage() {
  const scanResults = useScanStore((state) => state.scanResults);
  const displayCode = useScanStore((state) => state.codeContent);
  const fileName = useScanStore((state) => state.fileName);

  // Fallback to prevent hydrate mismatch on completely empty store 
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedVulns = [...(scanResults || [])].sort((a, b) => {
    const severityMap: Record<string, number> = { CRITICAL: 4, HIGH: 3, ERROR: 3, MEDIUM: 2, WARNING: 2, LOW: 1 };
    const aScore = severityMap[a.extra?.severity?.toUpperCase() || 'LOW'] || 1;
    const bScore = severityMap[b.extra?.severity?.toUpperCase() || 'LOW'] || 1;
    return bScore - aScore;
  });

  const topVulns = sortedVulns.slice(0, 2);
  const otherVulns = sortedVulns.slice(2);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-[Arial,Helvetica,sans-serif] selection:bg-blue-100">
      <NavBar />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-12">
        
        {/* Header */}
        <header className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 ${scanResults && scanResults.length > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'} rounded-full font-bold text-xs tracking-wide border shadow-sm`}>
            <AlertTriangle className="w-4 h-4" />
            <span>{scanResults && scanResults.length > 0 ? 'RISK DETECTED' : 'SCAN SECURE'}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl flex items-center gap-5 font-extrabold tracking-tight text-slate-900">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-500 hidden sm:block">
               <FileCode2 className="w-8 h-8" />
            </div>
            {fileName}
          </h1>
        </header>

        {/* Code Analysis Box */}
        <section className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/40 bg-[#0f172a] animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Editor Header */}
          <div className="flex items-center px-4 py-3 border-b border-white/10 bg-slate-900">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/90 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/90 shadow-sm"></div>
            </div>
            <div className="ml-5 text-sm font-mono text-slate-400 font-medium">{fileName}</div>
          </div>
          
          {/* Editor Body */}
          <div className="p-6 sm:p-8 overflow-x-auto text-sm sm:text-base font-mono leading-relaxed text-slate-300 pointer-events-none select-text">
            {displayCode ? (
              displayCode.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const vuln = scanResults?.find(v => v.start?.line === lineNum);
                
                if (vuln) {
                  return (
                    <div key={idx} className="flex bg-red-500/15 -mx-6 sm:-mx-8 px-6 sm:px-8 py-1.5 border-l-4 border-red-500 mt-1">
                      <div className="w-10 sm:w-12 text-red-500/80 text-right pr-4 shrink-0 font-medium">{lineNum}</div>
                      <div className="flex-1 flex justify-between items-center whitespace-pre text-red-200">
                        <span className="break-all whitespace-pre">{line}</span>
                        <span className="hidden sm:inline-flex items-center ml-4 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 tracking-wider uppercase">
                          {vuln.extra?.severity || 'VULNERABLE'}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex">
                    <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">{lineNum}</div>
                    <div className="whitespace-pre">{line}</div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="flex">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">25</div>
                  <div className="whitespace-pre">def execute_system_command(user_input):</div>
                </div>
                <div className="flex">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">26</div>
                  <div className="whitespace-pre text-slate-500">    # TODO: Validate this input later</div>
                </div>
                <div className="flex">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">27</div>
                  <div className="whitespace-pre">    import os</div>
                </div>
                {/* Vulnerable Line 28 */}
                <div className="flex bg-red-500/15 -mx-6 sm:-mx-8 px-6 sm:px-8 py-1.5 border-l-4 border-red-500 mt-1">
                  <div className="w-10 sm:w-12 text-red-500/80 text-right pr-4 shrink-0 font-medium">28</div>
                  <div className="flex-1 flex justify-between items-center whitespace-pre text-red-200">
                    <span className="break-all whitespace-pre">    os.system(f"ping -c 4 {`{user_input}`}")</span>
                    <span className="hidden sm:inline-flex items-center ml-4 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 tracking-wider">
                      VULNERABLE
                    </span>
                  </div>
                </div>
                <div className="flex mt-1">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">29</div>
                  <div className="whitespace-pre">    return "Command executed"</div>
                </div>
                
                <div className="flex mt-6">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">40</div>
                  <div className="whitespace-pre"><span className="text-blue-400">class</span> DatabaseConnection:</div>
                </div>
                <div className="flex">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">41</div>
                  <div className="whitespace-pre">    def __init__(self):</div>
                </div>
                {/* Vulnerable Line 42 */}
                <div className="flex bg-red-500/15 -mx-6 sm:-mx-8 px-6 sm:px-8 py-1.5 border-l-4 border-red-500 mt-1">
                  <div className="w-10 sm:w-12 text-red-500/80 text-right pr-4 shrink-0 font-medium">42</div>
                  <div className="flex-1 flex justify-between items-center whitespace-pre text-red-200">
                    <span className="break-all whitespace-pre">        self.secret_key = "AKIAIOSFODNN7EXAMPLE"</span>
                    <span className="hidden sm:inline-flex items-center ml-4 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 tracking-wider">
                      VULNERABLE
                    </span>
                  </div>
                </div>
                <div className="flex mt-1">
                  <div className="w-10 sm:w-12 text-slate-600 text-right pr-4 shrink-0">43</div>
                  <div className="whitespace-pre">        self.connect()</div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Detailed Vulnerability Cards */}
        {topVulns.length > 0 && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {topVulns.map((vuln, idx) => {
                const isCritical = ['CRITICAL', 'HIGH', 'ERROR'].includes(vuln.extra?.severity?.toUpperCase() || '');
                const badgeColor = isCritical ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100';
                
                return (
                  <div key={idx} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all duration-300 group">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight line-clamp-3" title={vuln.extra?.metadata?.cwe?.[0]}>
                          {vuln.extra?.metadata?.cwe?.[0] || '취약점'}
                        </h3>
                        <span className={`shrink-0 px-3 py-1 font-bold rounded-full text-xs tracking-widest border uppercase ${badgeColor}`}>
                          {vuln.extra?.severity || 'MEDIUM'}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-8 leading-relaxed">
                        {vuln.extra?.message} ({vuln.start?.line}번째 줄)
                      </p>
                    </div>
                    <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100 relative overflow-hidden group-hover:bg-sky-50/80 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-sky-400 rounded-l-2xl"></div>
                      <div className="flex items-center gap-2.5 mb-2.5 text-sky-800 font-bold text-xs tracking-wider">
                        <Info className="w-4 h-4 text-sky-600" />
                        권장 조치
                      </div>
                      <p className="text-sky-900/80 text-sm leading-relaxed">
                        애플리케이션 보안을 위해 해당 취약점(CWE) 조치를 권장합니다. 안전하지 않은 방식의 함수 호출이나 하드코딩된 비밀키 사용 등을 지양하세요.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lower Grid (Other Vulnerabilities) */}
        {otherVulns.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {otherVulns.map((vuln, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h4 className="font-bold text-slate-900 flex-1 min-w-0 pr-2 truncate" title={vuln.extra?.metadata?.cwe?.[0]}>{vuln.extra?.metadata?.cwe?.[0] || '경고'}</h4>
                  <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 text-[10px] font-bold rounded-full uppercase tracking-widest shrink-0">{vuln.extra?.severity || 'LOW'}</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed truncate">{vuln.extra?.message}</p>
                <div className="mt-2 text-xs font-mono text-slate-400">{vuln.start?.line}번째 줄</div>
              </div>
            ))}
          </section>
        )}

        {/* Footer */}
        <footer className="pt-10 pb-8 mt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4" />
              <span>Python Script (.py)</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>{displayCode ? displayCode.split('\n').length : 248} lines analyzed</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Sentinel Engine v2.4.1</span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
