import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BarChart2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ATTEND_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  present:    { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', label: 'Present' },
  absent:     { bg: 'rgba(204,0,0,0.10)',      color: '#CC0000', label: 'Absent' },
  late:       { bg: 'rgba(107,114,128,0.15)',  color: '#9CA3AF', label: 'Late' },
  medical:    { bg: 'rgba(59,130,246,0.12)',   color: '#3B82F6', label: 'Medical' },
  substitute: { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B', label: 'Substitute' },
}

function attendLabel(e: { attended: boolean; substitute: boolean; late: boolean; medical: boolean }) {
  if (e.medical)    return 'medical'
  if (e.substitute) return 'substitute'
  if (e.attended && e.late) return 'late'
  if (e.attended)   return 'present'
  return 'absent'
}

export default async function RegionPalmsPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; week?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const sp = await searchParams
  const selectedChapter = sp.chapter ?? ''
  const selectedWeek = sp.week ?? ''

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
    where: {
      chapterId: { in: chapterIds },
      ...(selectedWeek ? { week: selectedWeek } : {}),
    },
    orderBy: [{ weekDate: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      chapterId: true,
      week: true,
      weekDate: true,
      attended: true,
      substitute: true,
      late: true,
      medical: true,
      user: { select: { name: true } },
    },
  })

  // Unique weeks for filter
  const weeks = [...new Set(entries.map((e) => e.week))].sort().reverse()

  const presentCount    = entries.filter((e) => e.attended && !e.late && !e.substitute && !e.medical).length
  const absentCount     = entries.filter((e) => !e.attended && !e.medical && !e.substitute).length
  const lateCount       = entries.filter((e) => e.attended && e.late).length
  const medicalCount    = entries.filter((e) => e.medical).length
  const substituteCount = entries.filter((e) => e.substitute).length

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          PALMS <span style={{ color: '#3B82F6' }}>REPORT</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px', marginBottom: 0 }}>
          Attendance summary across chapters
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Present',    value: presentCount,    color: '#10B981' },
          { label: 'Absent',     value: absentCount,     color: '#CC0000' },
          { label: 'Late',       value: lateCount,       color: '#9CA3AF' },
          { label: 'Medical',    value: medicalCount,    color: '#3B82F6' },
          { label: 'Substitute', value: substituteCount, color: '#F59E0B' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px', padding: '12px 10px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '24px', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          name="chapter"
          defaultValue={selectedChapter}
          style={{
            background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '7px', color: '#ffffff', padding: '7px 12px', fontSize: '13px',
            outline: 'none', colorScheme: 'dark', flex: '1 1 160px',
          }}
        >
          <option value="">All Chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id} style={{ background: '#0A0F1E' }}>{c.name}</option>
          ))}
        </select>
        <select
          name="week"
          defaultValue={selectedWeek}
          style={{
            background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '7px', color: '#ffffff', padding: '7px 12px', fontSize: '13px',
            outline: 'none', colorScheme: 'dark', flex: '1 1 160px',
          }}
        >
          <option value="">All Weeks</option>
          {weeks.map((w) => (
            <option key={w} value={w} style={{ background: '#0A0F1E' }}>{w}</option>
          ))}
        </select>
        <button type="submit" style={{
          padding: '7px 16px', borderRadius: '7px', border: '1px solid rgba(59,130,246,0.3)',
          background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: '13px',
          fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>Filter</button>
        {(selectedChapter || selectedWeek) && (
          <a href="/region/palms" style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'none', whiteSpace: 'nowrap' }}>Clear</a>
        )}
      </form>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <BarChart2 size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No PALMS entries found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Member', 'Chapter', 'Week', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '11px', color: '#6B7280', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '0.7px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const key = attendLabel(entry as any)
                  const style = ATTEND_STYLE[key]
                  return (
                    <tr key={entry.id} style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap' }}>
                        {entry.user?.name ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#C9A84C', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {entry.chapterId ? (chapterMap[entry.chapterId] ?? '—') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {new Date(entry.weekDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                          background: style.bg, color: style.color, whiteSpace: 'nowrap',
                        }}>
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {entries.length > 0 && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#4B5563' }}>
            {entries.length} records
          </div>
        )}
      </div>
    </div>
  )
}
