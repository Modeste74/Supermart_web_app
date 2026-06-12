import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts } from '../../api/catalog'
import ProductGrid from '../../components/product/ProductGrid'
import Navbar from '../../components/layout/Navbar'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    in_stock: searchParams.get('in_stock') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))),
  })

  const categories = categoriesData?.data || []
  const products = productsData?.data?.results || productsData?.data || []

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    const params = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== ''))
    setSearchParams(params)
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">

        {/* Sidebar filters */}
        <aside className="hidden md:block w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Category</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`text-sm w-full text-left px-2 py-1 rounded-lg ${!filters.category ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                >
                  All
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`text-sm w-full text-left px-2 py-1 rounded-lg ${filters.category === cat.slug ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
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
                checked={filters.in_stock === 'true'}
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
                value={filters.min_price}
                onChange={(e) => updateFilter('min_price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price}
                onChange={(e) => updateFilter('max_price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </aside>

        {/* Product listing */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">
              {filters.search ? `Results for "${filters.search}"` : 'All Products'}
            </h1>
            <span className="text-sm text-gray-400">{products.length} items</span>
          </div>
          <ProductGrid products={products} loading={isLoading} />
        </main>
      </div>
    </div>
  )
}
