import { Routes, Route } from 'react-router-dom'
import { PreScreen } from './pages/PreScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/prescreen/:token" element={<PreScreen />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-navy flex items-center justify-center text-white">
            Page not found
          </div>
        }
      />
    </Routes>
  )
}
