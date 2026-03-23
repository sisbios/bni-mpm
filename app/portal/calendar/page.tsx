import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import PortalCalendarClient from './PortalCalendarClient'

export default async function PortalCalendarPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()
  const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const events = await db.event.findMany({
    where: { isActive: true, date: { gte: now, lte: threeMonths } },
    orderBy: { date: 'asc' },
  })

  const rsvps = await db.eventRSVP.findMany({
    where: { userId: session.user.id, eventId: { in: events.map((e) => e.id) } },
  })

  const serialized = events.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    myRsvp: rsvps.find((r) => r.eventId === e.id) ?? null,
  }))

  return <PortalCalendarClient initialEvents={serialized} />
}
