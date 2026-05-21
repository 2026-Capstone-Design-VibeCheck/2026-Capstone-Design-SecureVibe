import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FileDropzone from './FileDropzone'

describe('FileDropzone', () => {
  it('renders correctly and shows drag over feedback', () => {
    const handleFiles = vi.fn()
    const handleError = vi.fn()
    
    render(<FileDropzone onFilesSelected={handleFiles} onError={handleError} />)
    
    const dropzone = screen.getByTestId('file-dropzone')
    expect(dropzone).toBeInTheDocument()
    
    // Simulate drag over
    fireEvent.dragEnter(dropzone)
    expect(dropzone).toHaveClass('border-obsidian-green')
    
    // Simulate drag leave
    fireEvent.dragLeave(dropzone)
    expect(dropzone).not.toHaveClass('border-obsidian-green')
  })

  it('allows dropping valid files', () => {
    const handleFiles = vi.fn()
    const handleError = vi.fn()
    
    render(<FileDropzone onFilesSelected={handleFiles} onError={handleError} />)
    const dropzone = screen.getByTestId('file-dropzone')
    
    const validFile = new File(['code'], 'test.js', { type: 'text/javascript' })
    Object.defineProperty(validFile, 'name', { value: 'test.js' })
    
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [validFile] }
    })
    
    expect(handleFiles).toHaveBeenCalledWith([validFile])
    expect(handleError).not.toHaveBeenCalled()
  })

  it('rejects invalid files', () => {
    const handleFiles = vi.fn()
    const handleError = vi.fn()
    
    render(<FileDropzone onFilesSelected={handleFiles} onError={handleError} />)
    const dropzone = screen.getByTestId('file-dropzone')
    
    const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(invalidFile, 'name', { value: 'test.txt' })
    
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [invalidFile] }
    })
    
    expect(handleFiles).not.toHaveBeenCalled()
    expect(handleError).toHaveBeenCalledWith(expect.stringContaining('Unsupported file type'))
  })
})
