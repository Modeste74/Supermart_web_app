import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/formatters'

export default function ProductCard({ product }) {
  const { name, slug, thumbnail, starting_price, in_stock, category_name } = product

  return (
    <Link to={`/product/${slug}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="aspect-square bg-cream-dark overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🛒
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs text-accent font-medium uppercase tracking-wide mb-1">{category_name}</p>
        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-2">{name}</h3>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-primary font-bold text-sm">
            {starting_price ? `From ${formatPrice(starting_price)}` : 'See options'}
          </span>
          {!in_stock && (
            <span className="text-xs text-red-500 font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </Link>
  )
}
