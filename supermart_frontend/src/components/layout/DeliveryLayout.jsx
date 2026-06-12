import { Outlet } from 'react-router-dom'
import DeliveryNav from './DeliveryNav'

export default function DeliveryLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DeliveryNav />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
