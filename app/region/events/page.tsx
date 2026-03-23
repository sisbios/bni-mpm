import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { CalendarCheck, Globe } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  chapter:       { bg: 'rgba(59,130,246,0.12)',   color: '#3B82F6' },
  regional:      { bg: 'rgba(139,92,246,0.12)',   color: '#8B5CF6' },
  training:      { bg: 'rgba(16,185,129,0.12)',   color: '#10B981' },
  social:        { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B' },
  trip:          { bg: 'rgba(236,72,153,0.12)',   color: '#EC4899' },
  international: { bg: 'rgba(201,168,76,0.12)',   color: '#C9A84C' },
}

export default async function RegionEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; scope?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const sp = await searchParams
  const selectedChapter = sp.chapter ?? ''
  const scope = sp.scope ?? '' // '' | 'regional' | 'chapter'

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const chapterIds = selectedChapter ? [selectedChapter] : chapters.map((c) => c.id)
  const chapterMap: Record<string, string> = {}
  for (const c of chapters) chapterMap[c.id] = c.name

  const whereClause = scope === 'regional'
    ? { regionId: regionId ?? undefined }
    : scope === 'chapter'
    ? { chapterId: { in: chapterIds } }
    : { OR: [{ chapterId: { in: chapterIds } }, ...(regionId ? [{ regionId }] : [])] }

  const events = await db.event.findMany({
    where: whereClause as any,
    orderBy: { date: 'desc' },
    select: { id: true, title: true, date: true, eventType: true, isActive: true, chapterId: true, regionId: true, subtitle: true, bookingRequired: true, _count: { select: { registrations: true } } },
  })

  const regionalCount = events.filter((e) => e.regionId).length
  const chapterCount = events.filter((e) => e.chapterId).length

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
            REGION <span style={{ color: '#3B82F6' }}>EVENTS</span>
          </h1>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px', marginBottom: 0 }}>
            {events.length} events · {regionalCount} regional · {chapterCount} chapter
          </p>
        </div>
        <Link href="/region/events/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
          borderRadius: '8px', textDecoration: 'none',
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          color: '#ffffff', fontSize: '13px', fontWeight: '600',
          boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
        }}>
          <Globe size={14} /> Regional Event
        </Link>
      </div>

      {/* Scope tabs + chapter filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'All Events', value: '' },
          { label: 'Regional Only', value: 'regional' },
          { label: 'Chapter Events', value: 'chapter' },
        ].map((tab) => (
          <a key={tab.value} href={`/region/events?scope=${tab.value}`} style={{
            padding: '6px 14px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: '600',
            background: scope === tab.value ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            border: scope === tab.value ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: scope === tab.value ? '#3B82F6' : '#6B7280',
          }}>
            {tab.label}
          </a>
        ))}
        {scope !== 'regional' && (
          <form method="GET" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto' }}>
            <input type="hidden" name="scope" value={scope} />
            <select name="chapter" defaultValue={selectedChapter} style={{
              background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '7px', color: '#ffffff', padding: '6px 10px', fontSize: '12px', outline: 'none', colorScheme: 'dark',
            }}>
              <option value="">All Chapters</option>
              {chapters.map((c) => <option key={c.id} value={c.id} style={{ background: '#0A0F1E' }}>{c.name}</option>)}
            </select>
            <button type="submit" style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Filter</button>
          </form>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <CalendarCheck size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No events found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Event', 'Date', 'Type', 'Chapter / Scope', 'Booking', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => {
                  const tc = TYPE_COLORS[ev.eventType] ?? TYPE_COLORS.chapter
                  return (
                    <tr key={ev.id} style={{ borderBottom: idx < events.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '600', color: '#ffffff' }}>{ev.title}</div>
                        {ev.subtitle && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{ev.subtitle}</div>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: tc.bg, color: tc.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{ev.eventType}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {ev.regionId
                          ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontWeight: '600' }}>All Chapters</span>
                          : <span style={{ color: '#C9A84C', fontWeight: '500' }}>{ev.chapterId ? (chapterMap[ev.chapterId] ?? '—') : '—'}</span>
                        }
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {ev.bookingRequired
                          ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontWeight: '600' }}>{ev._count.registrations} booked</span>
                          : <span style={{ fontSize: '11px', color: '#4B5563' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: ev.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)', color: ev.isActive ? '#10B981' : '#6B7280' }}>
                          {ev.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
