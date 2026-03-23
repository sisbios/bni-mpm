import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Fetch existing task to check ownership
  const existing = await db.weeklyTask.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Members can only update their own tasks
  if (( session.user.accessLevel ?? 'member') === 'member' && existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status, notes, contactName, phone, taskType } = body

  const updateData: Record<string, unknown> = {}
  if (status !== undefined) updateData.status = status
  if (notes !== undefined) updateData.notes = notes

  // Only admins/presidents can update these fields
  if (( session.user.accessLevel ?? 'member') !== 'member') {
    if (contactName !== undefined) updateData.contactName = contactName
    if (phone !== undefined) updateData.phone = phone
    if (taskType !== undefined) updateData.taskType = taskType
  }

  const task = await db.weeklyTask.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await db.weeklyTask.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
