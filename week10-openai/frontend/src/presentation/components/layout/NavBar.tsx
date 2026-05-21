import NotificationDropdown from '../features/NotificationDropdown'
import UserProfileDropdown from '../features/UserProfileDropdown'

export default function NavBar() {
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-8">
        <div className="text-xl font-bold text-obsidian-green">SecureVibe</div>
        <div className="flex space-x-4">
          <a href="#" className="text-gray-600 hover:text-black">Dashboard</a>
          <a href="#" className="underline decoration-obsidian-green text-black font-medium">Scan</a>
          <a href="#" className="text-gray-600 hover:text-black">Reports</a>
          <a href="#" className="text-gray-600 hover:text-black">Settings</a>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationDropdown />
        <UserProfileDropdown />
      </div>
    </nav>
  )
}
