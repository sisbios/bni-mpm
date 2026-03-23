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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = { isActive: true, chapterId }

  if (month && year) {
    const m = parseInt(month) - 1 // 0-indexed
    const y = parseInt(year)
    const startDate = new Date(y, m, 1)
    const endDate = new Date(y, m + 1, 0, 23, 59, 59)
    where = { isActive: true, chapterId, date: { gte: startDate, lte: endDate } }
  }

  const events = await db.event.findMany({
    where,
    orderBy: { date: 'asc' },
    include: {
      _count: { select: { rsvps: true } },
    },
  })

  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const body = await request.json()
  const { date, title, subtitle, tags, colors, eventType } = body

  if (!date || !title) {
    return NextResponse.json({ error: 'Date and title are required' }, { status: 400 })
  }

  const event = await db.event.create({
    data: {
      date: new Date(date),
      title,
      subtitle: subtitle || null,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || '[]',
      colors: Array.isArray(colors) ? JSON.stringify(colors) : colors || '[]',
      eventType: eventType || 'chapter',
      chapterId,
    },
  })

  // Auto-create meeting slots for chapter meetings: 1 edu slot + 2 feature presentations
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
