'use client'

/**
 * [알림창 버튼]
 * 클릭하면 최근에 발생한 시스템 알림이나 보안 분석 결과를 
 * 작은 창으로 요약해서 보여주는 기능을 합니다.
 */


import { useState } from 'react'
import { Bell } from 'lucide-react'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button 
        aria-label="notifications" 
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">System Notification</h3>
            <p className="text-sm text-gray-600 mt-1">No new vulnerabilities detected.</p>
          </div>
        </div>
      )}
    </div>
  )
}
