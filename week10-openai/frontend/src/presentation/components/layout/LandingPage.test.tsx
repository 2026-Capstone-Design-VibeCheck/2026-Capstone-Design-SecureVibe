import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LandingPage from '../../../../app/page'

vi.mock('../../../application/usecases/ExecuteScanUseCase', () => ({
  executeScan: vi.fn(),
}))

describe('LandingPage Integration', () => {
  it('renders all key components', () => {
    // This is an integration test to ensure all components are wired
    render(<LandingPage />)
    
    // NavBar
    expect(screen.getByText('SecureVibe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
    
    // Toggle
    expect(screen.getByRole('button', { name: /upload files/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /direct code/i })).toBeInTheDocument()
    
    // Initial dropzone
    expect(screen.getByTestId('file-dropzone')).toBeInTheDocument()
    
    // Action trigger
    expect(screen.getByRole('button', { name: /initiate security scan/i })).toBeInTheDocument()
    
    // Info cards
    expect(screen.getAllByText('Deep AI Scanning')[0]).toBeInTheDocument()
    expect(screen.getAllByText('OWASP Top 10')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Zero-Knowledge')[0]).toBeInTheDocument()
  })

  it('has accessible buttons', () => {
    render(<LandingPage />)
    
    // All interactive elements should be identifiable by role
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      // Either it has text content or an aria-label
      const hasAriaLabel = btn.getAttribute('aria-label') !== null
      const hasText = btn.textContent !== ''
      expect(hasAriaLabel || hasText).toBe(true)
    })
  })
})
