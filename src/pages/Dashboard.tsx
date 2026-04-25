/**
 * Dashboard — CP-7
 *
 * Candidate home screen — what a logged-in candidate sees after signing in.
 * Route: /dashboard — auth-guarded (redirects to /login if not authenticated).
 *
 * Sections:
 *  1. Sticky header with logo + sign out
 *  2. Welcome card with profile completeness nudge
 *  3. My Applications (empty state + prepared list UI)
 *  4. Open to Opportunities quick toggle
 *  5. Quick links row
 *  6. Footer
 *
 * No backend calls — local state + mock data only. Supabase migration pending.
 */

import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EricaCircle } from '../components/EricaCircle'
import searchlineLogo from '../assets/searchline-logo.jpg'

// ── Types ─────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | 'pre-screen-complete'
  | 'under-review'
  | 'shortlisted'
  | 'not-progressed'

interface Application {
  id: string
  roleTitle: string
  company: string
  dateApplied: string
  preScreenCompleted: string | null
  status: ApplicationStatus
  ericaSnippet?: string
}

// ── Mock data (empty — ready to populate) ────────────────────────────────────

const MOCK_APPLICATIONS: Application[] = []

// ── Status pill config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  'pre-screen-complete': {
    label: 'Pre-Screen Complete',
    className: 'bg-green-500/20 border border-green-500/50 text-green-400',
  },
  'under-review': {
    label: 'Under Review',
    className: 'bg-[#FD802E]/20 border border-[#FD802E]/50 text-[#FD802E]',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-purple-500/20 border border-purple-500/50 text-purple-400',
  },
  'not-progressed': {
    label: 'Not Progressed',
    className: 'bg-gray-500/20 border border-gray-500/50 text-gray-400',
  },
}

// ── Looking status config ─────────────────────────────────────────────────────

type LookingStatus = 'actively' | 'open' | 'not'

const LOOKING_CONFIG: Record<
  LookingStatus,
  { label: string; className: string; visible: boolean }
