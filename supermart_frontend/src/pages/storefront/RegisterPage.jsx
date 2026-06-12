import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const res = await registerApi(form)
      login(res.data.user, { access: res.data.access, refresh: res.data.refresh })
      navigate('/')
    } catch (err) {
      setErrors(err.response?.data || {})
    } finally {
      setLoading(false)
    }
  }

  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {errors[name] && <p className="text-red-600 text-xs mt-1">{errors[name][0]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Supermart</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        {errors.non_field_errors && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {errors.non_field_errors[0]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('first_name', 'First Name', 'text', 'John')}
            {field('last_name', 'Last Name', 'text', 'Doe')}
          </div>
          {field('email', 'Email', 'email', 'you@example.com')}
          {field('phone', 'Phone (optional)', 'tel', '+254 7XX XXX XXX')}
          {field('password', 'Password', 'password', '••••••••')}
          {field('confirm_password', 'Confirm Password', 'password', '••••••••')}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold rounded-lg py-3 hover:bg-primary-dark transition disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
