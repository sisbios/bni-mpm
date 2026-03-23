import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  const role = session.user.role ?? ''
  const canRevoke = accessLevel === 'superadmin' || accessLevel === 'officer' ||
    ['president', 'vicePresident'].includes(role)

  if (!canRevoke) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { id } = await params

  const existing = await db.memberPin.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.memberPin.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
