import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCategories, getProducts } from '../../api/catalog'
import ProductGrid from '../../components/product/ProductGrid'
import Navbar from '../../components/layout/Navbar'

function FilterPanel({ categories, category, in_stock, min_price, max_price, updateFilter, onClose }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Category</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => { updateFilter('category', ''); onClose?.() }}
              className={`text-sm w-full text-left px-2 py-1 rounded-lg ${!category ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
            >
              All
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => { updateFilter('category', cat.slug); onClose?.() }}
                className={`text-sm w-full text-left px-2 py-1 rounded-lg ${category === cat.slug ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Availability</h3>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={in_stock === 'true'}
            onChange={(e) => updateFilter('in_stock', e.target.checked ? 'true' : '')}
            className="accent-primary"
          />
          In stock only
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Price range (KES)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={min_price}
            onChange={(e) => updateFilter('min_price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max"
            value={max_price}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const search    = params.get('search')   || ''
  const category  = params.get('category') || ''
  const in_stock  = params.get('in_stock') || ''
  const min_price = params.get('min_price') || ''
  const max_price = params.get('max_price') || ''

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search, category, in_stock, min_price, max_price],
    queryFn: () => {
      const p = { search, category, in_stock, min_price, max_price }
      return getProducts(Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '')))
    },
  })

  const categories = categoriesData?.data?.results || categoriesData?.data || []
  const products   = productsData?.data?.results  || productsData?.data  || []

  const updateFilter = (key, value) => {
    const next = { search, category, in_stock, min_price, max_price, [key]: value }
    const p = new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '')))
    navigate(`/shop?${p.toString()}`, { replace: true })
  }

  const activeFilterCount = [category, in_stock, min_price, max_price].filter(Boolean).length

  const filterProps = { categories, category, in_stock, min_price, max_price, updateFilter }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Mobile filter button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:border-primary hover:text-primary transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar filters */}
          <aside className="hidden md:block w-56 shrink-0">
            <FilterPanel {...filterProps} />
          </aside>

          {/* Product listing */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-800">
                {search ? `Results for "${search}"` : 'All Products'}
              </h1>
              <span className="text-sm text-gray-400">{products.length} items</span>
            </div>
            <ProductGrid products={products} loading={isLoading} />
          </main>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6 md:hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-800">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel {...filterProps} onClose={() => setFiltersOpen(false)} />
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-8 w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition"
            >
              Show results
            </button>
          </div>
        </>
      )}
    </div>
  )
}
