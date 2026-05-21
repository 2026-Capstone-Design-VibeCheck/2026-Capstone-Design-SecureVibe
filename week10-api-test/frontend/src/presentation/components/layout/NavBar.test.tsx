import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NavBar from './NavBar'

describe('NavBar', () => {
  it('renders standard navigation links', () => {
    render(<NavBar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Scan')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('highlights the Scan tab as active initially', () => {
    render(<NavBar />)
    const scanLink = screen.getByText('Scan')
    // As per requirement: "현재 Scan이 활성화된 스타일(Underline)을 유지해야 함"
    expect(scanLink).toHaveClass('underline')
    expect(scanLink).toHaveClass('decoration-obsidian-green')
  })

  it('renders the notification bell and user profile icons', () => {
    render(<NavBar />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /user profile/i })).toBeInTheDocument()
  })
})
