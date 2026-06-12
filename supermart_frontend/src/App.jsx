import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import CartDrawer from './components/cart/CartDrawer'

// Storefront
import HomePage from './pages/storefront/HomePage'
import ShopPage from './pages/storefront/ShopPage'
import CategoryPage from './pages/storefront/CategoryPage'
import ProductDetailPage from './pages/storefront/ProductDetailPage'
import CartPage from './pages/storefront/CartPage'
import CheckoutPage from './pages/storefront/CheckoutPage'
import CheckoutSuccessPage from './pages/storefront/CheckoutSuccessPage'
import PaymentCallbackPage from './pages/storefront/PaymentCallbackPage'
import OrdersPage from './pages/storefront/OrdersPage'
import OrderDetailPage from './pages/storefront/OrderDetailPage'
import OrderTrackingPage from './pages/storefront/OrderTrackingPage'
import LoginPage from './pages/storefront/LoginPage'
import RegisterPage from './pages/storefront/RegisterPage'
import ForgotPasswordPage from './pages/storefront/ForgotPasswordPage'

// Delivery
import DeliveryLayout from './components/layout/DeliveryLayout'
import DeliveryDashboardPage from './pages/delivery/DeliveryDashboardPage'
import DeliveryOrderDetailPage from './pages/delivery/DeliveryOrderDetailPage'

// Admin
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage'
import ProductsPage from './pages/admin/ProductsPage'
import ProductFormPage from './pages/admin/ProductFormPage'
import InventoryPage from './pages/admin/InventoryPage'
import PromotionsPage from './pages/admin/PromotionsPage'
import SalesReportPage from './pages/admin/SalesReportPage'
import ReviewsPage from './pages/admin/ReviewsPage'

const queryClient = new QueryClient()

const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-primary">
    {title} — coming soon
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <CartDrawer />
            <Routes>
              {/* Public storefront */}
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/:categorySlug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Customer */}
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
              <Route path="/checkout/success" element={<ProtectedRoute roles={['customer']}><CheckoutSuccessPage /></ProtectedRoute>} />
              <Route path="/checkout/payment-callback" element={<ProtectedRoute roles={['customer']}><PaymentCallbackPage /></ProtectedRoute>} />
              <Route path="/account/orders" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
              <Route path="/account/orders/:orderNumber" element={<ProtectedRoute roles={['customer']}><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
              <Route path="/track" element={<OrderTrackingPage />} />
              <Route path="/account/profile" element={<ProtectedRoute roles={['customer']}><Placeholder title="Profile" /></ProtectedRoute>} />

              {/* Admin — nested layout route */}
              <Route element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/products" element={<ProductsPage />} />
                <Route path="/admin/products/new" element={<ProductFormPage />} />
                <Route path="/admin/products/:id" element={<ProductFormPage />} />
                <Route path="/admin/inventory" element={<InventoryPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
                <Route path="/admin/promotions" element={<PromotionsPage />} />
                <Route path="/admin/reports" element={<SalesReportPage />} />
                <Route path="/admin/reviews" element={<ReviewsPage />} />
              </Route>

              {/* Delivery — nested layout route */}
              <Route element={<ProtectedRoute roles={['delivery']}><DeliveryLayout /></ProtectedRoute>}>
                <Route path="/delivery" element={<DeliveryDashboardPage />} />
                <Route path="/delivery/orders/:id" element={<DeliveryOrderDetailPage />} />
              </Route>

              {/* Super admin */}
              <Route path="/super-admin" element={<ProtectedRoute roles={['super_admin']}><Placeholder title="Super Admin" /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
