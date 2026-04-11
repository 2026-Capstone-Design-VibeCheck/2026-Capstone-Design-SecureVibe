'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationDropdown from '../features/NotificationDropdown'
import UserProfileDropdown from '../features/UserProfileDropdown'

export default function NavBar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Scan', href: '/' },
    { name: 'Reports', href: '/report' },
    { name: 'Settings', href: '/settings' },
  ]

  return (
    <nav className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-xl font-bold text-obsidian-green">
          SecureVibe
        </Link>
        <div className="flex space-x-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'underline decoration-obsidian-green text-black font-medium'
                    : 'text-gray-600 hover:text-black'
                } transition-colors`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationDropdown />
        <UserProfileDropdown />
      </div>
    </nav>
  )
}

