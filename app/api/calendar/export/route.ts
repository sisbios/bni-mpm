import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildCalendarHTML } from '@/lib/pdf/calendar-template'
import { generatePDF } from '@/lib/pdf/puppeteer'
import type { CalendarEvent } from '@/lib/pdf/calendar-template'

export async function GET() {
  const session = await auth()
  if (!session || ( session.user.accessLevel ?? 'member') === 'member') {
    return new Response('Unauthorized', { status: 401 })
  }

  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: {
        gte: new Date('2026-04-01'),
        lte: new Date('2026-09-30'),
      },
    },
    orderBy: { date: 'asc' },
  })

  const eventsByMonth = new Map<number, CalendarEvent[]>()
  for (let m = 4; m <= 9; m++) eventsByMonth.set(m, [])

  for (const e of events) {
    const month = new Date(e.date).getMonth() + 1
    if (month < 4 || month > 9) continue
    const tags = JSON.parse(e.tags || '[]') as string[]
    const colors = JSON.parse(e.colors || '[]') as string[]
    eventsByMonth.get(month)!.push({
      date: e.date,
      title: e.title,
      subtitle: e.subtitle || undefined,
      tags,
      colors,
      eventType: e.eventType,
    })
  }

  const html = buildCalendarHTML(eventsByMonth)

  try {
    const pdf = await generatePDF(html)
    return new Response(pdf.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="oscar-chapter-calendar-2026.pdf"',
        'Content-Length': String(pdf.length),
      },
    })
  } catch (err) {
    console.error('PDF generation failed:', err)
    return new Response('PDF generation failed', { status: 500 })
  }
}
