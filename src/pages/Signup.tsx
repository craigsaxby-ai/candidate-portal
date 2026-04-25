/**
 * Signup — CP-5
 *
 * Candidate account creation with Supabase Auth.
 * Route: /signup — public
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
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
        {success ? (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FD802E]/20 flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#FD802E]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold">Check your email</h2>
            <p className="text-gray-400 text-sm">
              We've sent a confirmation link to{' '}
              <span className="text-white font-medium">{email}</span>. Click it
              to activate your account.
            </p>
            <p className="text-gray-500 text-xs pt-2">
              Already confirmed?{' '}
              <Link to="/login" className="text-[#FD802E] hover:underline">
                Sign in →
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-white text-2xl font-bold tracking-tight">
                Create your candidate profile
              </h1>
              <p className="text-gray-400 text-sm mt-1.5">
                Join Searchline to be matched with opportunities that fit you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors"
                />
              </div>

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
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors"
                />
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
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FD802E] hover:underline font-medium">
                Sign in →
              </Link>
            </p>
          </>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-6">Powered by Searchline AI</p>
    </div>
  )
}
