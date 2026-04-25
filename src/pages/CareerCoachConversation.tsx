/**
 * CareerCoachConversation — CP-11
 *
 * Erica Career Coach conversation flow for the Candidate Portal.
 * Route: /career-coach/conversation — auth-guarded.
 *
 * State machine: intro → question → acknowledging → summary → complete
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EricaCircle } from '../components/EricaCircle'
import searchlineLogo from '../assets/searchline-logo.jpg'

// ── Question config ────────────────────────────────────────────────────────────

interface CareerCoachQuestion {
  id: string
  section: string
  sectionIntro?: string
  question: string
  acknowledgements: string[]
  placeholder: string
}

const CAREER_COACH_QUESTIONS: CareerCoachQuestion[] = [
  {
    id: 'role_goals_1',
    section: 'Role Goals',
    question: "Let's start with where you want to go. What does your ideal next role look like — in terms of title, scope, and the kind of impact you want to have?",
    acknowledgements: ["That's really helpful context, thank you.", "Got it — that makes a lot of sense."],
    placeholder: "E.g. I want to move into a CRO role at a Series B SaaS company where I can own the full revenue function...",
  },
  {
    id: 'role_goals_2',
    section: 'Role Goals',
    question: "Where do you see yourself in 3 years? Are you building towards a specific title — CRO, CCO — or is it more about the type of company and challenge?",
    acknowledgements: ["Perfect, that really helps me understand your direction.", "Great — I've got a clear picture of where you're heading."],
    placeholder: "E.g. I want to be a CRO at a growth-stage company, ideally having taken them from Series B to Series C...",
  },
  {
    id: 'culture_1',
    section: 'Culture Fit',
    question: "Tell me about the work environments where you've done your best work. What does a great company culture look like to you?",
    acknowledgements: ["That's useful — culture fit is so important to get right.", "Got it — I'll keep that in mind when matching you."],
    placeholder: "E.g. I thrive in high-autonomy environments with a strong founder, where I can build and own my function...",
  },
  {
    id: 'culture_2',
    section: 'Culture Fit',
    question: "How do you like to work with leadership — do you prefer autonomy and ownership, or do you thrive with strong structure and direction?",
    acknowledgements: ["Noted — that's a really important preference to know.", "Perfect — that helps me filter out the wrong environments for you."],
    placeholder: "E.g. I prefer being given a clear goal and the autonomy to decide how to get there...",
  },
  {
    id: 'location',
    section: 'Location & Work Style',
    question: "Practically speaking — where are you based, and what's your flexibility around location? Are you open to relocation, or looking for remote or hybrid?",
    acknowledgements: ["Got it — I'll only surface roles that match your location preferences.", "Perfect — location sorted."],
    placeholder: "E.g. Based in London, open to hybrid but not full relocation. Happy to travel for the right role...",
  },
  {
    id: 'compensation_1',
    section: 'Compensation',
    sectionIntro: "This stays completely confidential — I just want to make sure I'm not wasting your time with roles that don't meet your expectations.",
    question: "What are you targeting in terms of base salary and total package for your next role?",
    acknowledgements: ["Thanks for sharing that — it really helps me filter properly.", "Got it — I'll make sure every opportunity I surface meets that threshold."],
    placeholder: "E.g. Looking for £150k base, £200k OTE, plus equity at Series B or later...",
  },
  {
    id: 'compensation_2',
    section: 'Compensation',
    question: "Beyond base salary — what else matters to you in a package? Equity, bonus structure, flexibility, benefits?",
    acknowledgements: ["That's all really useful context.", "Perfect — I've got a complete picture of what matters to you."],
    placeholder: "E.g. Equity is important to me at this stage, meaningful options package. Flexibility to work remotely 2-3 days...",
  },
]

// Section order for summary grouping
const SUMMARY_SECTIONS = [
  {
    label: 'Role Goals',
    ids: ['role_goals_1', 'role_goals_2'],
  },
  {
    label: 'Culture Fit',
    ids: ['culture_1', 'culture_2'],
  },
  {
    label: 'Location & Work Style',
    ids: ['location'],
  },
  {
    label: 'Compensation',
    ids: ['compensation_1', 'compensation_2'],
  },
]

// ── Inline SVG icons ───────────────────────────────────────────────────────────

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconCheckCircle({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-[#FD802E] animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ── State types ────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'intro' | 'question' | 'acknowledging' | 'summary' | 'complete'

// ── Section label helper ───────────────────────────────────────────────────────

function getSectionLabel(q: CareerCoachQuestion, allQuestions: CareerCoachQuestion[]): string {
  const sectionQs = allQuestions.filter((x) => x.section === q.section)
  const indexInSection = sectionQs.findIndex((x) => x.id === q.id) + 1
  return `${q.section} · ${indexInSection} of ${sectionQs.length}`
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CareerCoachConversation() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  const firstName =
    ((user?.user_metadata?.full_name as string | undefined) ?? '').split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'

  // ── Page state ──────────────────────────────────────────────────────────────
  const [pageState, setPageState]           = useState<PageState>('loading')
  const [visible, setVisible]               = useState(false)   // fade control
  const [questionIndex, setQuestionIndex]   = useState(0)
  const [answers, setAnswers]               = useState<Record<string, string>>({})
  const [currentDraft, setCurrentDraft]     = useState('')
  const [acknowledgement, setAcknowledgement] = useState('')
  const ackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialise once auth resolves
  useEffect(() => {
    if (!authLoading && user) {
      setPageState('intro')
      setTimeout(() => setVisible(true), 50)
    }
  }, [authLoading, user])

  // ── Transitions ─────────────────────────────────────────────────────────────

  function fadeTo(next: () => void) {
    setVisible(false)
    setTimeout(() => {
      next()
      setTimeout(() => setVisible(true), 50)
    }, 400)
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleStart() {
    fadeTo(() => {
      setQuestionIndex(0)
      setCurrentDraft('')
      setPageState('question')
    })
  }

  function handleNext() {
    const q = CAREER_COACH_QUESTIONS[questionIndex]
    const trimmed = currentDraft.trim()
    if (!trimmed) return

    // Save answer
    const updatedAnswers = { ...answers, [q.id]: trimmed }
    setAnswers(updatedAnswers)

    // Pick random acknowledgement
    const ack = q.acknowledgements[Math.floor(Math.random() * q.acknowledgements.length)]
    setAcknowledgement(ack)

    fadeTo(() => setPageState('acknowledging'))

    // After 1.5s, advance
    if (ackTimer.current) clearTimeout(ackTimer.current)
    ackTimer.current = setTimeout(() => {
      const isLast = questionIndex === CAREER_COACH_QUESTIONS.length - 1
      fadeTo(() => {
        if (isLast) {
          setPageState('summary')
        } else {
          setQuestionIndex((i) => i + 1)
          setCurrentDraft('')
          setPageState('question')
        }
      })
    }, 1900) // 400ms fade-out + 1500ms display = 1900ms total before fade-out starts
  }

  function handleReviewAnswers() {
    fadeTo(() => {
      setQuestionIndex(0)
      setCurrentDraft(answers[CAREER_COACH_QUESTIONS[0].id] ?? '')
      setPageState('question')
    })
  }

  function handleConfirm() {
    console.log('[CP-11] Career Coach answers:', answers)
    fadeTo(() => setPageState('complete'))
  }

  // Update draft when navigating back to a question
  useEffect(() => {
    if (pageState === 'question') {
      const q = CAREER_COACH_QUESTIONS[questionIndex]
      setCurrentDraft(answers[q.id] ?? '')
    }
  }, [questionIndex, pageState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup ack timer on unmount
  useEffect(() => {
    return () => { if (ackTimer.current) clearTimeout(ackTimer.current) }
  }, [])

  // ── Loading guard ────────────────────────────────────────────────────────────

  if (authLoading || pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#02182B] flex items-center justify-center">
        <IconSpinner />
      </div>
    )
  }

  const progress = ((questionIndex + 1) / CAREER_COACH_QUESTIONS.length) * 100

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#02182B] flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-[#233D4C] bg-[#02182B] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={searchlineLogo} alt="Searchline" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <span className="text-white font-bold text-base leading-none">Searchline</span>
        </div>
        <span className="text-gray-500 text-xs hidden sm:block">Career Coach · Confidential</span>
      </header>

      {/* Progress bar (visible during question + acknowledging) */}
      {(pageState === 'question' || pageState === 'acknowledging') && (
        <div className="h-1 bg-[#233D4C]">
          <div
            className="h-full bg-[#FD802E] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div
          className={`w-full max-w-[640px] transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >

          {/* ── INTRO ── */}
          {pageState === 'intro' && (
            <div className="flex flex-col items-center gap-8 text-center">
              {/* Hero card */}
              <div className="w-full bg-[#1a3347] rounded-2xl p-8 flex flex-col items-center gap-5">
                <EricaCircle isActive={true} size="lg" />
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-white">Hi {firstName} — I'm Erica</h1>
                  <p className="text-sm text-gray-400">Career Coach · Searchline</p>
                </div>
              </div>

              {/* Intro text */}
              <p className="text-white font-medium leading-relaxed text-center max-w-md mx-auto">
                I'd love to spend 10–15 minutes getting to know your career goals so I can match you
                with the right opportunities. There are no right or wrong answers — just be yourself.
              </p>

              {/* CTA */}
              <button
                onClick={handleStart}
                className="w-full max-w-sm bg-[#FD802E] hover:bg-[#ff8f45] text-white font-semibold py-4 rounded-xl text-lg transition-colors"
              >
                Let's begin →
              </button>

              <p className="text-gray-600 text-xs">Confidential · For matching purposes only</p>
            </div>
          )}

          {/* ── QUESTION ── */}
          {pageState === 'question' && (() => {
            const q = CAREER_COACH_QUESTIONS[questionIndex]
            const sectionLabel = getSectionLabel(q, CAREER_COACH_QUESTIONS)
            const isEmpty = !currentDraft.trim()
            return (
              <div className="space-y-6">
                {/* Section label */}
                <p className="text-[#FD802E] text-xs font-semibold uppercase tracking-wider">
                  {sectionLabel}
                </p>

                {/* Section intro card */}
                {q.sectionIntro && (
                  <div className="bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3">
                    <p className="text-gray-400 text-sm italic leading-relaxed">{q.sectionIntro}</p>
                  </div>
                )}

                {/* Question */}
                <p className="text-white text-xl font-medium leading-relaxed">{q.question}</p>

                {/* Textarea */}
                <textarea
                  key={q.id}
                  value={currentDraft}
                  onChange={(e) => setCurrentDraft(e.target.value)}
                  rows={6}
                  placeholder={q.placeholder}
                  className="w-full bg-[#233D4C] border border-[#2a4a5c] rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors resize-none"
                />

                {/* Navigation */}
                <div className="flex gap-3 justify-end">
                  {questionIndex > 0 && (
                    <button
                      onClick={() => fadeTo(() => {
                        setQuestionIndex((i) => i - 1)
                        setPageState('question')
                      })}
                      className="flex items-center gap-1.5 px-5 py-3 text-sm text-gray-400 hover:text-white border border-[#2a4a5c] rounded-xl transition-colors"
                    >
                      <IconChevronLeft /> Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={isEmpty}
                    className="flex items-center gap-1.5 px-6 py-3 bg-[#FD802E] text-[#02182B] font-bold text-sm rounded-xl hover:bg-[#ff8f45] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <IconChevronRight />
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── ACKNOWLEDGING ── */}
          {pageState === 'acknowledging' && (
            <div className="flex flex-col items-center gap-8 text-center">
              <EricaCircle isActive={true} size="md" />
              <p className="text-white text-xl font-medium leading-relaxed max-w-md">{acknowledgement}</p>
              <p className="text-gray-500 text-sm">Moving on…</p>
            </div>
          )}

          {/* ── SUMMARY ── */}
          {pageState === 'summary' && (
            <div className="space-y-8">
              {/* Erica summary header */}
              <div className="flex flex-col items-center gap-4 text-center">
                <EricaCircle isActive={false} size="md" />
                <p className="text-white text-xl font-medium max-w-md leading-relaxed">
                  Thanks {firstName} — here's what I've learned about you:
                </p>
              </div>

              {/* Summary card */}
              <div className="bg-[#1a3347] border border-[#2a4a5c] rounded-2xl divide-y divide-[#233D4C]">
                {SUMMARY_SECTIONS.map((section) => {
                  const sectionAnswers = section.ids
                    .map((id) => answers[id])
                    .filter(Boolean)
                  if (sectionAnswers.length === 0) return null
                  return (
                    <div key={section.label} className="px-5 py-4 space-y-2">
                      <p className="text-[#FD802E] text-xs font-semibold uppercase tracking-wider">
                        {section.label}
                      </p>
                      {sectionAnswers.map((ans, i) => (
                        <p key={i} className="text-gray-300 text-sm leading-relaxed">{ans}</p>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Confirmation text */}
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                Does this accurately reflect what you're looking for? You can go back to adjust any
                answers, or confirm to update your profile.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleReviewAnswers}
                  className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3.5 text-sm text-gray-300 hover:text-white border border-[#2a4a5c] hover:border-gray-500 rounded-xl transition-colors font-medium"
                >
                  <IconChevronLeft /> Review my answers
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3.5 bg-[#FD802E] hover:bg-[#ff8f45] text-[#02182B] font-bold text-sm rounded-xl transition-colors"
                >
                  Confirm &amp; update profile <IconChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* ── COMPLETE ── */}
          {pageState === 'complete' && (
            <div className="flex flex-col items-center gap-8 text-center">
              {/* Green checkmark */}
              <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center">
                <span className="text-green-400"><IconCheckCircle size={44} /></span>
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-white text-2xl font-bold">Profile updated!</h1>
              </div>

              {/* Erica message */}
              <div className="bg-[#1a3347] border border-[#2a4a5c] rounded-2xl px-6 py-5 max-w-md">
                <p className="text-gray-300 text-sm leading-relaxed italic">
                  "Perfect — I've got everything I need. I'll reach out when a search matches what
                  you're looking for. In the meantime, your profile is active and I'll be keeping
                  an eye out for you."
                </p>
                <p className="mt-3 text-[#FD802E] text-xs font-semibold">— Erica, Career Coach</p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Link
                  to="/profile"
                  className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3.5 bg-[#FD802E] hover:bg-[#ff8f45] text-[#02182B] font-bold text-sm rounded-xl transition-colors"
                >
                  View my profile <IconChevronRight />
                </Link>
                <Link
                  to="/dashboard"
                  className="flex-1 flex items-center justify-center px-5 py-3.5 text-sm text-gray-300 hover:text-white border border-[#2a4a5c] hover:border-gray-500 rounded-xl transition-colors font-medium"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
