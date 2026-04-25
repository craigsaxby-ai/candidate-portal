/**
 * EricaIntake — CP-6
 *
 * Conversational onboarding modal. Erica asks 7 questions one at a time,
 * then parses the answers and pre-fills the Profile form.
 */

import { useState, useEffect, useRef } from 'react'
import { EricaCircle } from './EricaCircle'

export interface ParsedProfile {
  currentRole:     string
  currentCompany:  string
  yearsExperience: string
  currentSalary:   string
  currentPackage:  string
  targetRoles:     string[]
  location:        string
  openToRelocation: boolean
  idealNextRole:   string
  noticePeriod:    string
}

interface EricaIntakeProps {
  onComplete: (data: ParsedProfile) => void
  onClose:    () => void
}

const QUESTIONS = [
  "What's your current job title and company?",
  "How many years of experience do you have in sales leadership?",
  "What's your current base salary and package? (Don't worry — this stays confidential)",
  "What types of roles are you most interested in? For example: VP Sales, CRO, Sales Director?",
  "Where are you based, and are you open to relocation?",
  "What does your ideal next role look like? Tell me anything — stage of company, industry, team size, culture…",
  "What's your notice period?",
]

const TARGET_ROLE_OPTIONS = ['VP Sales', 'CRO', 'CCO', 'Sales Director', 'Head of Sales']
const YEARS_OPTIONS       = ['1-3', '3-5', '5-10', '10-15', '15+']
const NOTICE_OPTIONS      = ['Immediate', '1 month', '3 months', 'Negotiable']

function parseAnswers(answers: string[]): ParsedProfile {
  const [q1, q2, q3, q4, q5, q6, q7] = answers

  // Q1 — "VP Sales at Acme Corp" → split on " at " or just use whole as title
  let currentRole    = ''
  let currentCompany = ''
  if (q1) {
    const atIdx = q1.toLowerCase().indexOf(' at ')
    if (atIdx !== -1) {
      currentRole    = q1.slice(0, atIdx).trim()
      currentCompany = q1.slice(atIdx + 4).trim()
    } else {
      currentRole = q1.trim()
    }
  }

  // Q2 — years: find first matching bucket
  let yearsExperience = ''
  if (q2) {
    const n = parseInt(q2.match(/\d+/)?.[0] ?? '', 10)
    if (!isNaN(n)) {
      if (n < 3)       yearsExperience = '1-3'
      else if (n < 5)  yearsExperience = '3-5'
      else if (n < 10) yearsExperience = '5-10'
      else if (n < 15) yearsExperience = '10-15'
      else             yearsExperience = '15+'
    }
    // fallback: check if they literally said one of the options
    for (const opt of YEARS_OPTIONS) {
      if (q2.includes(opt)) { yearsExperience = opt; break }
    }
  }

  // Q3 — salary / package: try to split on "and" or "+"
  let currentSalary  = ''
  let currentPackage = ''
  if (q3) {
    const andIdx = q3.toLowerCase().indexOf(' and ')
    if (andIdx !== -1) {
      currentSalary  = q3.slice(0, andIdx).trim()
      currentPackage = q3.slice(andIdx + 5).trim()
    } else {
      currentSalary = q3.trim()
    }
  }

  // Q4 — target roles: check which known roles appear in the answer
  const targetRoles: string[] = []
  if (q4) {
    for (const role of TARGET_ROLE_OPTIONS) {
      if (q4.toLowerCase().includes(role.toLowerCase())) {
        targetRoles.push(role)
      }
    }
  }

  // Q5 — location + relocation
  let location         = ''
  let openToRelocation = false
  if (q5) {
    const lower = q5.toLowerCase()
    openToRelocation = lower.includes('yes') || lower.includes('open') || lower.includes('happy') || lower.includes('willing')
    // Strip relocation parts: look for "based in X" or just take the sentence up to any comma
    const basedIdx = lower.indexOf('based in ')
    if (basedIdx !== -1) {
      const rest = q5.slice(basedIdx + 9)
      location = rest.split(/[,\.]/)[0].trim()
    } else {
      // Just take up to the first comma / period as location hint
      location = q5.split(/[,\.]/)[0].trim()
    }
  }

  // Q6 — ideal next role: use as-is
  const idealNextRole = q6?.trim() ?? ''

  // Q7 — notice period: match known options
  let noticePeriod = ''
  if (q7) {
    const lower = q7.toLowerCase()
    if (lower.includes('immediately') || lower.includes('immediate') || lower.includes('available now')) {
      noticePeriod = 'Immediate'
    } else if (lower.includes('3 month') || lower.includes('three month') || lower.includes('90')) {
      noticePeriod = '3 months'
    } else if (lower.includes('1 month') || lower.includes('one month') || lower.includes('30')) {
      noticePeriod = '1 month'
    } else if (lower.includes('negotiable') || lower.includes('flexible')) {
      noticePeriod = 'Negotiable'
    } else {
      // check for notice options literally
      for (const opt of NOTICE_OPTIONS) {
        if (lower.includes(opt.toLowerCase())) { noticePeriod = opt; break }
      }
    }
  }

  return {
    currentRole,
    currentCompany,
    yearsExperience,
    currentSalary,
    currentPackage,
    targetRoles,
    location,
    openToRelocation,
    idealNextRole,
    noticePeriod,
  }
}

