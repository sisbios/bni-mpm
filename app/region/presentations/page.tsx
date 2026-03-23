import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Mic2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegionPresentationsPage({
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

  const slots = await db.meetingSlot.findMany({
    where: { chapterId: { in: chapterIds } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      chapterId: true,
      slotType: true,
      slotNumber: true,
      topic: true,
      status: true,
      createdAt: true,
      assignedUserName: true,
      event: { select: { date: true, title: true } },
    },
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          REGION <span style={{ color: '#3B82F6' }}>PRESENTATIONS</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
          {slots.length} presentation slot{slots.length !== 1 ? 's' : ''} across chapters
        </p>
      </div>

      {/* Filter */}
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
          <a href="/region/presentations" style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'none' }}>Clear</a>
        )}
      </form>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {slots.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <Mic2 size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ margin: 0 }}>No presentations found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Topic', 'Presenter', 'Slot Type', 'Event', 'Event Date', 'Chapter', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '11px 20px', textAlign: 'left',
                      fontSize: '11px', color: '#6B7280', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, idx) => (
                  <tr key={slot.id} style={{ borderBottom: idx < slots.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {slot.topic ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                      {slot.assignedUserName ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: 'rgba(59,130,246,0.12)', color: '#3B82F6',
                        textTransform: 'capitalize',
                      }}>
                        {slot.slotType}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                      {slot.event?.title ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                      {slot.event?.date
                        ? new Date(slot.event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#C9A84C', fontWeight: '500' }}>
                      {slot.chapterId ? (chapterMap[slot.chapterId] ?? '—') : '—'}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: slot.status === 'confirmed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        color: slot.status === 'confirmed' ? '#10B981' : '#F59E0B',
                        textTransform: 'capitalize',
                      }}>
                        {slot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
