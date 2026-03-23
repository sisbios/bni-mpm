import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BarChart2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegionPalmsPage({
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

  const entries = await db.palmsEntry.findMany({
    where: { chapterId: { in: chapterIds } },
    orderBy: { weekDate: 'desc' },
    select: {
      id: true,
      chapterId: true,
      week: true,
      weekDate: true,
      attended: true,
      substitute: true,
      late: true,
      referrals: true,
      visitors: true,
      testimonials: true,
      oneToOnes: true,
      tyfcbAmount: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })

  const totalReferrals = entries.reduce((s, e) => s + e.referrals, 0)
  const totalVisitors = entries.reduce((s, e) => s + e.visitors, 0)
  const attendedCount = entries.filter((e) => e.attended).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          PALMS <span style={{ color: '#3B82F6' }}>REPORT</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
          {entries.length} entries · {totalReferrals} referrals · {totalVisitors} visitors · {attendedCount} attended
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
          <a href="/region/palms" style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'none' }}>Clear</a>
        )}
      </form>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <BarChart2 size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ margin: 0 }}>No PALMS entries found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Member', 'Week', 'Chapter', 'Attended', 'Referrals', 'Visitors', '1-to-1s', 'TYFCB'].map((h) => (
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
                {entries.map((entry, idx) => (
                  <tr key={entry.id} style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {entry.user?.name ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                      {new Date(entry.weekDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#C9A84C', fontWeight: '500' }}>
                      {entry.chapterId ? (chapterMap[entry.chapterId] ?? '—') : '—'}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: entry.attended ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                        color: entry.attended ? '#10B981' : '#6B7280',
                      }}>
                        {entry.late ? 'Late' : entry.substitute ? 'Sub' : entry.attended ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: '600', color: entry.referrals > 0 ? '#C9A84C' : '#6B7280' }}>
                      {entry.referrals}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: '600', color: entry.visitors > 0 ? '#3B82F6' : '#6B7280' }}>
                      {entry.visitors}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '14px', color: '#9CA3AF' }}>
                      {entry.oneToOnes}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                      {entry.tyfcbAmount > 0 ? `₹${entry.tyfcbAmount.toLocaleString('en-IN')}` : '—'}
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
