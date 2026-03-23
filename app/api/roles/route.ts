import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = await db.chapterRole.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
  return NextResponse.json(roles)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const canManage =
    (session.user.accessLevel ?? 'member') === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug, label, color, accessLevel, group, sortOrder } = await request.json()
  if (!slug || !label) return NextResponse.json({ error: 'slug and label required' }, { status: 400 })

  const role = await db.chapterRole.create({
    data: {
      slug, label,
      color: color ?? '#9CA3AF',
      accessLevel: accessLevel ?? 'member',
      group: group ?? 'member',
      sortOrder: sortOrder ?? 99,
      isSystem: false,
    },
  })
  return NextResponse.json(role, { status: 201 })
}
