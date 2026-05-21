import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ScanInputSelector from './ScanInputSelector'

describe('ScanInputSelector', () => {
  it('renders both toggle buttons and calls onChange when clicked', () => {
    const handleChange = vi.fn()
    render(<ScanInputSelector currentMode="UPLOAD_FILES" onChange={handleChange} />)
    
    // Check initial render
    const uploadBtn = screen.getByRole('button', { name: /upload files/i })
    const directCodeBtn = screen.getByRole('button', { name: /direct code/i })
    
    expect(uploadBtn).toBeInTheDocument()
    // It should be highlighted/active (e.g. not grayed out)
    expect(uploadBtn).toHaveClass('bg-gray-800', 'text-white')
    expect(directCodeBtn).toHaveClass('text-gray-500')
    
    // Click DIRECT CODE
    fireEvent.click(directCodeBtn)
    expect(handleChange).toHaveBeenCalledWith('DIRECT_CODE')
  })
})
