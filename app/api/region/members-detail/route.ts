import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const chapterIds = chapters.map((c) => c.id)
  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c.name]))

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [members, palmsEntries] = await Promise.all([
    db.user.findMany({
      where: { chapterId: { in: chapterIds }, isActive: true, ...NON_ADMIN_FILTER },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accessLevel: true,
        phone: true,
        business: true,
        chapterId: true,
        joinedAt: true,
      },
      orderBy: { name: 'asc' },
    }),
    db.palmsEntry.groupBy({
      by: ['userId', 'attended'],
      _count: { id: true },
      where: { chapterId: { in: chapterIds }, weekDate: { gte: startOfMonth } },
    }),
  ])

  // Build attendance map: userId -> { attended, total }
  type AttMap = Record<string, { attended: number; total: number }>
  const attMap: AttMap = {}
  for (const e of palmsEntries) {
    if (!e.userId) continue
    if (!attMap[e.userId]) attMap[e.userId] = { attended: 0, total: 0 }
    attMap[e.userId].total += e._count.id
    if (e.attended) attMap[e.userId].attended += e._count.id
  }

  function getTrafficLight(userId: string): 'green' | 'yellow' | 'red' | 'gray' {
    const a = attMap[userId]
    if (!a || a.total === 0) return 'gray'
    const pct = a.attended / a.total
    if (pct >= 0.75) return 'green'
    if (pct >= 0.5) return 'yellow'
    return 'red'
  }

  const result = members.map((m) => ({
    ...m,
    chapterName: m.chapterId ? (chapterMap[m.chapterId] ?? '—') : '—',
    trafficLight: getTrafficLight(m.id),
  }))

  return NextResponse.json({ members: result, chapters })
}
