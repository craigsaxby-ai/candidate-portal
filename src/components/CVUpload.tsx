/**
 * CVUpload — CP-6c
 *
 * Drag-and-drop CV upload (PDF / DOCX, max 5 MB).
 * Uploads to Supabase Storage bucket `candidate-docs`.
 * After upload, calls the parse stub and fires `onParsed` with any extracted fields.
 */

import { useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { parseCVText } from '../lib/parseCV'
import type { ProfileForm } from '../pages/Profile'

interface CVUploadProps {
  onParsed: (data: Partial<ProfileForm>) => void
  existingCvUrl?: string
}

const ACCEPTED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CVUpload({ onParsed, existingCvUrl }: CVUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pending,  setPending]  = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded]  = useState<{ name: string; url: string } | null>(
    existingCvUrl ? { name: 'CV on file', url: existingCvUrl } : null
  )
  const [error, setError] = useState<string | null>(null)

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return 'Only PDF or DOCX files are accepted.'
    if (file.size > MAX_BYTES) return `File is too large (max 5 MB). Yours is ${formatBytes(file.size)}.`
    return null
  }

  // ── File selection ──────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    setError(null)
    const err = validate(file)
    if (err) { setError(err); return }
    setPending(file)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // ── Drag-and-drop ───────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pending) return
    setUploading(true)
    setError(null)

    try {
      // Resolve user ID
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? crypto.randomUUID()

      const timestamp = Date.now()
      const safeName  = pending.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path      = `${userId}/${timestamp}-cv-${safeName}`

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('candidate-docs')
        .upload(path, pending, { upsert: true, contentType: pending.type })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('candidate-docs')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl

      setUploaded({ name: pending.name, url: publicUrl })
      setPending(null)

      // Parse stub — fire onParsed with extracted (or empty) data + cv metadata
      const parsed = await parseCVText(pending.name, pending.size)
      onParsed({
        ...parsed,
        cvFileName: pending.name,
        cvUrl:      publicUrl,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(msg)
      console.error('[CVUpload] Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // ── Remove / replace ────────────────────────────────────────────────────
  const handleRemove = () => {
    setUploaded(null)
    setPending(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onParsed({ cvFileName: '', cvUrl: '' })
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const inputCls = 'w-full bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-4 py-3 text-white text-sm'

  if (uploaded) {
    return (
      <div className={`${inputCls} flex items-center justify-between border-[#FD802E]/40`}>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="text-green-400 flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
          <span className="text-white text-sm font-medium">✓ CV uploaded</span>
          <span className="text-gray-400 text-sm truncate max-w-[160px]">{uploaded.name}</span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-gray-500 hover:text-white text-xs transition-colors ml-2 flex-shrink-0"
        >
          Remove / Replace
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl px-4 py-8 text-center transition-colors cursor-pointer group select-none ${
          dragOver
            ? 'border-[#FD802E]/70 bg-[#FD802E]/5'
            : pending
            ? 'border-[#FD802E]/40 bg-[#1a3347]'
            : 'border-[#2a4a5c] hover:border-[#FD802E]/50 bg-transparent'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleInputChange}
        />

        {pending ? (
          <div className="space-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                 className="text-[#FD802E] mx-auto mb-2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-white text-sm font-medium">{pending.name}</p>
            <p className="text-gray-500 text-xs">{formatBytes(pending.size)}</p>
            <p className="text-gray-600 text-xs mt-1">Click to change file</p>
          </div>
        ) : (
          <div className="space-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                 className="text-gray-500 group-hover:text-[#FD802E] mx-auto mb-2 transition-colors">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-gray-400 text-sm group-hover:text-white transition-colors">
              Drag &amp; drop your CV here
            </p>
            <p className="text-gray-600 text-xs">or click to browse · PDF or DOCX · max 5 MB</p>
          </div>
        )}
      </div>

      {/* Upload button — only shown after file selection */}
      {pending && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 bg-[#FD802E] hover:bg-[#ff8f45] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Uploading…
            </>
          ) : (
            'Upload CV'
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs leading-snug">{error}</p>
      )}
    </div>
  )
}
