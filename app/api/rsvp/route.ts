import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (eventId) {
    // Get single event RSVP for current user
    const rsvp = await db.eventRSVP.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
    })
    return NextResponse.json(rsvp ?? null)
  }

  const rsvps = await db.eventRSVP.findMany({
    where: { userId: session.user.id },
    include: { event: true },
    orderBy: { event: { date: 'asc' } },
  })
  return NextResponse.json(rsvps)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { eventId, status, notes } = body

  if (!eventId || !status) return NextResponse.json({ error: 'eventId and status required' }, { status: 400 })

  const validStatuses = ['pending', 'confirmed', 'declined', 'maybe']
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  // Verify event exists and user has access (chapter event or regional event)
  const event = await db.event.findUnique({ where: { id: eventId }, select: { chapterId: true, regionId: true, isActive: true } })
  if (!event || !event.isActive) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const rsvp = await db.eventRSVP.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    update: { status, notes: notes || null, chapterId: session.user.chapterId },
    create: { userId: session.user.id, eventId, status, notes: notes || null, chapterId: session.user.chapterId },
  })

  return NextResponse.json(rsvp)
}
