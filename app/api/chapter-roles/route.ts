import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ROLE_BY_SLUG, HT_SLUGS, MC_SLUGS } from '@/lib/roles'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

function canManageRoles(role: string, accessLevel: string) {
  return (
    accessLevel === 'superadmin' ||
    accessLevel === 'regionAdmin' ||
    accessLevel === 'platform' ||
    role === 'president' ||
    role === 'vicePresident'
  )
}

/** GET /api/chapter-roles
 *  Returns members + role assignments for the caller's chapter */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId
  if (!chapterId) return NextResponse.json({ error: 'No chapter' }, { status: 400 })

  const members = await db.user.findMany({
    where: { chapterId, isActive: true, ...NON_ADMIN_FILTER },
    select: { id: true, name: true, role: true, business: true, phone: true },
    orderBy: { name: 'asc' },
  })

  const assignments: Record<string, { id: string; name: string; business: string | null; phone: string | null }[]> = {}
  for (const m of members) {
    if (!assignments[m.role]) assignments[m.role] = []
    assignments[m.role].push({ id: m.id, name: m.name, business: m.business, phone: m.phone })
  }

  return NextResponse.json({ members, assignments })
}

/** POST /api/chapter-roles
 *  Chapter HT (president/vicePresident) can assign MC roles only.
 *  HT roles are region-admin-only. */
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role: callerRole, accessLevel, chapterId } = session.user
  if (!chapterId) return NextResponse.json({ error: 'No chapter' }, { status: 400 })
  if (!canManageRoles(callerRole ?? '', accessLevel ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, roleSlug } = await request.json()
  if (!userId || !roleSlug) return NextResponse.json({ error: 'userId and roleSlug required' }, { status: 400 })

  const roleDef = ROLE_BY_SLUG[roleSlug]
  if (!roleDef) return NextResponse.json({ error: `Unknown role: ${roleSlug}` }, { status: 400 })

  // Chapter HT can only assign MC roles; HT roles require region admin
  const isRegionLevel = accessLevel === 'regionAdmin' || accessLevel === 'platform'
  if (HT_SLUGS.includes(roleSlug) && !isRegionLevel) {
    return NextResponse.json({ error: 'Head Table roles can only be assigned by Region Admin' }, { status: 403 })
  }

  // Verify user belongs to this chapter
  const user = await db.user.findFirst({ where: { id: userId, chapterId } })
  if (!user) return NextResponse.json({ error: 'User not found in chapter' }, { status: 404 })

  const updated = await db.user.update({
    where: { id: userId },
    data: { role: roleSlug, accessLevel: roleDef.accessLevel },
    select: { id: true, name: true, role: true },
  })

  return NextResponse.json(updated)
}

/** DELETE /api/chapter-roles?userId=xxx
 *  Revert member's role to 'member'. */
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role: callerRole, accessLevel, chapterId } = session.user
  if (!chapterId) return NextResponse.json({ error: 'No chapter' }, { status: 400 })
  if (!canManageRoles(callerRole ?? '', accessLevel ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = new URL(request.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const user = await db.user.findFirst({ where: { id: userId, chapterId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Chapter HT cannot remove HT roles
  const isRegionLevel = accessLevel === 'regionAdmin' || accessLevel === 'platform'
  if (HT_SLUGS.includes(user.role) && !isRegionLevel) {
    return NextResponse.json({ error: 'Head Table roles can only be managed by Region Admin' }, { status: 403 })
  }

  await db.user.update({
    where: { id: userId },
    data: { role: 'member', accessLevel: 'member' },
  })

  return new NextResponse(null, { status: 204 })
}
