import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const canManage =
    (session.user.accessLevel ?? 'member') === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { id } = await params
  const existing = await db.chapterRole.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { label, color, accessLevel, group, sortOrder } = await request.json()
  const role = await db.chapterRole.update({
    where: { id },
    data: {
      ...(label !== undefined && { label }),
      ...(color !== undefined && { color }),
      ...(accessLevel !== undefined && { accessLevel }),
      ...(group !== undefined && { group }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })
  return NextResponse.json(role)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const canManage =
    (session.user.accessLevel ?? 'member') === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { id } = await params
  const existing = await db.chapterRole.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.isSystem) return NextResponse.json({ error: 'Cannot delete system role' }, { status: 400 })

  const members = await db.user.findMany({
    where: { role: existing.slug, isActive: true, chapterId },
    select: { id: true, name: true, business: true },
  })
  if (members.length > 0) {
    return NextResponse.json({ error: 'Role has members', members, count: members.length }, { status: 409 })
  }

  await db.chapterRole.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
