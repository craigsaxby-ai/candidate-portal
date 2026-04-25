/**
 * Login — CP-5
 *
 * Candidate sign-in with Supabase Auth.
 * Route: /login — public
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError('Invalid email or password.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#02182B] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-2 mb-8">
        <img
          src="/searchline-logo.jpg"
          alt="Searchline"
          className="w-10 h-10 rounded-xl"
        />
        <div>
          <span className="block text-white font-bold tracking-tight text-2xl leading-none">
            Searchline
          </span>
          <span className="block text-[#FD802E] font-medium text-sm">
            Executive Search
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#233D4C] rounded-2xl p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Sign in to your Searchline candidate account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors"
            />
            <div className="mt-1.5 text-right">
              <span className="text-[#FD802E] text-xs cursor-not-allowed opacity-60">
                Forgot password?
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#FD802E] hover:bg-[#ff8f45] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#FD802E] hover:underline font-medium">
            Sign up →
          </Link>
        </p>
      </div>

      <p className="text-gray-600 text-xs mt-6">Powered by Searchline AI</p>
    </div>
  )
}
