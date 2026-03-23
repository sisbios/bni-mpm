import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')
  const scope  = searchParams.get('scope') // 'regional' | 'chapter' | ''
  const month  = searchParams.get('month')
  const year   = searchParams.get('year')

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
  })
  const chapterIds = chapterId ? [chapterId] : chapters.map((c) => c.id)
  const chapterMap: Record<string, string> = {}
  for (const c of chapters) chapterMap[c.id] = c.name

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dateFilter: any = {}
  if (month && year) {
    const m = parseInt(month) - 1
    const y = parseInt(year)
    dateFilter = { date: { gte: new Date(y, m, 1), lte: new Date(y, m + 1, 0, 23, 59, 59) } }
  }

  const scopeClause = scope === 'regional'
    ? { regionId: regionId ?? undefined }
    : scope === 'chapter'
    ? { chapterId: { in: chapterIds } }
    : { OR: [{ chapterId: { in: chapterIds } }, ...(regionId ? [{ regionId }] : [])] }

  const events = await db.event.findMany({
    where: { ...scopeClause, ...dateFilter } as any,
    orderBy: { date: 'asc' },
    select: { id: true, title: true, subtitle: true, date: true, eventType: true, isActive: true, chapterId: true, regionId: true, bookingRequired: true, _count: { select: { registrations: true } } },
  })

  const result = events.map((ev) => ({
    ...ev,
    chapterName: ev.chapterId ? (chapterMap[ev.chapterId] ?? ev.chapterId) : ev.regionId ? 'Regional' : '—',
    registrationCount: ev._count.registrations,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!regionId) return NextResponse.json({ error: 'No region assigned' }, { status: 400 })

  const body = await request.json()
  const { date, title, subtitle, eventType, bookingRequired } = body

  if (!date || !title) return NextResponse.json({ error: 'Date and title are required' }, { status: 400 })

  const event = await db.event.create({
    data: {
      date: new Date(date),
      title,
      subtitle: subtitle || null,
      eventType: eventType || 'regional',
      bookingRequired: Boolean(bookingRequired),
      regionId,
      tags: '[]',
      colors: '[]',
    },
  })

  return NextResponse.json(event, { status: 201 })
}
