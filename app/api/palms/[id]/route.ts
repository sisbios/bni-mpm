import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  if (accessLevel === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { attended, substitute, late, medical, referrals, visitors, testimonials, oneToOnes, ceus, tyfcbAmount, notes } = body

  const entry = await db.palmsEntry.update({
    where: { id },
    data: {
      ...(attended !== undefined && { attended }),
      ...(substitute !== undefined && { substitute }),
      ...(late !== undefined && { late }),
      ...(medical !== undefined && { medical }),
      ...(referrals !== undefined && { referrals }),
      ...(visitors !== undefined && { visitors }),
      ...(testimonials !== undefined && { testimonials }),
      ...(oneToOnes !== undefined && { oneToOnes }),
      ...(ceus !== undefined && { ceus }),
      ...(tyfcbAmount !== undefined && { tyfcbAmount }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      user: { select: { id: true, name: true, business: true } },
    },
  })

  return NextResponse.json(entry)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  if (accessLevel === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await db.palmsEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
