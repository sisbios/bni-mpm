import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

type EventRow = {
  id: string
  title: string
  date: Date
  eventType: string
  isActive: boolean
  chapterId: string | null
  chapterName: string
}

function groupByMonth(events: EventRow[]) {
  const groups: Record<string, EventRow[]> = {}
  for (const ev of events) {
    const key = new Date(ev.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }
  return groups
}

export default async function RegionCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const sp = await searchParams
  const selectedChapter = sp.chapter ?? ''

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const chapterIds = selectedChapter
    ? [selectedChapter]
    : chapters.map((c) => c.id)

  const chapterMap: Record<string, string> = {}
  for (const c of chapters) chapterMap[c.id] = c.name

  const events = await db.event.findMany({
    where: { chapterId: { in: chapterIds } },
    orderBy: { date: 'asc' },
    select: { id: true, title: true, date: true, eventType: true, isActive: true, chapterId: true },
  })

  const enriched: EventRow[] = events.map((ev) => ({
    ...ev,
    chapterName: ev.chapterId ? (chapterMap[ev.chapterId] ?? ev.chapterId) : '—',
  }))

  const grouped = groupByMonth(enriched)
  const monthKeys = Object.keys(grouped)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          REGION <span style={{ color: '#3B82F6' }}>CALENDAR</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
          All events across chapters
        </p>
      </div>

      {/* Chapter filter */}
      <form method="GET" style={{ marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          name="chapter"
          defaultValue={selectedChapter}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', color: '#ffffff', padding: '8px 14px', fontSize: '13px', outline: 'none',
            minWidth: '200px',
          }}
        >
          <option value="">All Chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id} style={{ background: '#0A0F1E' }}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          style={{
            padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)',
            background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer',
          }}
        >
          Filter
        </button>
        {selectedChapter && (
          <a href="/region/calendar" style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'none' }}>
            Clear
          </a>
        )}
      </form>

      {monthKeys.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#4B5563',
        }}>
          <Calendar size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ margin: 0 }}>No events found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {monthKeys.map((month) => (
            <div key={month}>
              <div style={{
                fontSize: '11px', color: '#3B82F6', textTransform: 'uppercase',
                letterSpacing: '2px', fontWeight: '700', marginBottom: '10px',
              }}>
                {month}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                {grouped[month].map((ev, idx) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '14px 20px',
                      borderBottom: idx < grouped[month].length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    {/* Date badge */}
                    <div style={{
                      width: '44px', flexShrink: 0, textAlign: 'center',
                      background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)',
                      borderRadius: '8px', padding: '6px 4px',
                    }}>
                      <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', color: '#3B82F6', lineHeight: 1 }}>
                        {new Date(ev.date).getDate()}
                      </div>
                      <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#C9A84C', fontWeight: '500' }}>{ev.chapterName}</span>
                        <span style={{ fontSize: '12px', color: '#6B7280', textTransform: 'capitalize' }}>{ev.eventType}</span>
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', flexShrink: 0,
                      background: ev.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                      color: ev.isActive ? '#10B981' : '#6B7280',
                    }}>
                      {ev.isActive ? 'Active' : 'Past'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
