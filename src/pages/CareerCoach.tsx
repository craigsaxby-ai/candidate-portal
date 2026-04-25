/**
 * CareerCoach — CP-14
 *
 * Entry screen for the Erica Career Coach conversation flow.
 * Route: /career-coach — auth-guarded (redirects to /login if not authenticated)
 *
 * Shows:
 *  - Erica intro + name
 *  - "What We'll Cover" 2x2 grid
 *  - Time estimate notice
 *  - "Why This Improves Your Matches" card
 *  - CTA: Let's get started → /career-coach/conversation
 *  - Skip link → /profile
 */

import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EricaCircle } from '../components/EricaCircle'

// ── Cover tiles ───────────────────────────────────────────────────────────────

const COVER_TILES = [
  {
    icon: '🎯',
    title: 'Role Goals',
    description: 'Career progression, next steps, and what success looks like to you',
  },
  {
    icon: '🤝',
    title: 'Culture Fit',
    description: 'Work environment, team dynamics, and company values that matter to you',
  },
  {
    icon: '📍',
    title: 'Location & Work Style',
    description: 'Remote, hybrid, or on-site preferences and relocation flexibility',
  },
  {
    icon: '💰',
    title: 'Compensation',
    description: 'Salary expectations, benefits priorities, and equity considerations',
  },
]

// ── Why it matters bullets ────────────────────────────────────────────────────

const WHY_BULLETS = [
  'AI understands nuances beyond your resume — your CV shows what you\'ve done; this shows what you want next',
  'Better quality matches — candidates who complete this get 3x better match quality',
  'Save time in interviews — companies already know your preferences before reaching out',
  'Erica remembers — your answers improve every future match, not just this one',
]

// ── Main page ─────────────────────────────────────────────────────────────────

export function CareerCoach() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#02182B] flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#FD802E] animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    )
  }

  if (!user) return null

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-[#02182B] flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* ── Erica intro ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-4 pt-2 pb-2">
            <EricaCircle size="lg" isActive={true} />
            <div className="text-center space-y-1.5">
              <h1 className="text-white text-2xl font-bold">
                Hi {firstName}, I'm Erica
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                I'd love to learn more about your career goals so I can match you with the right opportunities.
              </p>
            </div>
          </div>

          {/* ── What We'll Cover ─────────────────────────────────────────── */}
          <div className="bg-[#233D4C] rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-bold text-base">What We'll Cover</h2>
            <div className="grid grid-cols-2 gap-3">
              {COVER_TILES.map((tile) => (
                <div
                  key={tile.title}
                  className="bg-[#02182B] rounded-xl p-4 space-y-2"
                >
                  <span className="text-2xl leading-none">{tile.icon}</span>
                  <p className="text-white text-sm font-bold leading-snug">{tile.title}</p>
                  <p className="text-gray-500 text-xs leading-snug">{tile.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Time estimate notice ─────────────────────────────────────── */}
          <div className="bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className="font-semibold text-white">⏱ Takes 10–15 minutes</span>
              {' '}— Erica will ask follow-up questions based on your responses to really understand your preferences and goals.
            </p>
          </div>

          {/* ── Why This Improves Your Matches ──────────────────────────── */}
          <div className="bg-[#233D4C] rounded-2xl p-5 space-y-4">
            <h2 className="text-white font-bold text-base">Why This Improves Your Matches</h2>
            <ul className="space-y-3">
              {WHY_BULLETS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  {/* Orange checkmark dot */}
                  <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#FD802E]/20 border border-[#FD802E]/50 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#FD802E]"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-gray-300 text-sm leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── CTA + skip ──────────────────────────────────────────────── */}
          <div className="space-y-3 pb-8">
            <button
              type="button"
              onClick={() => navigate('/career-coach/conversation')}
              className="w-full py-4 bg-[#FD802E] hover:bg-[#ff8f45] text-white font-bold text-base rounded-xl transition-colors shadow-lg shadow-[#FD802E]/20"
            >
              Let's get started →
            </button>
            <div className="text-center">
              <Link
                to="/profile"
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Skip for now — go to my profile →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="border-b border-[#233D4C] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/searchline-logo.jpg" alt="Searchline" className="w-8 h-8 rounded-lg" />
        <div>
          <span className="text-white font-bold text-base leading-none">Searchline</span>
          <span className="block text-[#FD802E] text-xs font-medium">Erica · Career Coach</span>
        </div>
      </div>
      <Link to="/profile" className="text-gray-500 hover:text-white text-sm transition-colors">
        My Profile
      </Link>
    </header>
  )
}
