import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { VulnerabilityResult } from '../usecases/ExecuteScanUseCase'

interface ScanStoreState {
  scanResults: VulnerabilityResult[] | null
  fileName: string
  codeContent: string
  setReportData: (results: VulnerabilityResult[], fileName: string, codeContent: string) => void
  reset: () => void
}

export const useScanStore = create<ScanStoreState>()(
  persist(
    (set) => ({
      scanResults: null,
      fileName: 'test_code.py',
      codeContent: '',
      setReportData: (results, fileName, codeContent) => set({ 
        scanResults: results, 
        fileName, 
        codeContent 
      }),
      reset: () => set({ scanResults: null, fileName: 'test_code.py', codeContent: '' })
    }),
    {
      name: 'scan-store',
    }
  )
)
