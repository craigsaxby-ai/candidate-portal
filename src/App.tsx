import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PreScreen } from './pages/PreScreen'
import { Signup } from './pages/Signup'
import { Login } from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/prescreen/:token" element={<PreScreen />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-[#02182B] flex items-center justify-center text-white">
              Dashboard — coming soon
            </div>
          }
        />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-[#02182B] flex items-center justify-center text-white">
              Page not found
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
