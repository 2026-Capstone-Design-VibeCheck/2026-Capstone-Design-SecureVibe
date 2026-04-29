import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CodeEditorInput from './CodeEditorInput'

describe('CodeEditorInput', () => {
  it('renders a textarea and calls onChange when typing', () => {
    const handleChange = vi.fn()
    render(<CodeEditorInput value="" onChange={handleChange} />)
    
    const textarea = screen.getByPlaceholderText(/Paste your code here/i)
    expect(textarea).toBeInTheDocument()
    
    fireEvent.change(textarea, { target: { value: 'const x = 1;' } })
    expect(handleChange).toHaveBeenCalledWith('const x = 1;')
  })
})
