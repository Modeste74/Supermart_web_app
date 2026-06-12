import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrder, updateOrderStatus } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

const STATUS_OPTIONS = [
  'pending', 'confirmed', 'processing', 'dispatched',
  'out_for_delivery', 'delivered', 'cancelled',
]

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [updateError, setUpdateError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => getAdminOrder(id),
  })
  const order = data?.data

  const statusMutation = useMutation({
    mutationFn: (payload) => updateOrderStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-order', id])
      queryClient.invalidateQueries(['admin-orders'])
      queryClient.invalidateQueries(['admin-dashboard'])
      setNewStatus('')
      setNote('')
      setUpdateError('')
    },
    onError: (err) =>
      setUpdateError(
        err.response?.data?.status?.[0] ??
        err.response?.data?.detail ??
        'Failed to update status.'
      ),
  })

  const handleUpdate = () => {
    if (!newStatus) return
    setUpdateError('')
    statusMutation.mutate({ status: newStatus, note })
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Order not found.</p>
        <Link to="/admin/orders" className="text-primary hover:underline text-sm mt-2 block">
          ← Back to orders
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/admin/orders" className="text-sm text-gray-400 hover:text-primary">← Orders</Link>
        <h1 className="text-xl font-bold text-gray-800 font-mono">{order.order_number}</h1>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl shadow-sm p-5 text-sm space-y-1">
        <h2 className="font-semibold text-gray-700 mb-2">Customer</h2>
        <p className="text-gray-700 font-medium">{order.customer_name}</p>
        <p className="text-gray-400">{order.customer_email}</p>
        <p className="text-gray-400 capitalize">
          {order.fulfilment_type} · {order.payment_method?.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Status update */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Update Status</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1 min-w-40"
          >
            <option value="">— Select new status —</option>
            {STATUS_OPTIONS.filter((s) => s !== order.status).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1 min-w-40"
          />
          <button
            onClick={handleUpdate}
            disabled={!newStatus || statusMutation.isPending}
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
          >
            {statusMutation.isPending ? 'Saving…' : 'Update'}
          </button>
        </div>
        {updateError && <p className="text-xs text-red-500">{updateError}</p>}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Items</h2>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3 flex justify-between text-sm">
              <div>
                <p className="font-medium text-gray-800">{item.product_name_snapshot}</p>
                <p className="text-gray-400">{item.variant_label_snapshot} × {item.quantity}</p>
              </div>
              <span className="font-bold text-primary">{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm mt-2">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          {parseFloat(order.delivery_fee) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span><span>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
          {parseFloat(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>−{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery zone */}
      {order.delivery_zone && (
        <div className="bg-white rounded-2xl shadow-sm p-5 text-sm">
          <h2 className="font-semibold text-gray-700 mb-2">Delivery Zone</h2>
          <p className="text-gray-600">{order.delivery_zone.name} · {order.delivery_zone.estimated_days}</p>
        </div>
      )}

      {/* Activity log */}
      {order.status_history?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity Log</h2>
          <div className="space-y-3">
            {order.status_history.map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">{entry.status?.replace(/_/g, ' ')}</p>
                  {entry.note && <p className="text-gray-400 text-xs">{entry.note}</p>}
                  <p className="text-gray-300 text-xs mt-0.5">
                    {entry.changed_by_name && <span>{entry.changed_by_name} · </span>}
                    {new Date(entry.created_at).toLocaleString('en-KE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
