import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: eventId } = await params
  const event = await db.event.findUnique({ where: { id: eventId }, select: { bookingRequired: true, isActive: true, title: true } })
  if (!event || !event.isActive) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (!event.bookingRequired) return NextResponse.json({ error: 'Booking not required for this event' }, { status: 400 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, business: true, chapterId: true },
  })

  const body = await request.json().catch(() => ({}))
  const notes = body.notes || null

  const registration = await db.eventRegistration.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    update: { status: 'registered', notes },
    create: {
      eventId,
      userId: session.user.id,
      chapterId: user?.chapterId ?? null,
      name: user?.name ?? session.user.name ?? 'Unknown',
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      business: user?.business ?? null,
      notes,
      status: 'registered',
    },
  })

  return NextResponse.json(registration, { status: 201 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: eventId } = await params

  await db.eventRegistration.updateMany({
    where: { eventId, userId: session.user.id },
    data: { status: 'cancelled' },
  })

  return NextResponse.json({ ok: true })
}
