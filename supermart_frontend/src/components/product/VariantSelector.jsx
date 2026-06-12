import { formatPrice } from '../../utils/formatters'

export default function VariantSelector({ variants, selected, onSelect }) {
  const active = variants.filter((v) => v.is_active)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Select option:</p>
      <div className="flex flex-wrap gap-2">
        {active.map((variant) => {
          const isSelected = selected?.id === variant.id
          const outOfStock = variant.is_out_of_stock

          return (
            <button
              key={variant.id}
              onClick={() => !outOfStock && onSelect(variant)}
              disabled={outOfStock}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                ${isSelected
                  ? 'border-primary bg-primary text-white'
                  : outOfStock
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 hover:border-primary text-gray-700'
                }`}
            >
              <span>{variant.variant_label}</span>
              <span className="ml-2 text-xs opacity-80">{formatPrice(variant.price)}</span>
              {outOfStock && <span className="ml-1 text-xs">(out of stock)</span>}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-bold text-primary">{formatPrice(selected.price)}</span>
          {selected.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(selected.compare_at_price)}</span>
          )}
          {selected.is_low_stock && (
            <span className="text-xs text-orange-500 font-medium">Only {selected.stock_qty} left!</span>
          )}
        </div>
      )}
    </div>
  )
}
