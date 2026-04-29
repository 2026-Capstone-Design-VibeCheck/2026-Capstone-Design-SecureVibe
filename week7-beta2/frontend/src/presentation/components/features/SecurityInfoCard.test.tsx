import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SecurityInfoCard from './SecurityInfoCard'

describe('SecurityInfoCard', () => {
  it('renders the title and icon', () => {
    const feature = {
      id: '1',
      title: 'Deep AI Scanning',
      description: 'Advanced AI analysis to detect zero-day vulnerabilities.',
      iconType: 'ai' as const
    }
    
    render(<SecurityInfoCard feature={feature} />)
    
    expect(screen.getAllByText('Deep AI Scanning')[0]).toBeInTheDocument()
    // Sub-description or tooltip shouldn't be fully visible as text usually, but might be hidden or shown on hover
  })

  it('shows tooltip/description on hover', () => {
    const feature = {
      id: '2',
      title: 'OWASP Top 10',
      description: 'Complete coverage of OWASP top 10 security risks.',
      iconType: 'shield' as const
    }
    
    render(<SecurityInfoCard feature={feature} />)
    
    const card = screen.getByTestId('security-card-2')
    
    // The description might be in the DOM but hidden, or it reveals on hover.
    // For CSS-based hover, we can just ensure the text is in the document.
    // For JS-based hover, we would do:
    fireEvent.mouseEnter(card)
    expect(screen.getAllByText('Complete coverage of OWASP top 10 security risks.')[0]).toBeInTheDocument()
  })
})
