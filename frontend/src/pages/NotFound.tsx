import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h2 className="text-4xl font-bold text-gray-300">404</h2>
      <p className="text-gray-500 mt-2">Page not found</p>
      <Link to="/" className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium">
        Back to Dashboard
      </Link>
    </div>
  )
}
