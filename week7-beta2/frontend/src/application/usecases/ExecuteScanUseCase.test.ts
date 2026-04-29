import { describe, it, expect } from 'vitest'
import { executeScan, ScanPayload } from './ExecuteScanUseCase'

describe('ExecuteScanUseCase', () => {
  it('throws an error if no files and no code is provided', async () => {
    const payload: ScanPayload = { mode: 'UPLOAD_FILES', files: [], code: '' }
    await expect(executeScan(payload)).rejects.toThrow('No content provided for scanning')
    
    const payloadCode: ScanPayload = { mode: 'DIRECT_CODE', files: [], code: '' }
    await expect(executeScan(payloadCode)).rejects.toThrow('No content provided for scanning')
  })

  it('returns a success and mock job ID when valid files are provided', async () => {
    const validFile = new File([''], 'test.js', { type: 'text/javascript' })
    const payload: ScanPayload = { mode: 'UPLOAD_FILES', files: [validFile], code: '' }
    
    const result = await executeScan(payload)
    expect(result.success).toBe(true)
    expect(result.jobId).toBeDefined()
    expect(result.message).toContain('Scan initiated')
  })

  it('returns a success and mock job ID when valid code is provided', async () => {
    const payload: ScanPayload = { mode: 'DIRECT_CODE', files: [], code: 'const x = 1;' }
    
    const result = await executeScan(payload)
    expect(result.success).toBe(true)
    expect(result.jobId).toBeDefined()
    expect(result.message).toContain('Scan initiated')
  })
})
