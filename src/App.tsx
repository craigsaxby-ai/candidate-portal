import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PreScreen } from './pages/PreScreen'
import { Signup } from './pages/Signup'
import { Login } from './pages/Login'
import searchlineLogo from './assets/searchline-logo.jpg'

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{backgroundColor: '#02182B'}}>
      <img src={searchlineLogo} alt="Searchline" className="w-16 h-16 rounded-2xl mb-6" />
      <h1 className="text-white text-2xl font-bold">Searchline</h1>
      <p className="text-sm mt-1 mb-6" style={{color: '#FD802E'}}>Candidate Portal</p>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        If you received a link from a recruiter, please use that link to access your pre-screen interview.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
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
