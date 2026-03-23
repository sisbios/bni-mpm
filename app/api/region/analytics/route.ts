import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true, slug: true, isActive: true },
    orderBy: { name: 'asc' },
  })
  const ids = chapters.map((c) => c.id)

  const [memberCounts, eventCounts, taskCounts, achievementCounts] = await Promise.all([
    db.user.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: ids } } }),
    db.event.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: ids } } }),
    db.weeklyTask.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: ids } } }),
    db.greenAchievement.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: ids } } }),
  ])

  function makeMap(data: { chapterId: string | null; _count: { id: number } }[]) {
    return Object.fromEntries(data.map((d) => [d.chapterId!, d._count.id]))
  }

  const mMap = makeMap(memberCounts)
  const eMap = makeMap(eventCounts)
  const tMap = makeMap(taskCounts)
  const aMap = makeMap(achievementCounts)

  const result = {
    totals: {
      chapters: chapters.length,
      activeChapters: chapters.filter((c) => c.isActive).length,
      members: memberCounts.reduce((s, d) => s + d._count.id, 0),
      events: eventCounts.reduce((s, d) => s + d._count.id, 0),
      tasks: taskCounts.reduce((s, d) => s + d._count.id, 0),
      achievements: achievementCounts.reduce((s, d) => s + d._count.id, 0),
    },
    chapters: chapters.map((c) => ({
      id: c.id, name: c.name, slug: c.slug, isActive: c.isActive,
      members: mMap[c.id] ?? 0,
      events: eMap[c.id] ?? 0,
      tasks: tMap[c.id] ?? 0,
      achievements: aMap[c.id] ?? 0,
    })),
  }

  return NextResponse.json(result)
}
