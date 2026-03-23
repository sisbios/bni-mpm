import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

// WeeklyTask uses status: 'pending' | 'done' | 'missed' — we map to traffic light colours
function statusToLight(status: string): 'green' | 'yellow' | 'red' {
  if (status === 'done') return 'green'
  if (status === 'pending') return 'yellow'
  return 'red' // missed / other
}

export default async function RegionTrafficLightPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const chapterIds = chapters.map((c) => c.id)

  const tasks = await db.weeklyTask.findMany({
    where: { chapterId: { in: chapterIds } },
    select: { chapterId: true, status: true },
  })

  // Build per-chapter summary
  type Summary = { green: number; yellow: number; red: number; total: number }
  const summaryMap: Record<string, Summary> = {}
  for (const ch of chapters) {
    summaryMap[ch.id] = { green: 0, yellow: 0, red: 0, total: 0 }
  }
  for (const t of tasks) {
    if (!t.chapterId || !summaryMap[t.chapterId]) continue
    const s = summaryMap[t.chapterId]
    s.total++
    const light = statusToLight(t.status)
    s[light]++
  }

  const totalGreen = tasks.filter((t) => statusToLight(t.status) === 'green').length
  const totalYellow = tasks.filter((t) => statusToLight(t.status) === 'yellow').length
  const totalRed = tasks.filter((t) => statusToLight(t.status) === 'red').length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          TRAFFIC <span style={{ color: '#3B82F6' }}>LIGHT</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
          Weekly task completion status across all chapters (green = done, yellow = pending, red = missed)
        </p>
      </div>

      {/* Region-wide totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Done', value: totalGreen, color: '#10B981', dot: '#22C55E' },
          { label: 'Pending', value: totalYellow, color: '#F59E0B', dot: '#EAB308' },
          { label: 'Missed', value: totalRed, color: '#EF4444', dot: '#DC2626' },
          { label: 'Total Tasks', value: tasks.length, color: '#3B82F6', dot: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '36px', color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-chapter breakdown */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Per Chapter Breakdown</h2>
        </div>

        {chapters.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <TrendingUp size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ margin: 0 }}>No chapters found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Chapter', 'Done', 'Pending', 'Missed', 'Total', 'Health'].map((h) => (
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
                {chapters.map((ch, idx) => {
                  const s = summaryMap[ch.id]
                  const greenPct = s.total > 0 ? Math.round((s.green / s.total) * 100) : 0
                  const healthColor = greenPct >= 70 ? '#10B981' : greenPct >= 40 ? '#F59E0B' : '#EF4444'
                  return (
                    <tr key={ch.id} style={{ borderBottom: idx < chapters.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                        {ch.name}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#10B981' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
                          {s.green}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#F59E0B' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EAB308' }} />
                          {s.yellow}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#EF4444' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
                          {s.red}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#9CA3AF' }}>
                        {s.total}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {s.total > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', minWidth: '80px' }}>
                              <div style={{
                                width: `${greenPct}%`, height: '100%',
                                background: healthColor, borderRadius: '3px',
                              }} />
                            </div>
                            <span style={{ fontSize: '12px', color: healthColor, fontWeight: '600', minWidth: '36px' }}>
                              {greenPct}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#4B5563' }}>No data</span>
                        )}
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
