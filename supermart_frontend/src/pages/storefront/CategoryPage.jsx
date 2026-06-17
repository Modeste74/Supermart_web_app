import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getProducts } from '../../api/catalog'
import ProductGrid from '../../components/product/ProductGrid'
import Navbar from '../../components/layout/Navbar'

export default function CategoryPage() {
  const { categorySlug } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['products', { category: categorySlug }],
    queryFn: () => getProducts({ category: categorySlug }),
  })

  const products = data?.data?.results || data?.data || []

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 capitalize mb-6">
          {categorySlug.replace(/-/g, ' ')}
        </h1>
        <ProductGrid products={products} loading={isLoading} />
      </main>
    </div>
  )
}
