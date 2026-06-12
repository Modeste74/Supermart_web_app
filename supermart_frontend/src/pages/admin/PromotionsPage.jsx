import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPromotions, createPromotion, deletePromotion } from '../../api/admin'
import { formatPrice } from '../../utils/formatters'

const emptyForm = () => ({
  name: '', code: '', type: 'percentage', value: '',
  min_order_amount: '0', max_uses: '',
  valid_from: '', valid_to: '', is_active: true,
})

const isExpired = (p) => new Date(p.valid_to) < new Date()
const isLive = (p) => p.is_active && !isExpired(p)

export default function PromotionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: getPromotions,
  })
  const promotions = data?.data?.results || data?.data || []

  const createMutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-promotions'])
      setShowForm(false)
      setForm(emptyForm())
      setErrors({})
    },
    onError: (err) => setErrors(err.response?.data || { detail: 'Failed to create promotion.' }),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => queryClient.invalidateQueries(['admin-promotions']),
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    createMutation.mutate({
      ...form,
      value: parseFloat(form.value) || 0,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      code: form.code || null,
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Promotions</h1>
        <button
          onClick={() => { setShowForm(!showForm); setErrors({}) }}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          {showForm ? 'Cancel' : '+ New Promotion'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">New Promotion</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code <span className="text-gray-400 font-normal">(blank = auto-apply)</span>
              </label>
              <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. SAVE10"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (KES)</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value {form.type === 'percentage' ? '(%)' : form.type === 'fixed_amount' ? '(KES)' : '(not applicable)'}
              </label>
              <input
                name="value" type="number" value={form.value} onChange={handleChange}
                min="0" required disabled={form.type === 'free_delivery'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (KES)</label>
              <input name="min_order_amount" type="number" value={form.min_order_amount} onChange={handleChange} min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses <span className="text-gray-400 font-normal">(blank = unlimited)</span>
              </label>
              <input name="max_uses" type="number" value={form.max_uses} onChange={handleChange} min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input name="valid_from" type="datetime-local" value={form.valid_from} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
              <input name="valid_to" type="datetime-local" value={form.valid_to} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="accent-primary" />
            Active
          </label>

          {errors.detail && <p className="text-sm text-red-500">{errors.detail}</p>}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Promotion'}
          </button>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          No promotions yet. Create one above.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Uses</th>
                <th className="px-5 py-3">Valid Until</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.map((p) => (
                <tr key={p.id} className="hover:bg-cream transition">
                  <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-3">
                    {p.code ? (
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{p.code}</code>
                    ) : (
                      <span className="text-gray-400 text-xs">Auto-apply</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {p.type === 'percentage' && `${p.value}%`}
                    {p.type === 'fixed_amount' && `−${formatPrice(p.value)}`}
                    {p.type === 'free_delivery' && 'Free delivery'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {p.current_uses}{p.max_uses ? ` / ${p.max_uses}` : ''}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(p.valid_to).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isLive(p) ? 'bg-green-100 text-green-700' :
                      isExpired(p) ? 'bg-gray-100 text-gray-500' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isLive(p) ? 'Active' : isExpired(p) ? 'Expired' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => { if (window.confirm('Delete this promotion?')) deleteMutation.mutate(p.id) }}
                      className="text-red-400 hover:underline text-xs font-medium"
                    >
                      Delete
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
