import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UserProfileDropdown from './UserProfileDropdown'

describe('UserProfileDropdown', () => {
  it('renders a user icon that toggles the dropdown with user info on click', () => {
    render(<UserProfileDropdown />)
    
    // Initially dropdown should not be open
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    
    // Click user profle icon
    const button = screen.getByRole('button', { name: /user profile/i })
    fireEvent.click(button)
    
    // User info and Logout should be visible
    expect(screen.getByText('User Account')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
    
    // Click again to hide
    fireEvent.click(button)
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })
})
