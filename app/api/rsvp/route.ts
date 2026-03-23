import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (eventId) {
    // Get all RSVPs for a specific event (admin view)
    if (( session.user.accessLevel ?? 'member') === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const rsvps = await db.eventRSVP.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, business: true } },
      },
    })
    return NextResponse.json(rsvps)
  }

  // Get current user's RSVPs
  const rsvps = await db.eventRSVP.findMany({
    where: { userId: session.user.id },
    include: {
      event: true,
    },
    orderBy: { event: { date: 'asc' } },
  })

  return NextResponse.json(rsvps)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { eventId, status, notes } = body

  if (!eventId || !status) {
    return NextResponse.json({ error: 'eventId and status are required' }, { status: 400 })
  }

  const validStatuses = ['pending', 'confirmed', 'declined', 'maybe']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const rsvp = await db.eventRSVP.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    update: { status, notes: notes || null },
    create: { userId: session.user.id, eventId, status, notes: notes || null },
  })

  return NextResponse.json(rsvp)
}
