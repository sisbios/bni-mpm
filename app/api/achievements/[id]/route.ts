import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { id } = await params
  const body = await request.json()

  const existing = await db.greenAchievement.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Members can only update their own unverified achievements (description only)
  if (( session.user.accessLevel ?? 'member') === 'member') {
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (existing.verified) {
      return NextResponse.json({ error: 'Cannot edit a verified achievement' }, { status: 403 })
    }
  }

  const updateData: Record<string, unknown> = {}

  if (( session.user.accessLevel ?? 'member') !== 'member') {
    const { verified, description, points, category } = body
    if (verified !== undefined) {
      updateData.verified = verified
      updateData.verifiedBy = verified ? session.user.id : null
    }
    if (description !== undefined) updateData.description = description
    if (points !== undefined) updateData.points = points
    if (category !== undefined) updateData.category = category
  } else {
    const { description } = body
    if (description !== undefined) updateData.description = description
  }

  const achievement = await db.greenAchievement.update({
    where: { id },
    data: updateData,
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(achievement)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { id } = await params
  const existing = await db.greenAchievement.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.greenAchievement.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
