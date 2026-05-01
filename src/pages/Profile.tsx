/**
 * Profile — CP-6
 *
 * Candidate profile builder.
 * Route: /profile — authenticated (soft-gated: no redirect, just shows logged-out state)
 *
 * Two entry modes:
 *  - Fill in manually
 *  - Talk to Erica (conversational onboarding via EricaIntake modal)
 *
 * No backend calls yet — local state only. Supabase migration pending.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { EricaCircle } from '../components/EricaCircle'
import { EricaIntake } from '../components/EricaIntake'
import type { ParsedProfile } from '../components/EricaIntake'
import { supabase } from '../lib/supabase'
import { CVUpload } from '../components/CVUpload'
import { QualificationsUpload } from '../components/QualificationsUpload'

// ── Constants ─────────────────────────────────────────────────────────────────

const TARGET_ROLE_OPTIONS = ['VP Sales', 'CRO', 'CCO', 'Sales Director', 'Head of Sales']
const SKILL_OPTIONS = [
  'ARR Growth', 'Team Building', 'PLG', 'Outbound Sales', 'MEDDIC', 'MEDDPICC',
  'Channel Sales', 'Enterprise Sales', 'SMB Sales', 'Revenue Operations',
  'Forecasting', 'CRM Management', 'Hiring & Scaling', 'Board Presentations', 'P&L Ownership',
]
const YEARS_OPTIONS   = ['1-3', '3-5', '5-10', '10-15', '15+']
const NOTICE_OPTIONS  = ['Immediate', '1 month', '3 months', 'Negotiable']
const LOOKING_OPTIONS = [
  { value: 'actively',  label: 'Actively Looking',        color: 'bg-green-500/20 border-green-500/60 text-green-400' },
  { value: 'open',      label: 'Open to Right Opportunity', color: 'bg-[#FD802E]/20 border-[#FD802E]/60 text-[#FD802E]' },
  { value: 'not',       label: 'Not Looking',              color: 'bg-gray-500/20 border-gray-500/60 text-gray-400' },
]

// ── Form state type ───────────────────────────────────────────────────────────

export interface ProfileForm {
  fullName:        string
  email:           string
  location:        string
  openToRelocation: boolean
  linkedIn:        string
  currentRole:     string
  currentCompany:  string
  yearsExperience: string
  currentSalary:   string
  currentPackage:  string
  noticePeriod:    string
  targetRoles:     string[]
  idealNextRole:   string
  lookingStatus:   string
  minSalary:       string
  maxSalary:       string
  oteExpectations: string
  skills:          string[]
  cvFileName:        string
  cvUrl:             string
  qualifications:    string
  qualificationUrls: string[]
  bio:               string
}

const emptyForm = (fullName = '', email = ''): ProfileForm => ({
  fullName,
  email,
  location:         '',
  openToRelocation: false,
  linkedIn:         '',
  currentRole:      '',
  currentCompany:   '',
  yearsExperience:  '',
  currentSalary:    '',
  currentPackage:   '',
  noticePeriod:     '',
  targetRoles:      [],
  idealNextRole:    '',
  lookingStatus:    '',
  minSalary:        '',
  maxSalary:        '',
  oteExpectations:  '',
  skills:           [],
  cvFileName:        '',
  cvUrl:             '',
  qualifications:    '',
  qualificationUrls: [],
  bio:               '',
})

// ── Completeness calculation ──────────────────────────────────────────────────

const TRACKED_FIELDS: (keyof ProfileForm)[] = [
  'fullName', 'location', 'linkedIn',
  'currentRole', 'currentCompany', 'yearsExperience', 'currentSalary', 'noticePeriod',
  'idealNextRole', 'lookingStatus',
  'minSalary', 'maxSalary',
  'cvFileName', 'qualifications', 'bio',
]

function computeProgress(form: ProfileForm): number {
  let filled = 0
  for (const key of TRACKED_FIELDS) {
    const v = form[key]
    if (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '') filled++
  }
  // Also count targetRoles + skills
  if (form.targetRoles.length > 0) filled++
  if (form.skills.length > 0)      filled++
  const total = TRACKED_FIELDS.length + 2
  return Math.round((filled / total) * 100)
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputCls = 'w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#FD802E]/60 focus:ring-1 focus:ring-[#FD802E]/20 transition-colors'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const labelCls  = 'block text-gray-300 text-sm font-medium mb-1.5'

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#233D4C] rounded-2xl p-6 space-y-4">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      {children}
    </div>
  )
}

// ── Field row (2-col grid helper) ─────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

// ── Toggle (yes/no) ───────────────────────────────────────────────────────────

function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#2a4a5c]">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            value === v
              ? 'bg-[#FD802E] text-white'
              : 'bg-[#1a3347] text-gray-400 hover:text-white'
          }`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Profile() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const email    = user?.email ?? ''

  const [form,         setForm]         = useState<ProfileForm>(emptyForm(fullName, email))
  const [showErica,    setShowErica]    = useState(false)
  const [saved,        setSaved]        = useState(false)

  // Sync auth metadata into form when user loads
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || fullName,
        email:    email,
      }))
    }
  }, [user])

  const progress = computeProgress(form)

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleArrayItem = (key: 'targetRoles' | 'skills', item: string) => {
    setForm((prev) => {
      const arr = prev[key]
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      }
    })
  }

  const handleEricaComplete = (data: ParsedProfile) => {
    setShowErica(false)
    setForm((prev) => ({
      ...prev,
      currentRole:      data.currentRole      || prev.currentRole,
      currentCompany:   data.currentCompany   || prev.currentCompany,
      yearsExperience:  data.yearsExperience  || prev.yearsExperience,
      currentSalary:    data.currentSalary    || prev.currentSalary,
      currentPackage:   data.currentPackage   || prev.currentPackage,
      targetRoles:      data.targetRoles.length > 0 ? data.targetRoles : prev.targetRoles,
      location:         data.location         || prev.location,
      openToRelocation: data.openToRelocation,
      idealNextRole:    data.idealNextRole    || prev.idealNextRole,
      noticePeriod:     data.noticePeriod     || prev.noticePeriod,
    }))
  }

  const handleSave = async () => {
    setSaved(true)
    // Persist to Supabase — non-blocking, errors are logged but don't break UX
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { error } = await supabase.from('candidate_profiles').upsert({
          user_id: authUser.id,
          full_name: form.fullName,
          email: authUser.email,
          job_title: form.currentRole,
          company_name: form.currentCompany,
          years_experience: form.yearsExperience,
          location: form.location,
          open_to_relocation: form.openToRelocation,
          notice_period: form.noticePeriod,
          target_roles: form.targetRoles,
          ideal_next_role: form.idealNextRole,
          salary_min: form.minSalary,
          salary_max: form.maxSalary,
          current_salary: form.currentSalary,
          current_package: form.currentPackage,
          linkedin_url: form.linkedIn,
          bio: form.bio,
          skills: form.skills,
          qualifications: form.qualifications,
          is_open_to_opportunities: form.lookingStatus,
          cv_url: form.cvUrl || null,
          cv_filename: form.cvFileName || null,
          qualification_urls: form.qualificationUrls.length > 0 ? form.qualificationUrls : null,
          profile_complete_pct: progress,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        if (error) console.error('[profile] Supabase save error:', error)
        else console.log('[profile] Profile saved to Supabase')
      }
    } catch (err) {
      console.error('[profile] Supabase save exception:', err)
    }
  }

  // ── Auth loading ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#02182B] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FD802E] animate-spin">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    )
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#02182B] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <img src="/searchline-logo.jpg" alt="Searchline" className="w-14 h-14 rounded-2xl mx-auto" />
          <h1 className="text-white text-xl font-bold">Sign in to view your profile</h1>
          <p className="text-gray-400 text-sm">You need a Searchline account to build your candidate profile.</p>
          <div className="flex gap-3 justify-center pt-2">
            <Link to="/login"  className="px-5 py-2.5 bg-[#FD802E] text-white font-semibold text-sm rounded-xl hover:bg-[#ff8f45] transition-colors">Sign in</Link>
            <Link to="/signup" className="px-5 py-2.5 border border-[#2a4a5c] text-gray-300 font-medium text-sm rounded-xl hover:text-white transition-colors">Create account</Link>
          </div>
        </div>
      </div>
    )
  }

  const firstName = form.fullName.split(' ')[0] || 'there'

  // ── Saved / done state ───────────────────────────────────────────────────
  if (saved) {
    // Compute missing fields for the completion prompt
    const missingItems = [
      { field: 'currentRole',   label: 'Add your current job title',    benefit: 'Helps Erica understand your background' },
      { field: 'currentSalary', label: 'Add your current salary',       benefit: 'Ensures you only see relevant opportunities' },
      { field: 'minSalary',     label: 'Add your salary expectations',  benefit: 'Filters out roles that don\'t meet your requirements' },
      { field: 'linkedIn',      label: 'Add your LinkedIn profile',     benefit: 'Gives recruiters more context about your experience' },
      { field: 'bio',           label: 'Write a short bio',             benefit: 'Makes your profile stand out to recruiters' },
      { field: 'idealNextRole', label: 'Describe your ideal next role', benefit: 'Erica uses this to match you to the right searches' },
      { field: 'cvFileName',    label: 'Upload your CV',                benefit: 'Required by most recruiters before shortlisting' },
    ].filter((item) => !form[item.field as keyof typeof form])

    return (
      <div className="min-h-screen bg-[#02182B] flex flex-col">
        <Header />
        <main className="flex-1 px-4 py-12">
          <div className="w-full max-w-md mx-auto space-y-6">

            {/* Success icon + heading */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="m9 11 3 3L22 4"/>
                </svg>
              </div>
              <div className="space-y-1">
                <h1 className="text-white text-2xl font-bold">Profile saved!</h1>
                <p className="text-gray-400 text-sm">{progress}% complete</p>
              </div>
            </div>

            {/* Erica completion card */}
            <div className="bg-[#233D4C] border border-[#FD802E]/30 rounded-2xl p-6 flex flex-col items-center gap-4">
              <EricaCircle isActive={false} size="sm" />
              <p className="text-white text-sm leading-relaxed text-center">
                Thanks {firstName} — I've got everything I need. I'll reach out when a search matches what you're looking for. In the meantime, your profile is live and being reviewed.
              </p>
            </div>

            {/* Missing fields card — only shown if profile < 100% */}
            {progress < 100 ? (
              <div className="bg-[#233D4C] rounded-2xl p-5 space-y-4">
                <h2 className="text-white font-semibold text-sm">Complete your profile to get matched faster</h2>
                <div className="space-y-3">
                  {missingItems.map((item) => (
                    <div key={item.field} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Orange dot */}
                        <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-[#FD802E]" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold leading-snug">{item.label}</p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-snug">{item.benefit}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSaved(false)}
                        className="flex-shrink-0 text-[#FD802E] text-sm font-medium hover:underline whitespace-nowrap"
                      >
                        Add →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 flex-shrink-0">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="m9 11 3 3L22 4"/>
                </svg>
                <p className="text-green-400 text-sm font-semibold">Your profile is complete! ✓</p>
              </div>
            )}

            {/* Why complete matters — always shown */}
            <div className="bg-[#0d2535] border border-[#2a4a5c] rounded-2xl p-5 space-y-3">
              <p className="text-white font-semibold text-sm">🎯 Why complete matters</p>
              <ul className="space-y-2">
                {[
                  '8x more likely to be matched to relevant searches',
                  'Recruiters can shortlist you faster',
                  'Erica can pre-screen you for more roles',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#FD802E]" />
                    <span className="text-gray-300 text-sm leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Edit profile link */}
            <div className="text-center pb-4">
              <button
                onClick={() => setSaved(false)}
                className="text-[#FD802E] text-sm hover:underline"
              >
                ← Edit profile
              </button>
            </div>

          </div>
        </main>
      </div>
    )
  }

  // ── Profile form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#02182B] flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">

          {/* Page title + Erica CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-white text-2xl font-bold">Your Profile</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Help us match you to the right opportunities.
              </p>
            </div>
            <button
              onClick={() => navigate('/career-coach')}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#FD802E]/50 bg-[#FD802E]/10 hover:bg-[#FD802E]/20 text-[#FD802E] text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              <EricaCircle isActive={false} size="sm" />
              Talk to Erica
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-[#233D4C] rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">Profile completeness</p>
              <p className="text-[#FD802E] text-sm font-bold">{progress}%</p>
            </div>
            <div className="h-2 bg-[#1a3347] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FD802E] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs">
              {progress < 40
                ? 'Keep going — fill in your experience and goals to stand out.'
                : progress < 80
                ? 'Looking good! A few more details will improve your match quality.'
                : 'Great profile! You\'re ready to be matched.'}
            </p>
          </div>

          {/* Section 1 — Personal Info */}
          <Section title="Personal Info">
            <FieldRow>
              <div>
                <label className={labelCls}>Full Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  className={`${inputCls} opacity-60 cursor-not-allowed`}
                  value={form.email}
                  readOnly
                />
              </div>
            </FieldRow>

            <div>
              <label className={labelCls}>Location</label>
              <input
                type="text"
                className={inputCls}
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="London, UK"
              />
            </div>

            <div>
              <label className={labelCls}>Open to relocation?</label>
              <YesNoToggle
                value={form.openToRelocation}
                onChange={(v) => update('openToRelocation', v)}
              />
            </div>

            <div>
              <label className={labelCls}>LinkedIn URL</label>
              <input
                type="url"
                className={inputCls}
                value={form.linkedIn}
                onChange={(e) => update('linkedIn', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </Section>

          {/* Section 2 — Current Role */}
          <Section title="Current Role">
            <FieldRow>
              <div>
                <label className={labelCls}>Current Job Title</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.currentRole}
                  onChange={(e) => update('currentRole', e.target.value)}
                  placeholder="VP Sales"
                />
              </div>
              <div>
                <label className={labelCls}>Current Company</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.currentCompany}
                  onChange={(e) => update('currentCompany', e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
            </FieldRow>

            <div>
              <label className={labelCls}>Years of Experience</label>
              <select
                className={selectCls}
                value={form.yearsExperience}
                onChange={(e) => update('yearsExperience', e.target.value)}
              >
                <option value="">Select…</option>
                {YEARS_OPTIONS.map((o) => <option key={o} value={o}>{o} years</option>)}
              </select>
            </div>

            <FieldRow>
              <div>
                <label className={labelCls}>Current Base Salary</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.currentSalary}
                  onChange={(e) => update('currentSalary', e.target.value)}
                  placeholder="£120,000"
                />
              </div>
              <div>
                <label className={labelCls}>Full Package</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.currentPackage}
                  onChange={(e) => update('currentPackage', e.target.value)}
                  placeholder="£40k OTE + equity + benefits"
                />
              </div>
            </FieldRow>

            <div>
              <label className={labelCls}>Notice Period</label>
              <select
                className={selectCls}
                value={form.noticePeriod}
                onChange={(e) => update('noticePeriod', e.target.value)}
              >
                <option value="">Select…</option>
                {NOTICE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </Section>

          {/* Section 3 — Career Goals */}
          <Section title="Career Goals">
            <div>
              <label className={labelCls}>Target Roles</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TARGET_ROLE_OPTIONS.map((role) => {
                  const selected = form.targetRoles.includes(role)
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleArrayItem('targetRoles', role)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        selected
                          ? 'bg-[#FD802E] border-[#FD802E] text-white'
                          : 'bg-[#1a3347] border-[#2a4a5c] text-gray-400 hover:text-white hover:border-[#FD802E]/50'
                      }`}
                    >
                      {role}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>Ideal Next Role</label>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={form.idealNextRole}
                onChange={(e) => update('idealNextRole', e.target.value)}
                placeholder="I want to join a Series B SaaS company and build a sales team from scratch…"
              />
            </div>

            <div>
              <label className={labelCls}>Open to Opportunities</label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                {LOOKING_OPTIONS.map(({ value, label, color }) => {
                  const selected = form.lookingStatus === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('lookingStatus', value)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-center ${
                        selected ? color : 'bg-[#1a3347] border-[#2a4a5c] text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* Section 4 — Salary Expectations */}
          <Section title="Salary Expectations">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Minimum Base</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.minSalary}
                  onChange={(e) => update('minSalary', e.target.value)}
                  placeholder="£100,000"
                />
              </div>
              <div>
                <label className={labelCls}>Maximum Base</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.maxSalary}
                  onChange={(e) => update('maxSalary', e.target.value)}
                  placeholder="£160,000"
                />
              </div>
              <div>
                <label className={labelCls}>OTE Expectations</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.oteExpectations}
                  onChange={(e) => update('oteExpectations', e.target.value)}
                  placeholder="£250,000"
                />
              </div>
            </div>
          </Section>

          {/* Section 5 — Skills */}
          <Section title="Skills">
            <div>
              <label className={labelCls}>Select the skills that apply to you</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SKILL_OPTIONS.map((skill) => {
                  const selected = form.skills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleArrayItem('skills', skill)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-[#FD802E] border-[#FD802E] text-white'
                          : 'bg-[#1a3347] border-[#2a4a5c] text-gray-400 hover:text-white hover:border-[#FD802E]/50'
                      }`}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          {/* Section 6 — Documents: CV & Qualifications */}
          <Section title="Documents">
            <div>
              <label className={labelCls}>CV (PDF or DOCX)</label>
              <CVUpload
                existingCvUrl={form.cvUrl || undefined}
                onParsed={(parsedData) =>
                  setForm((prev) => ({ ...prev, ...parsedData }))
                }
              />
            </div>

            <div>
              <label className={labelCls}>Qualification Documents</label>
              <p className="text-gray-500 text-xs mb-2">Upload certificates, diplomas, or other credentials (up to 5 files).</p>
              <QualificationsUpload
                existingUrls={form.qualificationUrls}
                onChange={(urls) => update('qualificationUrls', urls)}
              />
            </div>

            <div>
              <label className={labelCls}>Short Bio</label>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="2–3 sentences about who you are and what you bring to the table…"
              />
            </div>
          </Section>

          {/* Save button */}
          <div className="pb-8">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-4 bg-[#FD802E] hover:bg-[#ff8f45] text-white font-bold text-base rounded-xl transition-colors shadow-lg shadow-[#FD802E]/20"
            >
              Save Profile
            </button>
            <p className="text-center text-gray-600 text-xs mt-3">
              Profile data is securely stored. Searchline will never share your information without your consent.
            </p>
          </div>
        </div>
      </main>

      {/* Erica intake modal */}
      {showErica && (
        <EricaIntake
          onComplete={handleEricaComplete}
          onClose={() => setShowErica(false)}
        />
      )}
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
          <span className="block text-[#FD802E] text-xs font-medium">Executive Search</span>
        </div>
      </div>
      <Link to="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">
        Dashboard
      </Link>
    </header>
  )
}
