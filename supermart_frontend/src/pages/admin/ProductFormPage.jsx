import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  adminCreateProduct, adminUpdateProduct, adminGetProducts,
  adminCreateVariant, adminUpdateVariant, adminDeleteVariant,
  adminGetCategories,
} from '../../api/catalog'
import { formatPrice } from '../../utils/formatters'

const VARIANT_TYPES = ['weight', 'volume', 'pack_size', 'flavor', 'form']

const emptyVariant = () => ({
  sku: '', variant_label: '', variant_type: 'weight',
  price: '', compare_at_price: '', stock_qty: 0, low_stock_threshold: 5, is_active: true,
})

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({ name: '', description: '', category: '', brand: '', images: '', is_active: true })
  const [variants, setVariants] = useState([emptyVariant()])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const { data: categoriesData } = useQuery({ queryKey: ['admin-categories'], queryFn: adminGetCategories })
  const categories = categoriesData?.data || []

  const { data: productData } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminGetProducts().then(r => r.data?.results?.find?.(p => p.id === Number(id)) || r.data?.find?.(p => p.id === Number(id))),
    enabled: isEdit,
  })

  useEffect(() => {
    if (productData && isEdit) {
      const p = Array.isArray(productData) ? productData.find(p => p.id === Number(id)) : productData
      if (p) {
        setForm({ name: p.name, description: p.description, category: p.category, brand: p.brand, images: p.images?.join('\n') || '', is_active: p.is_active })
        if (p.variants?.length) setVariants(p.variants.map(v => ({ ...v, compare_at_price: v.compare_at_price || '' })))
      }
    }
  }, [productData, isEdit, id])

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleVariantChange = (idx, e) => {
    const { name, value, type, checked } = e.target
    setVariants(vs => vs.map((v, i) => i === idx ? { ...v, [name]: type === 'checkbox' ? checked : value } : v))
  }

  const addVariant = () => setVariants(vs => [...vs, emptyVariant()])
  const removeVariant = (idx) => setVariants(vs => vs.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const payload = {
        ...form,
        images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
      }
      let productId = id
      if (isEdit) {
        await adminUpdateProduct(id, payload)
      } else {
        const res = await adminCreateProduct(payload)
        productId = res.data.id
      }
      for (const v of variants) {
        const variantPayload = { ...v, compare_at_price: v.compare_at_price || null }
        if (v.id) {
          await adminUpdateVariant(v.id, variantPayload)
        } else {
          await adminCreateVariant(productId, variantPayload)
        }
      }
      queryClient.invalidateQueries(['admin-products'])
      navigate('/admin/products')
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Something went wrong.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Product Info</h2>

          {[['name', 'Product Name', 'text'], ['brand', 'Brand', 'text']].map(([field, label, type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} name={field} value={form[field]} onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={form.category} onChange={handleFormChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleFormChange} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs <span className="text-gray-400 font-normal">(one per line)</span></label>
            <textarea name="images" value={form.images} onChange={handleFormChange} rows={3} placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleFormChange} className="accent-primary" />
            Active (visible on storefront)
          </label>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Variants / SKUs</h2>
            <button type="button" onClick={addVariant} className="text-xs text-primary font-medium hover:underline">+ Add variant</button>
          </div>

          {variants.map((v, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Variant {idx + 1}</span>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(idx)} className="text-xs text-red-400 hover:underline">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['sku', 'SKU'], ['variant_label', 'Label (e.g. 1L, 500g)']].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type="text" name={field} value={v[field]} onChange={(e) => handleVariantChange(idx, e)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select name="variant_type" value={v.variant_type} onChange={(e) => handleVariantChange(idx, e)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {VARIANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {[['price', 'Price (KES)'], ['compare_at_price', 'Original Price'], ['stock_qty', 'Stock'], ['low_stock_threshold', 'Low Stock Alert']].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                    <input type="number" name={field} value={v[field]} onChange={(e) => handleVariantChange(idx, e)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" name="is_active" checked={v.is_active} onChange={(e) => handleVariantChange(idx, e)} className="accent-primary" />
                Active
              </label>
            </div>
          ))}
        </div>

        {errors.detail && <p className="text-red-500 text-sm">{errors.detail}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-60">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')}
            className="px-6 py-3 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
