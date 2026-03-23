import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')
  const userId = searchParams.get('userId')
  const upcoming = searchParams.get('upcoming')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (eventId) {
    where.eventId = eventId
  } else if (userId) {
    where.assignedUserId = userId
    if (upcoming === 'true') {
      where.event = { date: { gte: new Date() }, isActive: true }
    }
  } else if (upcoming === 'true') {
    // All upcoming pending slots (for admin reminder view)
    where.event = { date: { gte: new Date() }, isActive: true }
  }

  const slots = await db.meetingSlot.findMany({
    where,
    include: {
      event: { select: { id: true, date: true, title: true, eventType: true } },
      assignedUser: { select: { id: true, name: true, role: true } },
    },
    orderBy: [{ event: { date: 'asc' } }, { slotType: 'asc' }, { slotNumber: 'asc' }],
  })

  return NextResponse.json(slots)
}
