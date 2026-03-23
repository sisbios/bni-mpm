import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const memberPins = await db.memberPin.findMany({
    where: userId ? { userId } : undefined,
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

  const body = await request.json()
  const { userId, pinSlug, notes } = body

  if (!userId || !pinSlug) {
    return NextResponse.json({ error: 'userId and pinSlug are required' }, { status: 400 })
  }

  const pin = await db.memberPin.upsert({
    where: { userId_pinSlug: { userId, pinSlug } },
    create: {
      userId,
      pinSlug,
      awardedBy: session.user.id,
      notes: notes ?? null,
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
