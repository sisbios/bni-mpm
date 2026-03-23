import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PresentationsClient from './PresentationsClient'

export default async function PresentationsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const now = new Date()
  const future = new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000) // 12 weeks

  // Fetch all upcoming chapter events
  const chapterEvents = await db.event.findMany({
    where: { isActive: true, eventType: 'chapter', date: { gte: now, lte: future } },
    include: { meetingSlots: true },
    orderBy: { date: 'asc' },
  })

  // Auto-create missing slots for events that don't have them yet
  const eventsWithoutSlots = chapterEvents.filter((e) => e.meetingSlots.length === 0)
  if (eventsWithoutSlots.length > 0) {
    await db.meetingSlot.createMany({
      data: eventsWithoutSlots.flatMap((e) => [
        { eventId: e.id, slotType: 'edu_slot', slotNumber: 1 },
        { eventId: e.id, slotType: 'feature_presentation', slotNumber: 1 },
        { eventId: e.id, slotType: 'feature_presentation', slotNumber: 2 },
      ]),
    })
  }

  // Now fetch all slots for these events (including newly created ones)
  const eventIds = chapterEvents.map((e) => e.id)
  const slots = await db.meetingSlot.findMany({
    where: { eventId: { in: eventIds } },
    include: {
      event: { select: { id: true, date: true, title: true } },
      assignedUser: { select: { id: true, name: true, role: true, avatar: true } },
    },
    orderBy: [{ event: { date: 'asc' } }, { slotType: 'asc' }, { slotNumber: 'asc' }],
  })

  const members = await db.user.findMany({
    where: { isActive: true, role: { not: 'admin' } },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  })

  const pendingCount = slots.filter((s) => !s.assignedUserId).length

  const serialized = slots.map((s) => ({
    ...s,
    event: { ...s.event, date: s.event.date.toISOString() },
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <PresentationsClient
      initialSlots={serialized}
      members={members}
      pendingCount={pendingCount}
    />
  )
}
