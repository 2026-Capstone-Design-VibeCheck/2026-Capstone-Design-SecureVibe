'use client'

import { useState } from 'react'
import { User } from 'lucide-react'

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button 
        aria-label="user profile" 
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
          <div className="p-4 border-b">
            <p className="font-semibold text-gray-800">User Account</p>
            <p className="text-xs text-gray-500">security-admin@vibe.com</p>
          </div>
          <button className="w-full text-left p-4 text-red-600 hover:bg-red-50 transition-colors">
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
