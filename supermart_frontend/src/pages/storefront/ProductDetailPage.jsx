import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getProduct } from '../../api/catalog'
import { useCart } from '../../context/CartContext'
import VariantSelector from '../../components/product/VariantSelector'
import Navbar from '../../components/layout/Navbar'
import { formatPrice } from '../../utils/formatters'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addError, setAddError] = useState('')
  const { addToCart, loading: cartLoading } = useCart()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
    onSuccess: (res) => {
      const first = res.data.variants?.find((v) => v.is_active && !v.is_out_of_stock)
      if (first) setSelectedVariant(first)
    },
  })

  const product = data?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-medium">Product not found.</p>
          <Link to="/shop" className="mt-4 inline-block text-primary hover:underline text-sm">Back to shop</Link>
        </div>
      </div>
    )
  }

  const canAddToCart = selectedVariant && !selectedVariant.is_out_of_stock

  const handleAddToCart = async () => {
    if (!canAddToCart) return
    setAddError('')
    const result = await addToCart(selectedVariant.id, 1)
    if (!result.success) setAddError(result.error)
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex gap-1">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary">Shop</Link>
          <span>/</span>
          <Link to={`/shop/${product.category?.slug}`} className="hover:text-primary">{product.category?.name}</Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              {product.images?.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-gray-200">🛒</div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">{product.brand}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{product.name}</h1>

            <VariantSelector
              variants={product.variants || []}
              selected={selectedVariant}
              onSelect={setSelectedVariant}
            />

            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {addError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || cartLoading}
              className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cartLoading
                ? 'Adding…'
                : !selectedVariant
                  ? 'Select an option'
                  : selectedVariant.is_out_of_stock
                    ? 'Out of Stock'
                    : 'Add to Cart'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
