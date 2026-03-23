/**
 * lib/tenant.ts — Chapter isolation helpers (Phase 3)
 *
 * Every API route calls getChapterId(session) to get the current chapter.
 * The chapterId comes from the JWT (set during login from user.chapterId in DB).
 *
 * Platform/regionAdmin users have chapterId = null and can access cross-chapter
 * data by passing an explicit chapterId query param.
 */

import { Session } from 'next-auth'

type MinimalSession = Pick<Session, 'user'>

/**
 * Returns the chapterId for the current session.
 * Platform admins / region admins can pass an override chapterId.
 * Throws if a member-level user has no chapterId (data integrity issue).
 */
export function getChapterId(
  session: MinimalSession,
  override?: string | null,
): string {
  const { accessLevel, chapterId } = session.user as {
    accessLevel?: string | null
    chapterId?: string | null
  }

  // Platform / region admins can operate on any chapter via override
  if (accessLevel === 'platform' || accessLevel === 'regionAdmin') {
    if (override) return override
    // If no override provided, they are doing cross-chapter work — callers
    // must handle the undefined case explicitly
    return chapterId ?? ''
  }

  if (!chapterId) {
    throw new Error('User has no chapterId — cannot determine chapter context')
  }
  return chapterId
}

/**
 * Asserts that the session user belongs to the given chapterId.
 * Use this before returning or mutating a specific record to prevent
 * cross-chapter data leaks.
 */
export function assertChapter(session: MinimalSession, recordChapterId: string | null): void {
  const { accessLevel, chapterId } = session.user as {
    accessLevel?: string | null
    chapterId?: string | null
  }

  // Platform / region admins bypass chapter isolation
  if (accessLevel === 'platform' || accessLevel === 'regionAdmin') return

  if (recordChapterId && chapterId && recordChapterId !== chapterId) {
    throw new Error('Cross-chapter access denied')
  }
}
