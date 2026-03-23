import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { searchParams } = new URL(request.url)
  const week = searchParams.get('week')
  const userId = searchParams.get('userId')

  // Members can only see their own tasks
  const targetUserId = ( session.user.accessLevel ?? 'member') === 'member' ? session.user.id : userId || undefined

  const tasks = await db.weeklyTask.findMany({
    where: {
      chapterId,
      ...(week ? { week } : {}),
      ...(targetUserId ? { userId: targetUserId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, business: true } },
    },
    orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const body = await request.json()

  // Batch create support
  if (Array.isArray(body)) {
    if (( session.user.accessLevel ?? 'member') === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const tasks = await db.weeklyTask.createMany({
      data: body.map((t) => ({
        userId: t.userId,
        week: t.week,
        taskType: t.taskType || 'call',
        contactName: t.contactName,
        phone: t.phone || null,
        status: 'pending',
        notes: t.notes || null,
        allocatedBy: session.user.id,
        chapterId,
      })),
    })
    return NextResponse.json({ created: tasks.count }, { status: 201 })
  }

  const { userId, week, taskType, contactName, phone, notes } = body

  if (!contactName || !week) {
    return NextResponse.json({ error: 'contactName and week are required' }, { status: 400 })
  }

  // Members can only create tasks for themselves
  const assignedUserId = ( session.user.accessLevel ?? 'member') === 'member' ? session.user.id : (userId || session.user.id)

  const task = await db.weeklyTask.create({
    data: {
      userId: assignedUserId,
      week,
      taskType: taskType || 'call',
      contactName,
      phone: phone || null,
      notes: notes || null,
      allocatedBy: ( session.user.accessLevel ?? 'member') !== 'member' ? session.user.id : null,
      chapterId,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task, { status: 201 })
}
