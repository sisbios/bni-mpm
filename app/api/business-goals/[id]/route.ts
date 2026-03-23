import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { id } = await params

  const existing = await (db as any).businessGoal.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id || existing.chapterId !== chapterId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { type, title, description, category, status, targetDate, achievedAt } = body
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (type !== undefined) updateData.type = type
  if (title !== undefined) updateData.title = title.trim()
  if (description !== undefined) updateData.description = description?.trim() || null
  if (category !== undefined) updateData.category = category
  if (status !== undefined) updateData.status = status
  if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null
  if (achievedAt !== undefined) updateData.achievedAt = achievedAt ? new Date(achievedAt) : null

  const goal = await (db as any).businessGoal.update({ where: { id }, data: updateData })
  return NextResponse.json(goal)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { id } = await params

  const existing = await (db as any).businessGoal.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id || existing.chapterId !== chapterId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await (db as any).businessGoal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
