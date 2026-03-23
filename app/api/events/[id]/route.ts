import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chapterId = session.user.chapterId

  const { id } = await params

  const event = await db.event.findUnique({
    where: { id },
    include: {
      rsvps: {
        include: {
          user: { select: { id: true, name: true, business: true } },
        },
      },
    },
  })

  if (!event || event.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(event)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (( session.user.accessLevel ?? 'member') === 'member') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = session.user.chapterId

  const { id } = await params

  const existing = await db.event.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { date, title, subtitle, tags, colors, eventType, isActive } = body

  if (eventType === 'regional') return NextResponse.json({ error: 'Regional events must be created from the Region dashboard' }, { status: 400 })

  const updateData: Record<string, unknown> = {}
  if (date !== undefined) updateData.date = new Date(date)
  if (title !== undefined) updateData.title = title
  if (subtitle !== undefined) updateData.subtitle = subtitle
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags
  if (colors !== undefined) updateData.colors = Array.isArray(colors) ? JSON.stringify(colors) : colors
  if (eventType !== undefined) updateData.eventType = eventType
  if (isActive !== undefined) updateData.isActive = isActive

  const event = await db.event.update({ where: { id }, data: updateData })
  return NextResponse.json(event)
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

  const existing = await db.event.findUnique({ where: { id } })
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.event.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
