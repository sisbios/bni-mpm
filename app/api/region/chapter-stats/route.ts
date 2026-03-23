import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'
import { HT_SLUGS } from '@/lib/roles'

/** GET /api/region/chapter-stats
 *  Returns rich stats per chapter for the chapter cards view */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    orderBy: { name: 'asc' },
  })
  const ids = chapters.map((c) => c.id)

  const now = new Date()
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    memberCounts,
    htMembers,
    greenMemberCounts,
    visitorsLastMonth,
    revenueData,
  ] = await Promise.all([
    // Total non-admin members per chapter
    db.user.groupBy({
      by: ['chapterId'],
      _count: { id: true },
      where: { chapterId: { in: ids }, isActive: true, ...NON_ADMIN_FILTER },
    }),
    // HT role members with contact info
    db.user.findMany({
      where: {
        chapterId: { in: ids },
        isActive: true,
        role: { in: HT_SLUGS },
      },
      select: { id: true, name: true, role: true, phone: true, chapterId: true },
    }),
    // Green members = attended at least 1 PALMS session this month
    db.palmsEntry.groupBy({
      by: ['chapterId'],
      _count: { id: true },
      where: {
        chapterId: { in: ids },
        attended: true,
        weekDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: now },
      },
    }),
    // Visitors last month
    db.visitor.groupBy({
      by: ['chapterId'],
      _count: { id: true },
      where: {
        chapterId: { in: ids },
        visitDate: { gte: startLastMonth, lte: endLastMonth },
      },
    }),
    // Total TYFCB revenue generated (all time)
    db.palmsEntry.groupBy({
      by: ['chapterId'],
      _sum: { tyfcbAmount: true },
      where: { chapterId: { in: ids } },
    }),
  ])

  function makeMap<T>(data: { chapterId: string | null }[], fn: (d: any) => T): Record<string, T> {
    return Object.fromEntries(data.map((d: any) => [d.chapterId!, fn(d)]))
  }

  const memberMap = makeMap(memberCounts, (d) => d._count.id)
  const greenMap = makeMap(greenMemberCounts, (d) => d._count.id)
  const visitorMap = makeMap(visitorsLastMonth, (d) => d._count.id)
  const revenueMap = makeMap(revenueData, (d) => d._sum.tyfcbAmount ?? 0)

  // Group HT members by chapter
  const htMap: Record<string, typeof htMembers> = {}
  for (const m of htMembers) {
    if (!m.chapterId) continue
    if (!htMap[m.chapterId]) htMap[m.chapterId] = []
    htMap[m.chapterId].push(m)
  }

  const result = chapters.map((ch) => ({
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
    city: ch.city,
    meetingDay: ch.meetingDay,
    meetingTime: ch.meetingTime,
    meetingLocation: (ch as any).meetingLocation ?? null,
    meetingFee: (ch as any).meetingFee ?? null,
    visitorFee: (ch as any).visitorFee ?? null,
    isActive: ch.isActive,
    totalMembers: memberMap[ch.id] ?? 0,
    totalGreenMembers: greenMap[ch.id] ?? 0,
    totalVisitorsLastMonth: visitorMap[ch.id] ?? 0,
    totalRevenue: revenueMap[ch.id] ?? 0,
    headTable: (htMap[ch.id] ?? []).sort((a, b) => {
      const order = ['president', 'vicePresident', 'secretaryTreasurer']
      return order.indexOf(a.role) - order.indexOf(b.role)
    }),
  }))

  return NextResponse.json(result)
}
