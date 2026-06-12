import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/promotions', label: 'Promotions' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/reviews', label: 'Reviews' },
]

export default function AdminSidebar() {
  return (
    <aside className="w-52 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 shrink-0">
      <div className="px-5 mb-8">
        <span className="text-lg font-bold text-primary">Supermart</span>
        <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
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

      <div className="px-5 mt-4">
        <NavLink to="/" className="text-xs text-gray-400 hover:text-primary transition">
          ← Back to Store
        </NavLink>
      </div>
    </aside>
  )
}
