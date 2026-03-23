import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function statusToLight(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'done') return 'green'
  if (status === 'pending') return 'yellow'
  return 'red'
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const chapterIds = chapters.map((c) => c.id)

  const tasks = await db.weeklyTask.findMany({
    where: { chapterId: { in: chapterIds } },
    select: { chapterId: true, status: true },
  })

  type Summary = { chapterId: string; chapterName: string; green: number; yellow: number; red: number; total: number }
  const summaryMap: Record<string, Summary> = {}
  for (const ch of chapters) {
    summaryMap[ch.id] = { chapterId: ch.id, chapterName: ch.name, green: 0, yellow: 0, red: 0, total: 0 }
  }
  for (const t of tasks) {
    if (!t.chapterId || !summaryMap[t.chapterId]) continue
    const s = summaryMap[t.chapterId]
    s.total++
    s[statusToLight(t.status)]++
  }

  const totals = {
    green: tasks.filter((t) => statusToLight(t.status) === 'green').length,
    yellow: tasks.filter((t) => statusToLight(t.status) === 'yellow').length,
    red: tasks.filter((t) => statusToLight(t.status) === 'red').length,
    total: tasks.length,
  }

  return NextResponse.json({
    totals,
    chapters: Object.values(summaryMap),
  })
}
