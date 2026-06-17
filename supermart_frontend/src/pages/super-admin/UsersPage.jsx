import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSuperAdminUsers, updateSuperAdminUser } from '../../api/superAdmin'

const ROLES = ['customer', 'admin', 'delivery', 'super_admin']
const ROLE_LABELS = {
  customer: 'Customer',
  admin: 'Admin',
  delivery: 'Delivery',
  super_admin: 'Super Admin',
}
const ROLE_COLORS = {
  customer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
  delivery: 'bg-indigo-100 text-indigo-700',
  super_admin: 'bg-primary/10 text-primary',
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-users', search, roleFilter],
    queryFn: () =>
      getSuperAdminUsers(
        Object.fromEntries(
          Object.entries({ search, role: roleFilter }).filter(([, v]) => v)
        )
      ),
  })
  const users = data?.data?.results ?? data?.data ?? []

  const mutation = useMutation({
    mutationFn: ({ id, patch }) => updateSuperAdminUser(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin-users'] }),
  })

  const handleSearch = () => setSearch(pendingSearch)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Users</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-1 min-w-60">
          <input
            type="text"
            placeholder="Search name or email…"
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSearch}
            className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 transition"
          >
            Search
          </button>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>

        {(search || roleFilter) && (
          <button
            onClick={() => { setSearch(''); setPendingSearch(''); setRoleFilter('') }}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{user.full_name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  </td>

                  <td className="px-5 py-3">
                    <select
                      defaultValue={user.role}
                      onChange={(e) => mutation.mutate({ id: user.id, patch: { role: e.target.value } })}
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-3">
                    <button
                      onClick={() => mutation.mutate({ id: user.id, patch: { is_active: !user.is_active } })}
                      disabled={mutation.isPending}
                      className={`text-xs font-semibold hover:underline disabled:opacity-40 transition ${user.is_active ? 'text-red-400 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
