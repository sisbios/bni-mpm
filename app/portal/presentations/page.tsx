import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalPresentationsClient from './PortalPresentationsClient'

export default async function PortalPresentationsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()
  const future = new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000) // 12 weeks

  const chapterEvents = await db.event.findMany({
    where: { isActive: true, eventType: 'chapter', date: { gte: now, lte: future } },
    orderBy: { date: 'asc' },
  })

  const eventIds = chapterEvents.map((e) => e.id)

  const slots = await db.meetingSlot.findMany({
    where: { eventId: { in: eventIds } },
    include: {
      event: { select: { id: true, date: true, title: true } },
      assignedUser: { select: { id: true, name: true, business: true, role: true } },
    },
    orderBy: [{ event: { date: 'asc' } }, { slotType: 'asc' }, { slotNumber: 'asc' }],
  })

  const serialized = slots.map((s) => ({
    ...s,
    event: { ...s.event, date: s.event.date.toISOString() },
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return <PortalPresentationsClient slots={serialized} currentUserId={session.user.id} />
}
