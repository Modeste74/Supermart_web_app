import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { logout as logoutApi } from '../../api/auth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await logoutApi(refresh) } catch (_) {}
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-primary shrink-0">
          Supermart
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
          <div className="flex w-full border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 px-4 py-2 text-sm outline-none"
            />
            <button type="submit" className="bg-primary text-white px-4 text-sm font-medium hover:bg-primary-dark transition">
              Search
            </button>
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Cart */}
          <Link to="/cart" className="relative text-gray-600 hover:text-primary transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-sm font-medium text-gray-700 hover:text-primary transition"
              >
                {user.first_name}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream">
                      Admin Dashboard
                    </Link>
                  )}
                  {user.role === 'delivery' && (
                    <Link to="/delivery" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream">
                      Deliveries
                    </Link>
                  )}
                  {user.role === 'customer' && (
                    <>
                      <Link to="/account/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream">My Orders</Link>
                      <Link to="/account/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream">Profile</Link>
                    </>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={handleSearch} className="sm:hidden px-4 pb-3">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" className="bg-primary text-white px-3 text-sm font-medium">
            Go
          </button>
        </div>
      </form>
    </header>
  )
}
