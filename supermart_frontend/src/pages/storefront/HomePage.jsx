import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCategories, getProducts } from '../../api/catalog'
import ProductGrid from '../../components/product/ProductGrid'
import Navbar from '../../components/layout/Navbar'

export default function HomePage() {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => getProducts({ page_size: 8 }),
  })

  const categories = categoriesData?.data?.results || categoriesData?.data || []
  const products = productsData?.data?.results || productsData?.data || []

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Fresh groceries,<br />delivered to your door</h1>
          <p className="text-primary-dark/80 text-lg mb-8 text-white/80">Shop from thousands of products at great prices</p>
          <Link
            to="/shop"
            className="inline-block bg-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-accent-dark transition"
          >
            Shop Now
          </Link>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-8 sm:px-6 py-12 space-y-14">

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-5">Shop by Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop/${cat.slug}`}
                  className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 hover:shadow-md transition text-center"
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 object-cover rounded-full" />
                  ) : (
                    <div className="w-12 h-12 bg-cream-dark rounded-full flex items-center justify-center text-2xl">🛒</div>
                  )}
                  <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
            <Link to="/shop" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          <ProductGrid products={products} loading={isLoading} />
        </section>

      </main>
    </div>
  )
}
