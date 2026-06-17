import { useQuery } from '@tanstack/react-query'
import { getSuperAdminAnalytics } from '../../api/superAdmin'
import { formatPrice } from '../../utils/formatters'

const ROLE_LABELS = {
  customer: 'Customers',
  admin: 'Admins',
  delivery: 'Delivery Staff',
  super_admin: 'Super Admins',
}

const ROLE_COLORS = {
  customer: 'text-blue-600',
  admin: 'text-purple-600',
  delivery: 'text-indigo-600',
  super_admin: 'text-primary',
}

function StatCard({ label, value, sub, color = 'text-gray-800', loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {loading ? (
        <div className="h-7 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  )
}

export default function SuperAdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: getSuperAdminAnalytics,
    refetchInterval: 120000,
  })

  const d = data?.data

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Platform Analytics</h1>

      {/* Revenue */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Revenue</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="All-time Revenue"
          value={formatPrice(d?.orders?.revenue_all_time ?? 0)}
          color="text-primary"
          loading={isLoading}
        />
        <StatCard
          label="Revenue — Last 30 Days"
          value={formatPrice(d?.orders?.revenue_last_30_days ?? 0)}
          color="text-green-600"
          loading={isLoading}
        />
        <StatCard
          label="Total Orders"
          value={d?.orders?.total ?? 0}
          color="text-gray-800"
          loading={isLoading}
        />
      </div>

      {/* Users */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Users</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={d?.users?.total ?? 0}
          sub={`+${d?.users?.new_last_30_days ?? 0} last 30 days`}
          color="text-gray-800"
          loading={isLoading}
        />
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <StatCard
            key={role}
            label={label}
            value={d?.users?.by_role?.[role] ?? 0}
            color={ROLE_COLORS[role]}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Top products */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Top Products by Units Sold</h2>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !d?.top_products?.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">No order data yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Units Sold</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {d.top_products.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{p.product_name_snapshot}</td>
                  <td className="px-5 py-3 text-gray-600">{p.total_sold}</td>
                  <td className="px-5 py-3 font-semibold text-primary">{formatPrice(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
