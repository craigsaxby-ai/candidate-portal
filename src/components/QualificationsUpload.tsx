/**
 * QualificationsUpload — CP-6c
 *
 * Multi-file upload for qualification documents (certificates, diplomas, etc.)
 * Accepts PDF, DOCX, PNG, JPG — up to 5 files — max 5 MB each.
 * Uploads to Supabase Storage bucket `candidate-docs`.
 */

import { useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface UploadedFile {
  name:     string
  url:      string
  type:     string
  uploading?: boolean
}

interface QualificationsUploadProps {
  onChange: (urls: string[]) => void
  existingUrls?: string[]
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]
const MAX_BYTES  = 5 * 1024 * 1024 // 5 MB
const MAX_FILES  = 5

function fileBadge(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX'
  if (mimeType === 'image/png')  return 'PNG'
  if (mimeType === 'image/jpeg') return 'JPG'
  return 'FILE'
}

function badgeColour(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'bg-red-500/20 text-red-400'
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return 'bg-blue-500/20 text-blue-400'
  return 'bg-gray-500/20 text-gray-400'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function QualificationsUpload({ onChange, existingUrls = [] }: QualificationsUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files,    setFiles]    = useState<UploadedFile[]>(
    existingUrls.map((url) => ({ name: url.split('/').pop() ?? 'document', url, type: 'application/pdf' }))
  )
  const [error, setError] = useState<string | null>(null)

  const notifyParent = (updated: UploadedFile[]) => {
    onChange(updated.filter((f) => f.url && !f.uploading).map((f) => f.url))
  }

  // ── Upload a single file ─────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    // Validate
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`"${file.name}" is not a supported file type (PDF, DOCX, PNG, JPG).`)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" exceeds the 5 MB limit (${formatBytes(file.size)}).`)
      return
    }

    // Add placeholder
    const placeholder: UploadedFile = { name: file.name, url: '', type: file.type, uploading: true }
    setFiles((prev) => {
      const next = [...prev, placeholder]
      return next
    })
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId    = user?.id ?? crypto.randomUUID()
      const timestamp = Date.now()
      const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path      = `${userId}/${timestamp}-qual-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('candidate-docs')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('candidate-docs')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl

      setFiles((prev) => {
        const updated = prev.map((f) =>
          f === placeholder || (f.name === file.name && f.uploading)
            ? { name: file.name, url: publicUrl, type: file.type, uploading: false }
            : f
        )
        notifyParent(updated)
        return updated
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      setError(`Failed to upload "${file.name}": ${msg}`)
      // Remove placeholder
      setFiles((prev) => prev.filter((f) => f !== placeholder))
      console.error('[QualificationsUpload] Upload error:', err)
    }
  }, [])

  // ── Handle dropped / selected files ─────────────────────────────────────
  const handleFiles = useCallback((incoming: FileList) => {
    const remaining = MAX_FILES - files.length
    if (remaining <= 0) {
      setError(`Maximum ${MAX_FILES} files allowed.`)
      return
    }
    const toUpload = Array.from(incoming).slice(0, remaining)
    toUpload.forEach((f) => uploadFile(f))
  }, [files.length, uploadFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = '' // reset so same file can be re-added if removed
  }

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const handleRemove = (index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      notifyParent(updated)
      return updated
    })
  }

  const canAddMore = files.length < MAX_FILES

  return (
    <div className="space-y-3">
      {/* Uploaded files list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between bg-[#1a3347] border border-[#2a4a5c] rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {f.uploading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="text-[#FD802E] animate-spin flex-shrink-0">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${badgeColour(f.type)}`}>
                    {fileBadge(f.type)}
                  </span>
                )}
                <span className="text-white text-sm truncate">{f.name}</span>
                {f.uploading && <span className="text-gray-500 text-xs flex-shrink-0">Uploading…</span>}
              </div>
              {!f.uploading && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="ml-2 flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors"
                  aria-label={`Remove ${f.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone — only shown if under limit */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 text-center transition-colors cursor-pointer group select-none ${
            dragOver
              ? 'border-[#FD802E]/70 bg-[#FD802E]/5'
              : 'border-[#2a4a5c] hover:border-[#FD802E]/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
            className="hidden"
            onChange={handleInputChange}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
               className="text-gray-500 group-hover:text-[#FD802E] mx-auto mb-2 transition-colors">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p className="text-gray-400 text-sm group-hover:text-white transition-colors">
            Drag &amp; drop qualification documents here
          </p>
          <p className="text-gray-600 text-xs mt-0.5">
            PDF, DOCX, PNG, JPG · max 5 MB each · up to {MAX_FILES} files
            {files.length > 0 && ` · ${MAX_FILES - files.length} remaining`}
          </p>
        </div>
      )}

      {files.length >= MAX_FILES && (
        <p className="text-gray-500 text-xs text-center">Maximum {MAX_FILES} files uploaded.</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs leading-snug">{error}</p>
      )}
    </div>
  )
}
