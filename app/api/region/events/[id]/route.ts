import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel } = session.user as { accessLevel: string }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await db.event.findUnique({ where: { id } })
  if (!existing || !existing.regionId)
    return NextResponse.json({ error: 'Not found or not a regional event' }, { status: 404 })

  const body = await request.json()
  const { date, title, subtitle, eventType, bookingRequired, isActive } = body

  const data: Record<string, unknown> = {}
  if (date !== undefined) data.date = new Date(date)
  if (title !== undefined) data.title = title
  if (subtitle !== undefined) data.subtitle = subtitle || null
  if (eventType !== undefined) data.eventType = eventType
  if (bookingRequired !== undefined) data.bookingRequired = Boolean(bookingRequired)
  if (isActive !== undefined) data.isActive = Boolean(isActive)

  const event = await db.event.update({ where: { id }, data })
  return NextResponse.json(event)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { accessLevel } = session.user as { accessLevel: string }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await db.event.findUnique({ where: { id } })
  if (!existing || !existing.regionId)
    return NextResponse.json({ error: 'Not found or not a regional event' }, { status: 404 })

  await db.event.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
