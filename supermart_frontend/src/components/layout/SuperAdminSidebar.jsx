import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logout as logoutApi } from '../../api/auth'

const NAV_ITEMS = [
  { to: '/super-admin', label: 'Analytics', end: true },
  { to: '/super-admin/users', label: 'Users' },
  { to: '/super-admin/settings', label: 'Settings' },
]

export default function SuperAdminSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await logoutApi(refresh) } catch (_) {}
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        md:static md:inset-auto md:z-auto md:w-52 md:h-screen
        bg-white border-r border-gray-100 flex flex-col py-6 shrink-0 overflow-y-auto
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="px-5 mb-8 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">Supermart</span>
            <p className="text-xs text-gray-400 mt-0.5">Super Admin</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
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
    </>
  )
}
