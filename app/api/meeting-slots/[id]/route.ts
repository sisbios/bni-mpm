import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user.accessLevel ?? 'member') === 'member')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { id } = await params

  const existing = await db.meetingSlot.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { assignedUserId, topic, status } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {}

  if (assignedUserId !== undefined) {
    if (assignedUserId === null || assignedUserId === '') {
      data.assignedUserId = null
      data.assignedUserName = null
    } else {
      const user = await db.user.findUnique({ where: { id: assignedUserId }, select: { name: true } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      data.assignedUserId = assignedUserId
      data.assignedUserName = user.name
    }
  }

  if (topic !== undefined) data.topic = topic || null
  if (status !== undefined) data.status = status

  const slot = await db.meetingSlot.update({
    where: { id },
    data,
    include: {
      event: { select: { id: true, date: true, title: true, eventType: true } },
      assignedUser: { select: { id: true, name: true, role: true } },
    },
  })

  return NextResponse.json(slot)
}
