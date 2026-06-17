import { Component } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 p-10">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-2xl">
            <h2 className="text-base font-bold text-red-700 mb-2">Page error</h2>
            <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">{this.state.error.message}</pre>
            <button
              className="mt-4 text-sm text-red-600 underline"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <AdminErrorBoundary>
          <Outlet />
        </AdminErrorBoundary>
      </main>
    </div>
  )
}
