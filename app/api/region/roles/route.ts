import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ALL_ROLES, HT_SLUGS, ROLE_BY_SLUG } from '@/lib/roles'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

function isRegionAdmin(accessLevel: string) {
  return accessLevel === 'regionAdmin' || accessLevel === 'platform'
}

/** GET /api/region/roles?chapterId=xxx
 *  Returns current HT+MC role assignments for a chapter */
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')
  if (!chapterId) return NextResponse.json({ error: 'chapterId required' }, { status: 400 })

  // All non-admin members of this chapter
  const members = await db.user.findMany({
    where: { chapterId, isActive: true, ...NON_ADMIN_FILTER },
    select: { id: true, name: true, role: true, business: true, phone: true },
    orderBy: { name: 'asc' },
  })

  // Map role slug → member(s) assigned
  const assignments: Record<string, { id: string; name: string; business: string | null; phone: string | null }[]> = {}
  for (const m of members) {
    if (!assignments[m.role]) assignments[m.role] = []
    assignments[m.role].push({ id: m.id, name: m.name, business: m.business, phone: m.phone })
  }

  return NextResponse.json({ members, assignments })
}

/** POST /api/region/roles
 *  Assign a role to a member (updates user.role + user.accessLevel) */
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { userId, roleSlug, chapterId } = body

  if (!userId || !roleSlug || !chapterId) {
    return NextResponse.json({ error: 'userId, roleSlug and chapterId are required' }, { status: 400 })
  }

  const roleDef = ROLE_BY_SLUG[roleSlug]
  if (!roleDef) return NextResponse.json({ error: `Unknown role: ${roleSlug}` }, { status: 400 })

  // Ensure user belongs to this chapter
  const user = await db.user.findFirst({ where: { id: userId, chapterId } })
  if (!user) return NextResponse.json({ error: 'User not found in this chapter' }, { status: 404 })

  // If assigning an HT role, demote any existing holder first (HT roles are exclusive)
  if (HT_SLUGS.includes(roleSlug)) {
    await db.user.updateMany({
      where: { chapterId, role: roleSlug, id: { not: userId } },
      data: { role: 'member', accessLevel: 'member' },
    })
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { role: roleSlug, accessLevel: roleDef.accessLevel },
    select: { id: true, name: true, role: true, accessLevel: true },
  })

  return NextResponse.json(updated)
}

/** DELETE /api/region/roles — remove role (revert to member) */
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isRegionAdmin(session.user.accessLevel)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const chapterId = searchParams.get('chapterId')
  if (!userId || !chapterId) return NextResponse.json({ error: 'userId and chapterId required' }, { status: 400 })

  const user = await db.user.findFirst({ where: { id: userId, chapterId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await db.user.update({
    where: { id: userId },
    data: { role: 'member', accessLevel: 'member' },
    select: { id: true, name: true, role: true, accessLevel: true },
  })

  return NextResponse.json(updated)
}
