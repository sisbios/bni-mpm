import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function getISOWeek(date: Date): string {
  const d = new Date(date)
  const dayOfYear =
    Math.ceil(
      (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 +
        new Date(d.getFullYear(), 0, 1).getDay() +
        1
    )
  const weekNum = Math.ceil(dayOfYear / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const currentWeek = getISOWeek(now)

  const [totalMembers, upcomingEvents, openTasks, achievementsThisMonth] = await Promise.all([
    db.user.count({ where: { isActive: true, role: { not: 'admin' }, chapterId } }),
    db.event.count({ where: { isActive: true, chapterId, date: { gte: now, lte: endOfMonth } } }),
    db.weeklyTask.count({ where: { week: currentWeek, status: { in: ['pending', 'callback'] }, chapterId } }),
    db.greenAchievement.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth }, chapterId } }),
  ])

  const topAchieversRaw = await db.greenAchievement.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth }, chapterId },
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: 'desc' } },
    take: 5,
  })

  const achieverUsers = await db.user.findMany({
    where: { id: { in: topAchieversRaw.map((a) => a.userId) }, chapterId },
    select: { id: true, name: true, business: true },
  })

  const topAchievers = topAchieversRaw.map((a) => ({
    userId: a.userId,
    points: a._sum.points ?? 0,
    count: a._count.id,
    user: achieverUsers.find((u) => u.id === a.userId),
  }))

  const rsvpStats = await db.eventRSVP.groupBy({
    by: ['status'],
    where: {
      event: { date: { gte: now, lte: endOfMonth }, chapterId },
    },
    _count: { id: true },
  })

  return NextResponse.json({
    totalMembers,
    upcomingEvents,
    openTasks,
    achievementsThisMonth,
    topAchievers,
    rsvpStats: rsvpStats.map((r) => ({ status: r.status, count: r._count.id })),
  })
}
