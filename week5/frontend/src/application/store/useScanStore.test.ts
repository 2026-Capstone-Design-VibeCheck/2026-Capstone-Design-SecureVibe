import { act, renderHook } from '@testing-library/react'
import { useScanStore } from './useScanStore'

describe('useScanStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useScanStore())
    if (result.current && result.current.reset) {
        act(() => {
        result.current.reset()
        })
    }
  })

  it('initially has no scan results and default code', () => {
    const { result } = renderHook(() => useScanStore())
    expect(result.current.scanResults).toBeNull()
    expect(result.current.codeContent).toBe('')
    expect(result.current.fileName).toBe('test_code.py')
  })

  it('can set report data properly', () => {
    const { result } = renderHook(() => useScanStore())
    
    const testResults = [
      {
        path: 'test_code.py',
        start: { line: 1 },
        extra: {
          severity: 'HIGH',
          message: 'Test vulnerability',
          metadata: { cwe: ['CWE-123'] }
        }
      }
    ]

    act(() => {
      result.current.setReportData(testResults, 'main.js', 'console.log("hello")')
    })

    expect(result.current.scanResults).toEqual(testResults)
    expect(result.current.fileName).toBe('main.js')
    expect(result.current.codeContent).toBe('console.log("hello")')
  })
})
