import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Supermart</h1>
          <p className="text-gray-500 mt-1">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm">
              Check your email for a password reset link.
            </div>
            <Link to="/login" className="block text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-semibold rounded-lg py-3 hover:bg-primary-dark transition disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