export function EricaIntake({ onComplete, onClose }: EricaIntakeProps) {
  const [step,       setStep]       = useState(0)
  const [answers,    setAnswers]    = useState<string[]>(new Array(QUESTIONS.length).fill(''))
  const [gotIt,      setGotIt]      = useState(false)   // show "Got it." before next Q
  const [finishing,  setFinishing]  = useState(false)   // final "Perfect…" message
  const [visible,    setVisible]    = useState(false)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Focus textarea when step changes
  useEffect(() => {
    if (!gotIt && !finishing) {
      textareaRef.current?.focus()
    }
  }, [step, gotIt, finishing])

  const currentAnswer = answers[step] ?? ''
  const isLast        = step === QUESTIONS.length - 1

  const handleNext = () => {
    if (!currentAnswer.trim()) return

    setGotIt(true)
    setTimeout(() => {
      setGotIt(false)
      if (isLast) {
        setFinishing(true)
        // After "Perfect…" message show for 1.8s, parse & close
        setTimeout(() => {
          const parsed = parseAnswers(answers)
          onComplete(parsed)
        }, 1800)
      } else {
        setStep((s) => s + 1)
      }
    }, 900)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-lg bg-[#02182B] border border-[#233D4C] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#233D4C]">
          <div className="flex items-center gap-3">
            <EricaCircle isActive={!finishing} size="sm" />
            <div>
              <p className="text-white font-semibold text-sm">Erica</p>
              <p className="text-gray-500 text-xs">AI Recruitment Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-6 py-3">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                i < step  ? 'bg-[#FD802E]' :
                i === step ? 'bg-[#FD802E]/60' :
                'bg-[#233D4C]'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto space-y-5">

          {/* Erica's question / message */}
          <div className="bg-[#233D4C] rounded-2xl rounded-tl-sm px-4 py-3.5">
            {finishing ? (
              <p className="text-white text-sm leading-relaxed">
                Perfect — I've got what I need. Let me fill in your profile. ✨
              </p>
            ) : gotIt ? (
              <p className="text-white text-sm leading-relaxed">Got it. 👍</p>
            ) : (
              <p className="text-white text-sm leading-relaxed">{QUESTIONS[step]}</p>
            )}
          </div>

          {/* Answer input (hidden during "Got it." / finishing) */}
          {!gotIt && !finishing && (
            <>
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => {
                  const val = e.target.value
                  setAnswers((prev) => { const n = [...prev]; n[step] = val; return n })
                }}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Type your answer… (Enter to continue)"
                className="w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors resize-none"
              />

              <div className="flex items-center justify-between">
                <p className="text-gray-600 text-xs">
                  {step + 1} of {QUESTIONS.length}
                </p>
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FD802E] text-[#02182B] font-bold text-sm rounded-xl hover:bg-[#ff8f45] transition-colors disabled:opacity-40"
                >
                  {isLast ? 'Done' : 'Next'}
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
