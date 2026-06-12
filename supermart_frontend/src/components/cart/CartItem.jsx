import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatters'

export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCart()
  const { id, product_variant, quantity, line_total } = item
  const { product_name, product_slug, variant_label, price, thumbnail, stock_qty } = product_variant

  const handleQtyChange = (delta) => {
    const next = quantity + delta
    if (next < 1) return
    updateItem(id, next)
  }

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Thumbnail */}
      <Link to={`/product/${product_slug}`} className="shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt={product_name} className="w-16 h-16 rounded-xl object-cover bg-cream-dark" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-cream-dark flex items-center justify-center text-2xl">🛒</div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product_slug}`} className="text-sm font-semibold text-gray-800 hover:text-primary line-clamp-1">
          {product_name}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">{variant_label}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-1">
            <button
              onClick={() => handleQtyChange(-1)}
              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-primary transition text-lg font-medium"
            >
              −
            </button>
            <span className="text-sm font-semibold text-gray-800 w-5 text-center">{quantity}</span>
            <button
              onClick={() => handleQtyChange(1)}
              disabled={quantity >= stock_qty}
              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-primary transition text-lg font-medium disabled:opacity-30"
            >
              +
            </button>
          </div>

          {/* Line total */}
          <span className="text-sm font-bold text-primary">{formatPrice(line_total)}</span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(id)}
        className="shrink-0 text-gray-300 hover:text-red-400 transition mt-1"
        aria-label="Remove item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
