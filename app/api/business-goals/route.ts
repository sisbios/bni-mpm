import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const goals = await (db as any).businessGoal.findMany({
    where: { userId: session.user.id, chapterId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(goals)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const body = await request.json()
  const { type, title, description, category, status, targetDate, achievedAt } = body
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const goal = await (db as any).businessGoal.create({
    data: {
      userId: session.user.id,
      type: type ?? 'achievement',
      title: title.trim(),
      description: description?.trim() || null,
      category: category ?? 'other',
      status: status ?? 'upcoming',
      targetDate: targetDate ? new Date(targetDate) : null,
      achievedAt: achievedAt ? new Date(achievedAt) : null,
      updatedAt: new Date(),
      chapterId,
    },
  })
  return NextResponse.json(goal, { status: 201 })
}
