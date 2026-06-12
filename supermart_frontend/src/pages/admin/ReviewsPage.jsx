import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminGetReviews, adminDeleteReview } from '../../api/catalog'

function StarDisplay({ rating }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  )
}

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: adminGetReviews,
  })
  const reviews = data?.data ?? []

  const deleteReview = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      setDeletingId(null)
    },
  })

  const filtered = search.trim()
    ? reviews.filter(
        (r) =>
          r.author_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.author_email?.toLowerCase().includes(search.toLowerCase()) ||
          r.product_name?.toLowerCase().includes(search.toLowerCase()),
      )
    : reviews

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by customer or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-400">No reviews found.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Rating</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Comment</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Verified</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{review.author_name}</p>
                    <p className="text-xs text-gray-400">{review.author_email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{review.product_name}</td>
                  <td className="px-5 py-3">
                    <StarDisplay rating={review.rating} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs">
                    <p className="truncate">{review.comment || <span className="italic text-gray-300">No comment</span>}</p>
                  </td>
                  <td className="px-5 py-3">
                    {review.is_verified_purchase ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {deletingId === review.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteReview.mutate(review.id)}
                          disabled={deleteReview.isPending}
                          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(review.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
