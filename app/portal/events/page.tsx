import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalEventsClient from './PortalEventsClient'

async function getUpcomingEvents(userId: string) {
  const now = new Date()
  const events = await db.event.findMany({
    where: { isActive: true, date: { gte: now } },
    orderBy: { date: 'asc' },
  })

  const rsvps = await db.eventRSVP.findMany({
    where: { userId, eventId: { in: events.map((e) => e.id) } },
  })

  return events.map((e) => ({
    ...e,
    myRsvp: rsvps.find((r) => r.eventId === e.id) ?? null,
  }))
}

export default async function PortalEventsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const events = await getUpcomingEvents(session.user.id)

  return <PortalEventsClient initialEvents={events} />
}
