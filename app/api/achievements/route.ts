import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  // Members can only see their own achievements
  const targetUserId = ( session.user.accessLevel ?? 'member') === 'member' ? session.user.id : userId || undefined

  const achievements = await db.greenAchievement.findMany({
    where: targetUserId ? { userId: targetUserId } : {},
    include: {
      user: { select: { id: true, name: true, business: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(achievements)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { userId, category, description, points, date } = body

  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  }

  // Members can only log for themselves; admins can log for anyone
  const assignedUserId = ( session.user.accessLevel ?? 'member') === 'member' ? session.user.id : (userId || session.user.id)

  const achievement = await db.greenAchievement.create({
    data: {
      userId: assignedUserId,
      category,
      description: description || null,
      points: points || 1,
      date: date ? new Date(date) : new Date(),
      verified: ( session.user.accessLevel ?? 'member') !== 'member', // Auto-verify if admin creates
      verifiedBy: ( session.user.accessLevel ?? 'member') !== 'member' ? session.user.id : null,
    },
    include: {
      user: { select: { id: true, name: true, business: true } },
    },
  })

  return NextResponse.json(achievement, { status: 201 })
}
