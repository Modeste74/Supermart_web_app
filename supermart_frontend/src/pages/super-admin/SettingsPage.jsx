import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSuperAdminSettings, updateSuperAdminSettings } from '../../api/superAdmin'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-settings'],
    queryFn: getSuperAdminSettings,
  })

  useEffect(() => {
    if (data?.data && !form) {
      setForm(data.data)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: updateSuperAdminSettings,
    onSuccess: (res) => {
      queryClient.setQueryData(['super-admin-settings'], res)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? String(e.target.checked) : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(false)
    mutation.mutate(form)
  }

  if (isLoading || !form) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-white rounded-2xl w-1/3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-white rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Store Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name</label>
          <input
            type="text"
            value={form.store_name ?? ''}
            onChange={set('store_name')}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Store Phone</label>
          <input
            type="tel"
            value={form.store_phone ?? ''}
            onChange={set('store_phone')}
            placeholder="+254 700 000 000"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Store Email</label>
          <input
            type="email"
            value={form.store_email ?? ''}
            onChange={set('store_email')}
            placeholder="hello@supermart.co.ke"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Minimum Order Amount (KES)
          </label>
          <input
            type="number"
            min="0"
            value={form.min_order_amount ?? '0'}
            onChange={set('min_order_amount')}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-gray-400 mt-1">Set to 0 to disable minimum order requirement.</p>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Delivery Enabled</p>
            <p className="text-xs text-gray-400">When disabled, customers can only place pickup orders.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.delivery_enabled === 'true'}
              onChange={set('delivery_enabled')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:bg-primary" />
          </label>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">
            {mutation.error?.response?.data?.detail ?? 'Failed to save settings.'}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">Settings saved.</span>
          )}
        </div>
      </form>
    </div>
  )
}
