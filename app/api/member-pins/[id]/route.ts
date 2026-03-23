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

  const { id } = await params
  await db.memberPin.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