> = {
  actively: {
    label: 'Actively Looking',
    className: 'bg-green-500/20 border border-green-500/50 text-green-400',
    visible: true,
  },
  open: {
    label: 'Open to Right Opportunity',
    className: 'bg-[#FD802E]/20 border border-[#FD802E]/50 text-[#FD802E]',
    visible: true,
  },
  not: {
    label: 'Not Looking',
    className: 'bg-gray-500/20 border border-gray-500/50 text-gray-400',
    visible: false,
  },
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
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

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ firstName, onSignOut }: { firstName: string; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#233D4C] bg-[#02182B] px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img
          src={searchlineLogo}
          alt="Searchline"
          className="w-8 h-8 rounded-lg flex-shrink-0"
        />
        <span className="text-white font-bold text-base leading-none">Searchline</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-300 font-medium hidden sm:block">{firstName}</span>
        <button
          onClick={onSignOut}
          className="text-gray-500 hover:text-[#FD802E] transition-colors text-sm"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

// ── Welcome card ──────────────────────────────────────────────────────────────

function WelcomeCard({
  firstName,
  profileComplete,
}: {
  firstName: string
  profileComplete: boolean
}) {
  return (
    <div className="bg-[#233D4C] rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-white text-xl font-bold truncate">
          Welcome back, {firstName} 👋
        </h1>

        {profileComplete ? (
          <p className="text-gray-300 text-sm mt-1.5 leading-relaxed">
            Your profile is active and being reviewed by our team.
          </p>
        ) : (
          <div className="mt-2 space-y-2.5">
            <p className="text-gray-300 text-sm leading-relaxed">
              Your profile is incomplete — complete it to improve your match rate.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FD802E] hover:bg-[#ff8f45] text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Complete Profile →
            </Link>
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <EricaCircle isActive={false} size="sm" />
      </div>
    </div>
  )
}

// ── Application card ──────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
  const status = STATUS_CONFIG[app.status]
  return (
    <div className="bg-[#1a3347] rounded-xl p-4 space-y-2.5 border border-[#2a4a5c]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{app.roleTitle}</p>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{app.company}</p>
        </div>
        <span
          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Applied {app.dateApplied}</span>
        {app.preScreenCompleted && (
          <span>Pre-screen {app.preScreenCompleted}</span>
        )}
      </div>

      {app.ericaSnippet && (
        <div className="flex items-start gap-2 pt-1">
          <EricaCircle isActive={false} size="sm" />
          <p className="text-gray-300 text-xs leading-relaxed italic">
            "{app.ericaSnippet}"
          </p>
        </div>
      )}
    </div>
  )
}

// ── Applications section ──────────────────────────────────────────────────────

function ApplicationsSection() {
  return (
    <div className="space-y-3">
      <h2 className="text-white font-semibold text-base px-1">My Applications</h2>

      {MOCK_APPLICATIONS.length === 0 ? (
        // Empty state
        <div className="bg-[#233D4C] rounded-2xl p-8 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1a3347] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">No applications yet</p>
            <p className="text-gray-400 text-xs mt-1.5 max-w-xs leading-relaxed">
              When a recruiter matches you to a search and you complete a
              pre-screen, your applications will appear here.
            </p>
          </div>
        </div>
      ) : (
        // Application list
        <div className="space-y-3">
          {MOCK_APPLICATIONS.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Opportunities toggle card ─────────────────────────────────────────────────

function OpportunitiesCard({ lookingStatus }: { lookingStatus: LookingStatus }) {
  const config = LOOKING_CONFIG[lookingStatus]
  return (
    <div className="bg-[#233D4C] rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-white font-semibold text-base">Open to Opportunities</h2>
        <Link
          to="/profile#status"
          className="px-3.5 py-1.5 border border-[#2a4a5c] hover:border-[#FD802E]/50 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex-shrink-0"
        >
          Update
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      <p className="text-gray-400 text-xs">
        Your visibility to recruiters is{' '}
        <span
          className={config.visible ? 'text-green-400 font-semibold' : 'text-gray-500 font-semibold'}
        >
          {config.visible ? 'ON' : 'OFF'}
        </span>{' '}
        based on your status.
      </p>
    </div>
  )
}

// ── Quick links ───────────────────────────────────────────────────────────────

function QuickLinks() {
  const links = [
    {
      label: 'My Profile',
      sub: 'View and edit your profile',
      to: '/profile',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: 'Pre-Screen History',
      sub: 'Review past interviews',
      to: '/profile',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      ),
    },
    {
      label: 'Get matched faster',
      sub: 'Complete your profile and add skills to increase your match rate',
      to: '/profile',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-white font-semibold text-base px-1">Quick Links</h2>
      <div className="grid grid-cols-1 gap-3">
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="bg-[#233D4C] hover:bg-[#2a4a5c] rounded-2xl p-4 flex items-center gap-4 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1a3347] flex items-center justify-center text-[#FD802E] flex-shrink-0 group-hover:bg-[#FD802E]/10 transition-colors">
              {link.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm">{link.label} →</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{link.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-8 text-center">
      <p className="text-gray-600 text-xs">Powered by Searchline AI</p>
    </footer>
  )
}

// ── Dashboard (main export) ───────────────────────────────────────────────────

export function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [loading, user, navigate])

  if (loading) return <Spinner />
  if (!user) return null // redirecting

  // Derive display values
  const fullName: string =
    (user.user_metadata?.full_name as string | undefined) ?? ''
  const firstName = fullName.split(' ')[0] || user.email?.split('@')[0] || 'there'

  // Profile completeness — stub until Supabase migration lands
  // For now: always incomplete (no profile data in DB yet)
  const profileComplete = false

  // Looking status — stub, defaults to 'open' until stored in Supabase
  const lookingStatus: LookingStatus = 'open'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#02182B] flex flex-col">
      <Header firstName={firstName} onSignOut={handleSignOut} />

      <main className="flex-1 px-4 py-6">
        <div className="w-full max-w-xl mx-auto space-y-6">
          <WelcomeCard firstName={firstName} profileComplete={profileComplete} />
          <ApplicationsSection />
          <OpportunitiesCard lookingStatus={lookingStatus} />
          <QuickLinks />
        </div>
      </main>

      <Footer />
    </div>
  )
}
