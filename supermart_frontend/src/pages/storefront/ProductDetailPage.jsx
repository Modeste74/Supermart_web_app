import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { getProduct, getProductReviews, createReview } from '../../api/catalog'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import VariantSelector from '../../components/product/VariantSelector'
import Navbar from '../../components/layout/Navbar'
import { formatPrice } from '../../utils/formatters'

function StarRating({ rating, max = 5, size = 'md' }) {
  const cls = size === 'sm' ? 'text-sm' : 'text-lg'
  return (
    <span className={cls}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addError, setAddError] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const { addToCart, loading: cartLoading } = useCart()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
  })

  useEffect(() => {
    if (data?.data?.variants) {
      const first = data.data.variants.find((v) => v.is_active && !v.is_out_of_stock)
      if (first) setSelectedVariant(first)
    }
  }, [data])

  const { data: reviewsData } = useQuery({
    queryKey: ['product-reviews', slug],
    queryFn: () => getProductReviews(slug),
    enabled: !!slug,
  })
  const reviewsPayload = reviewsData?.data ?? { count: 0, average_rating: null, results: [] }

  const submitReview = useMutation({
    mutationFn: (data) => createReview(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', slug] })
      setReviewComment('')
      setReviewRating(5)
      setReviewSuccess(true)
    },
  })

  const product = data?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center text-gray-400">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
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

        {/* Reviews */}
        <section className="mt-14">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Customer Reviews</h2>
            {reviewsPayload.count > 0 && (
              <span className="text-sm text-gray-500">
                <StarRating rating={Math.round(reviewsPayload.average_rating)} size="sm" />
                {' '}{Number(reviewsPayload.average_rating).toFixed(1)} ({reviewsPayload.count})
              </span>
            )}
          </div>

          {/* Submit review */}
          {user ? (
            reviewSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-8 text-sm text-green-700">
                Thank you for your review!{' '}
                <button onClick={() => setReviewSuccess(false)} className="underline">Write another</button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Write a Review</h3>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product…"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary mb-3"
                />
                {submitReview.isError && (
                  <p className="text-xs text-red-500 mb-2">
                    {submitReview.error?.response?.data?.detail
                      ?? submitReview.error?.response?.data?.non_field_errors?.[0]
                      ?? 'Could not submit review.'}
                  </p>
                )}
                <button
                  onClick={() => submitReview.mutate({ rating: reviewRating, comment: reviewComment })}
                  disabled={submitReview.isPending}
                  className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {submitReview.isPending ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            )
          ) : (
            <p className="text-sm text-gray-500 mb-8">
              <Link to="/login" className="text-primary hover:underline">Sign in</Link> to leave a review.
            </p>
          )}

          {/* Review list */}
          {reviewsPayload.count === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {reviewsPayload.results.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{review.author_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size="sm" />
                        {review.is_verified_purchase && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified Purchase</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
