import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DeliveryNav() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="font-bold text-primary">Supermart</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Delivery</span>
      </div>

      <nav className="flex items-center gap-4">
        <NavLink
          to="/delivery"
          end
          className={({ isActive }) =>
            `text-sm font-medium transition ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-800'}`
          }
        >
          My Orders
        </NavLink>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
