import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegionVisitorsPage({
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

  const visitors = await db.visitor.findMany({
    where: { chapterId: { in: chapterIds } },
    orderBy: { visitDate: 'desc' },
    select: {
      id: true,
      chapterId: true,
      name: true,
      phone: true,
      email: true,
      business: true,
      category: true,
      visitDate: true,
      eoiSubmitted: true,
      week: true,
    },
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          VISITORS <span style={{ color: '#3B82F6' }}>POOL</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
          {visitors.length} visitor{visitors.length !== 1 ? 's' : ''} across chapters ·{' '}
          {visitors.filter((v) => v.eoiSubmitted).length} EOI submitted
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
          <a href="/region/visitors" style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'none' }}>Clear</a>
        )}
      </form>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {visitors.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <UserCheck size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ margin: 0 }}>No visitors found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Business', 'Category', 'Phone', 'Chapter', 'Visit Date', 'EOI'].map((h) => (
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
                {visitors.map((v, idx) => (
                  <tr key={v.id} style={{ borderBottom: idx < visitors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {v.name}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                      {v.business ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                      {v.category ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                      {v.phone ?? '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#C9A84C', fontWeight: '500' }}>
                      {v.chapterId ? (chapterMap[v.chapterId] ?? '—') : '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '13px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                      {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: v.eoiSubmitted ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                        color: v.eoiSubmitted ? '#10B981' : '#6B7280',
                      }}>
                        {v.eoiSubmitted ? 'Submitted' : 'Pending'}
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
