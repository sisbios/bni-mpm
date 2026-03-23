import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get('chapterId')

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
  })
  const chapterIds = chapterId ? [chapterId] : chapters.map((c) => c.id)
  const chapterMap: Record<string, string> = {}
  for (const c of chapters) chapterMap[c.id] = c.name

  const events = await db.event.findMany({
    where: { chapterId: { in: chapterIds } },
    orderBy: { date: 'desc' },
    select: { id: true, title: true, subtitle: true, date: true, eventType: true, isActive: true, chapterId: true },
  })

  const result = events.map((ev) => ({
    ...ev,
    chapterName: ev.chapterId ? (chapterMap[ev.chapterId] ?? ev.chapterId) : '—',
  }))

  return NextResponse.json(result)
}
