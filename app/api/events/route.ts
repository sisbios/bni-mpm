import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  // Get the chapter's regionId so we can include regional events
  const chapter = chapterId
    ? await db.chapter.findUnique({ where: { id: chapterId }, select: { regionId: true } })
    : null
  const regionId = chapter?.regionId ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dateFilter: any = {}
  if (month && year) {
    const m = parseInt(month) - 1
    const y = parseInt(year)
    dateFilter = { date: { gte: new Date(y, m, 1), lte: new Date(y, m + 1, 0, 23, 59, 59) } }
  }

  const events = await db.event.findMany({
    where: {
      isActive: true,
      ...dateFilter,
      OR: [
        { chapterId },
        ...(regionId ? [{ regionId }] : []),
      ],
    },
    orderBy: { date: 'asc' },
    include: { _count: { select: { rsvps: true } } },
  })

  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId
  const body = await request.json()
  const { date, title, subtitle, tags, colors, eventType, bookingRequired } = body

  if (!date || !title) return NextResponse.json({ error: 'Date and title are required' }, { status: 400 })

  const event = await db.event.create({
    data: {
      date: new Date(date),
      title,
      subtitle: subtitle || null,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || '[]',
      colors: Array.isArray(colors) ? JSON.stringify(colors) : colors || '[]',
      eventType: eventType || 'chapter',
      bookingRequired: Boolean(bookingRequired),
      chapterId,
    },
  })

  if ((eventType || 'chapter') === 'chapter') {
    await db.meetingSlot.createMany({
      data: [
        { eventId: event.id, slotType: 'edu_slot', slotNumber: 1, chapterId },
        { eventId: event.id, slotType: 'feature_presentation', slotNumber: 1, chapterId },
        { eventId: event.id, slotType: 'feature_presentation', slotNumber: 2, chapterId },
      ],
    })
  }

  return NextResponse.json(event, { status: 201 })
}
