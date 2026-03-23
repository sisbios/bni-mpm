import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const memberPins = await db.memberPin.findMany({
    where: {
      chapterId,
      ...(userId ? { userId } : {}),
    },
    include: {
      pin: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { awardedAt: 'desc' },
  })

  return NextResponse.json(memberPins)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessLevel = session.user.accessLevel ?? 'member'
  const role = session.user.role ?? ''
  const canAward = accessLevel === 'superadmin' || accessLevel === 'officer' ||
    ['president', 'vicePresident'].includes(role)

  if (!canAward) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const body = await request.json()
  const { userId, pinId, notes } = body

  if (!userId || !pinId) {
    return NextResponse.json({ error: 'userId and pinId are required' }, { status: 400 })
  }

  // Verify the pin is available for this chapter (chapter-specific or system-wide)
  const availablePin = await db.bniPin.findFirst({
    where: {
      id: pinId,
      OR: [{ chapterId }, { chapterId: null, isSystem: true }],
    },
  })
  if (!availablePin) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })

  const pin = await db.memberPin.upsert({
    where: { userId_pinId: { userId, pinId } },
    create: {
      userId,
      pinId,
      awardedBy: session.user.id,
      notes: notes ?? null,
      chapterId,
    },
    update: {
      awardedBy: session.user.id,
      awardedAt: new Date(),
      notes: notes ?? null,
    },
    include: {
      pin: true,
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(pin, { status: 201 })
}
