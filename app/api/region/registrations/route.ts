import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (eventId) {
    const registrations = await db.eventRegistration.findMany({
      where: { eventId },
      orderBy: { registeredAt: 'asc' },
      select: {
        id: true, name: true, email: true, phone: true, business: true,
        status: true, registeredAt: true, notes: true, chapterId: true,
        user: { select: { name: true, business: true, phone: true } },
      },
    })
    return NextResponse.json(registrations)
  }

  // List all events with booking enabled in this region
  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
  })
  const chapterIds = chapters.map((c) => c.id)
  const chapterMap: Record<string, string> = {}
  for (const c of chapters) chapterMap[c.id] = c.name

  const events = await db.event.findMany({
    where: {
      bookingRequired: true,
      OR: [
        { chapterId: { in: chapterIds } },
        ...(regionId ? [{ regionId }] : []),
      ],
    },
    orderBy: { date: 'desc' },
    select: {
      id: true, title: true, subtitle: true, date: true, eventType: true,
      chapterId: true, regionId: true,
      _count: { select: { registrations: { where: { status: 'registered' } } } },
    },
  })

  return NextResponse.json(events.map((ev) => ({
    ...ev,
    registrationCount: ev._count.registrations,
    chapterName: ev.chapterId ? (chapterMap[ev.chapterId] ?? '—') : 'Regional',
  })))
}
