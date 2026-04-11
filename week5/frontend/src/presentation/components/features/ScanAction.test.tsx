import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ScanAction from './ScanAction'
import * as ScanUseCase from '../../../application/usecases/ExecuteScanUseCase'
import { useScanStore } from '../../../application/store/useScanStore'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))

vi.mock('../../../application/usecases/ExecuteScanUseCase', () => ({
  executeScan: vi.fn(),
}))

describe('ScanAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useScanStore.getState().reset()
  })

  it('shows an error if validation fails', async () => {
    vi.mocked(ScanUseCase.executeScan).mockRejectedValueOnce(new Error('No content provided'))
    
    render(<ScanAction payload={{ mode: 'DIRECT_CODE', files: [], code: '', language: '.py' }} />)
    
    const button = screen.getByRole('button', { name: /initiate security scan/i })
    fireEvent.click(button)
    
    const errorMsg = await screen.findByText('No content provided')
    expect(errorMsg).toBeInTheDocument()
  })

  it('navigates to report page and saves payload on success', async () => {
    const mockResults = [
      {
        path: 'test_code.py',
        start: { line: 1 },
        extra: { severity: 'HIGH', message: 'Test vulnerability', metadata: { cwe: ['CWE-123'] } }
      }
    ]
    vi.mocked(ScanUseCase.executeScan).mockResolvedValueOnce(mockResults)
    
    const payload = { mode: 'DIRECT_CODE' as const, files: [], code: 'test code', language: '.py' }
    render(<ScanAction payload={payload} />)
    
    const button = screen.getByRole('button', { name: /initiate security scan/i })
    fireEvent.click(button)
    
    expect(button).toBeDisabled()
    
    // We expect it to finish loading
    await screen.findByRole('button', { name: /initiate security scan/i })

    expect(mockPush).toHaveBeenCalledWith('/report')
    expect(useScanStore.getState().scanResults).toEqual(mockResults)
    expect(useScanStore.getState().codeContent).toBe('test code')
  })
})
