import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetInventory, adminAdjustStock } from '../../api/catalog'
import { formatPrice } from '../../utils/formatters'

const STATUS_FILTERS = [
  { value: '', label: 'All SKUs' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

const statusBadge = (status) => {
  if (status === 'out_of_stock') return 'bg-red-100 text-red-700'
  if (status === 'low_stock') return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
}

const statusLabel = (status) => {
  if (status === 'out_of_stock') return 'Out of Stock'
  if (status === 'low_stock') return 'Low Stock'
  return 'In Stock'
}

function StockCell({ variant }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(variant.stock_qty))

  const mutation = useMutation({
    mutationFn: (qty) => adminAdjustStock(variant.id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-inventory'])
      setEditing(false)
    },
  })

  const commit = () => {
    const qty = parseInt(value, 10)
    if (!isNaN(qty) && qty >= 0 && qty !== variant.stock_qty) {
      mutation.mutate(qty)
    } else {
      setEditing(false)
      setValue(String(variant.stock_qty))
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setValue(String(variant.stock_qty)) } }}
          autoFocus
          className="w-20 border border-primary rounded px-2 py-1 text-sm focus:outline-none"
        />
        <button onClick={commit} disabled={mutation.isPending} className="text-xs text-primary font-medium hover:underline">
          {mutation.isPending ? '…' : 'Save'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setEditing(true); setValue(String(variant.stock_qty)) }}
      className="flex items-center gap-1 group"
      title="Click to edit stock"
    >
      <span className="text-sm font-medium text-gray-800">{variant.stock_qty}</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-300 group-hover:text-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
      </svg>
    </button>
  )
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', search, stockFilter],
    queryFn: () => adminGetInventory({
      ...(search && { search }),
      ...(stockFilter && { stock_status: stockFilter }),
    }),
  })

  const inventory = data?.data?.results || data?.data || []

  const counts = {
    out_of_stock: inventory.filter(v => v.stock_status === 'out_of_stock').length,
    low_stock: inventory.filter(v => v.stock_status === 'low_stock').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <div className="flex gap-3">
          {counts.out_of_stock > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">
              {counts.out_of_stock} out of stock
            </span>
          )}
          {counts.low_stock > 0 && (
            <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
              {counts.low_stock} low stock
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by product, SKU or variant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStockFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                stockFilter === f.value ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Variant</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Threshold</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No variants found</td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-cream transition">
                    <td className="px-5 py-3 font-medium text-gray-800">{item.product_name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-5 py-3 text-gray-600">{item.variant_label}</td>
                    <td className="px-5 py-3 text-gray-600">{formatPrice(item.price)}</td>
                    <td className="px-5 py-3">
                      <StockCell variant={item} />
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{item.low_stock_threshold}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(item.stock_status)}`}>
                        {statusLabel(item.stock_status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
