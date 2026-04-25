import { Routes, Route } from 'react-router-dom'
import { PreScreen } from './pages/PreScreen'

function Home() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center">
      <img src="/searchline-logo.jpg" alt="Searchline" className="w-16 h-16 rounded-2xl mb-6" />
      <h1 className="text-white text-2xl font-bold">Searchline</h1>
      <p className="text-orange text-sm mt-1 mb-6">Candidate Portal</p>
      <p className="text-gray-400 text-sm max-w-xs">
        If you received a link from a recruiter, please use that link to access your pre-screen interview.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/prescreen/:token" element={<PreScreen />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-navy flex items-center justify-center text-white text-sm text-gray-400">
            Page not found
          </div>
        }
      />
    </Routes>
  )
}
