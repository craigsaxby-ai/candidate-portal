/**
 * PreScreen — CP-2 + CP-3
 *
 * Public magic-link pre-screen page for the Candidate Portal.
 * Route: /prescreen/:token — no auth required.
 *
 * Ported from the Engine's CandidatePreScreen.tsx.
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { EricaCircle } from '../components/EricaCircle'

const API_BASE = import.meta.env.VITE_ENGINE_API_BASE_URL ?? ''

interface TokenPayload {
  candidateId:   string
  projectId:     string
  candidateName: string
  questions:     string[]
  projectTitle?: string
  roleTitle?:    string
  companyName?:  string
  clientName?:   string
}

// ── Inline SVG icons (no lucide-react dependency) ─────────────────────────────

function IconLoader() {
  return (
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
  )
}

function IconLoaderSm() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function IconCheckCircle({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}

function IconAlertCircle({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

// ── Shared layout shell ───────────────────────────────────────────────────────

function PageShell({ children, centred = false }: { children: React.ReactNode; centred?: boolean }) {
  return (
    <div className={`min-h-screen bg-[#02182B] flex flex-col ${centred ? 'items-center justify-center' : ''}`}>
      {children}
    </div>
  )
}

// ── Searchline wordmark ───────────────────────────────────────────────────────

function Wordmark({ size = 'md', centred = false }: { size?: 'sm' | 'md' | 'lg'; centred?: boolean }) {
  const titleCls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'
  const subCls   = size === 'lg' ? 'text-sm'  : 'text-xs'
  const imgCls   = size === 'lg' ? 'w-10 h-10 rounded-xl' : size === 'sm' ? 'w-6 h-6 rounded-md' : 'w-8 h-8 rounded-lg'
  return (
    <div className={`flex items-center gap-2 ${centred ? 'justify-center' : ''}`}>
      <img src="/searchline-logo.jpg" alt="Searchline" className={imgCls} />
      <div className={centred ? 'text-center' : ''}>
        <span className={`text-white font-bold tracking-tight ${titleCls}`}>Searchline</span>
        <span className={`block text-[#FD802E] font-medium ${subCls}`}>Executive Search</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PreScreen() {
  const { token } = useParams<{ token: string }>()

  const [payload,           setPayload]           = useState<TokenPayload | null>(null)
  const [loading,           setLoading]           = useState(true)
  const [invalid,           setInvalid]           = useState(false)
  const [answers,           setAnswers]           = useState<string[]>([])
  const [step,              setStep]              = useState(0)
  const [showIntro,         setShowIntro]         = useState(true)
  const [introOpacity,      setIntroOpacity]      = useState(true)
  const [questionsOpacity,  setQuestionsOpacity]  = useState(false)
  const [submitting,        setSubmitting]        = useState(false)
  const [done,              setDone]              = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  // ── Load token → questions ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return }
    fetch(`${API_BASE}/api/prescreen/${token}/start`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: TokenPayload) => {
        setPayload(data)
        setAnswers(new Array(data.questions.length).fill(''))
        setLoading(false)
      })
      .catch(() => { setInvalid(true); setLoading(false) })
  }, [token])

  // ── Intro → questions fade transition ─────────────────────────────────────
  const handleStart = () => {
    setIntroOpacity(false)
    setTimeout(() => {
      setShowIntro(false)
      setTimeout(() => setQuestionsOpacity(true), 50)
    }, 500)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!payload || !token) return
    setSubmitting(true)
    setError(null)
    try {
      const responses = payload.questions.map((q, i) => ({ question: q, answer: answers[i] ?? '' }))
      const res = await fetch(`${API_BASE}/api/prescreen/${token}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ responses }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Submission failed. Please try again.')
        setSubmitting(false)
        return
      }
      setDone(true)
    } catch {
      setError('Network error — please check your connection and try again.')
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell centred>
        <div className="flex flex-col items-center gap-8 px-6">
          <Wordmark size="lg" centred />
          <IconLoader />
          <p className="text-gray-400 text-sm tracking-wide">Loading your pre-screen session…</p>
        </div>
      </PageShell>
    )
  }

  // ── Invalid / expired ─────────────────────────────────────────────────────
  if (invalid || !payload) {
    return (
      <PageShell centred>
        <div className="w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-6 text-center">
          <Wordmark size="lg" centred />
          <div className="w-12 h-12 rounded-full bg-[#233D4C] flex items-center justify-center">
            <span className="text-[#FD802E]"><IconAlertCircle size={24} /></span>
          </div>
          <div className="space-y-3">
            <h1 className="text-white text-xl font-semibold">This link has expired or is no longer valid.</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Pre-screen links are valid for 7 days. If you believe this is an error, please contact
              the recruiter who sent you this invitation.
            </p>
          </div>
        </div>
      </PageShell>
    )
  }

  const firstName    = payload.candidateName.split(' ')[0]
  const roleLabel    = payload.roleTitle    ?? payload.projectTitle ?? 'this role'
  const companyLabel = payload.companyName  ?? payload.clientName   ?? 'the hiring team'

  // ── Done ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <PageShell centred>
        <div className="w-full max-w-[640px] mx-auto px-6 py-12 flex flex-col items-center gap-8 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center">
            <span className="text-green-400"><IconCheckCircle size={44} /></span>
          </div>

          {/* Confirmation */}
          <div className="space-y-3">
            <h1 className="text-white text-2xl font-bold">Thank you, {firstName}!</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              Your pre-screen is complete. Our team will review your responses and be in touch with next steps.
            </p>
          </div>

          <div className="w-full border-t border-[#233D4C]" />

          {/* Profile CTA card */}
          <div className="w-full border border-[#FD802E]/40 bg-[#1a3347] rounded-2xl p-6 space-y-4 text-center">
            <p className="text-white text-base font-semibold">
              Want to increase your chances?
            </p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
              Candidates with a complete Searchline profile are <span className="text-white font-semibold">8×</span> more likely to be matched to relevant opportunities.
            </p>
            <Link
              to="/signup"
              className="block w-full py-3.5 bg-[#FD802E] hover:bg-[#ff8f45] text-white font-bold text-sm rounded-xl transition-colors text-center"
            >
              Create your Searchline profile →
            </Link>
          </div>

          {/* Powered by footer */}
          <p className="text-gray-600 text-xs">Powered by Searchline AI</p>
        </div>
      </PageShell>
    )
  }

  const currentQ = payload.questions[step]
  const isLast   = step === payload.questions.length - 1
  const progress = ((step + 1) / payload.questions.length) * 100

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (showIntro) {
    return (
      <PageShell centred>
        <div
          className={`transition-opacity duration-500 ${introOpacity ? 'opacity-100' : 'opacity-0'} w-full max-w-lg mx-auto px-6 py-10 flex flex-col items-center gap-8`}
        >
          <Wordmark size="lg" centred />

          {/* Hero card */}
          <div className="w-full bg-[#1a3347] rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
            <EricaCircle isActive={true} />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white">Hi {firstName}, I'm Erica</h1>
              <p className="text-sm text-gray-400">AI Recruitment Assistant · Searchline</p>
            </div>
          </div>

          {/* Intro text */}
          <p className="text-center text-white font-medium max-w-md mx-auto leading-relaxed">
            I'll be guiding you through a short pre-screen conversation today. It takes around
            10–15 minutes and you can complete it right now.
          </p>

          {/* Role pill */}
          <div className="bg-[#233D4C] border border-[#2a4a5c] text-white text-sm px-4 py-2 rounded-full mx-auto w-fit">
            You're being considered for:{' '}
            <span className="font-semibold">{roleLabel}</span>
            {' '}at{' '}
            <span className="font-semibold">{companyLabel}</span>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="w-full max-w-sm bg-[#FD802E] hover:bg-[#ff8f45] text-white font-semibold py-4 rounded-xl text-lg transition-colors"
          >
            Let's get started →
          </button>

          {/* Footer */}
          <p className="text-gray-500 text-xs text-center">Confidential · For recruitment purposes only</p>
        </div>
      </PageShell>
    )
  }

  // ── Question flow ─────────────────────────────────────────────────────────
  return (
    <div
      className={`transition-opacity duration-500 ${questionsOpacity ? 'opacity-100' : 'opacity-0'} min-h-screen bg-[#02182B] flex flex-col`}
    >
      {/* Header */}
      <header className="border-b border-[#233D4C] px-6 py-4 flex items-center justify-between">
        <Wordmark />
        <p className="text-gray-500 text-xs hidden sm:block">Confidential — for recruitment purposes only</p>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-[#233D4C]">
        <div
          className="h-full bg-[#FD802E] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="w-full max-w-[640px] space-y-6">

          {/* Question counter */}
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            Question {step + 1} of {payload.questions.length}
          </p>

          {/* Question text */}
          <p className="text-white text-xl font-medium leading-relaxed">{currentQ}</p>

          {/* Answer textarea */}
          <textarea
            key={step}
            value={answers[step] ?? ''}
            onChange={(e) =>
              setAnswers((prev) => { const n = [...prev]; n[step] = e.target.value; return n })
            }
            rows={6}
            placeholder="Type your answer here…"
            className="w-full bg-[#233D4C] border border-[#2a4a5c] rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors resize-none"
          />

          {error && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <span className="flex-shrink-0"><IconAlertCircle size={14} /></span>
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 justify-end">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-5 py-3 text-sm text-gray-400 hover:text-white border border-[#2a4a5c] rounded-xl transition-colors"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !(answers[step] ?? '').trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#FD802E] text-[#02182B] font-bold text-sm rounded-xl hover:bg-[#ff8f45] transition-colors disabled:opacity-50"
              >
                {submitting ? <IconLoaderSm /> : <IconCheckCircle size={14} />}
                {submitting ? 'Submitting…' : 'Submit answers'}
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!(answers[step] ?? '').trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#FD802E] text-[#02182B] font-bold text-sm rounded-xl hover:bg-[#ff8f45] transition-colors disabled:opacity-50"
              >
                Next <IconChevronRight />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile footer */}
      <footer className="px-6 py-4 sm:hidden text-center">
        <p className="text-gray-600 text-xs">Confidential — for recruitment purposes only</p>
      </footer>
    </div>
  )
}
