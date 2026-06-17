import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logout as logoutApi } from '../../api/auth'

const NAV_ITEMS = [
  { to: '/super-admin', label: 'Analytics', end: true },
  { to: '/super-admin/users', label: 'Users' },
  { to: '/super-admin/settings', label: 'Settings' },
]

export default function SuperAdminSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await logoutApi(refresh) } catch (_) {}
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-52 h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col py-6 shrink-0 overflow-y-auto">
      <div className="px-5 mb-8">
        <span className="text-lg font-bold text-primary">Supermart</span>
        <p className="text-xs text-gray-400 mt-0.5">Super Admin</p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 mt-4 space-y-3">
        <div className="text-xs text-gray-500 font-medium truncate">{user?.email}</div>
        <NavLink to="/admin" className="block text-xs text-gray-400 hover:text-primary transition">
          → Admin Panel
        </NavLink>
        <NavLink to="/" className="block text-xs text-gray-400 hover:text-primary transition">
          ← Back to Store
        </NavLink>
        <button
          onClick={handleLogout}
          className="block text-xs text-red-400 hover:text-red-600 transition text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
