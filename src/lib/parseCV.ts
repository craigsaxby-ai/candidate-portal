/**
 * parseCV.ts — CV parsing stub
 *
 * TODO: replace with real AI extraction via Engine API.
 * In production, this would POST the file to the Engine API which would
 * use GPT to extract name, role, skills, salary, location, etc.
 */

import type { ProfileForm } from '../pages/Profile'

export async function parseCVText(
  filename: string,
  _fileSize: number
): Promise<Partial<ProfileForm>> {
  // Stub: returns empty object — the upload and storage is the real deliverable.
  // Real implementation would send file to Engine API for GPT-powered extraction.
  console.log('[parseCV] Stub called for:', filename, '— real parsing not yet implemented')
  return {}
}
