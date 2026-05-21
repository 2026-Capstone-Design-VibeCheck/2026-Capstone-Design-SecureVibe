import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NotificationDropdown from './NotificationDropdown'

describe('NotificationDropdown', () => {
  it('renders a bell icon that toggles the dropdown on click', () => {
    render(<NotificationDropdown />)
    
    // Initially dropdown content should not be visible
    expect(screen.queryByText('System Notification')).not.toBeInTheDocument()
    
    // Click the bell
    const button = screen.getByRole('button', { name: /notifications/i })
    fireEvent.click(button)
    
    // Dropdown content should now be visible
    expect(screen.getByText('System Notification')).toBeInTheDocument()
    
    // Click the bell again
    fireEvent.click(button)
    
    // Dropdown content should be hidden again
    expect(screen.queryByText('System Notification')).not.toBeInTheDocument()
  })
})
