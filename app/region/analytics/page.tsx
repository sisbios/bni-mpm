import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BarChart3, TrendingUp, Users, Building2, Award, Target } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegionAnalyticsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    orderBy: { name: 'asc' },
  })
  const chapterIds = chapters.map((c) => c.id)

  const [memberCounts, eventCounts, taskCounts, achievementCounts] = await Promise.all([
    db.user.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: chapterIds } } }),
    db.event.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: chapterIds } } }),
    db.weeklyTask.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: chapterIds } } }),
    db.greenAchievement.groupBy({ by: ['chapterId'], _count: { id: true }, where: { chapterId: { in: chapterIds } } }),
  ])

  function makeMap(data: { chapterId: string | null; _count: { id: number } }[]) {
    return Object.fromEntries(data.map((d) => [d.chapterId!, d._count.id]))
  }

  const mMap = makeMap(memberCounts)
  const eMap = makeMap(eventCounts)
  const tMap = makeMap(taskCounts)
  const aMap = makeMap(achievementCounts)

  const totalMembers = memberCounts.reduce((s, d) => s + d._count.id, 0)
  const totalEvents = eventCounts.reduce((s, d) => s + d._count.id, 0)
  const totalTasks = taskCounts.reduce((s, d) => s + d._count.id, 0)
  const totalAchievements = achievementCounts.reduce((s, d) => s + d._count.id, 0)

  const topStats = [
    { label: 'Total Members', value: totalMembers, icon: Users, color: '#3B82F6' },
    { label: 'Total Events', value: totalEvents, icon: Target, color: '#10B981' },
    { label: 'Weekly Tasks', value: totalTasks, icon: BarChart3, color: '#C9A84C' },
    { label: 'Achievements', value: totalAchievements, icon: Award, color: '#8B5CF6' },
  ]

  const maxMembers = Math.max(...chapters.map((c) => mMap[c.id] ?? 0), 1)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          REGION <span style={{ color: '#3B82F6' }}>ANALYTICS</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
          Cross-chapter performance overview — {chapters.length} chapters
        </p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {topStats.map((s) => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '36px', color: '#ffffff', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-chapter breakdown */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Chapter Breakdown</h2>
        </div>

        {chapters.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <Building2 size={40} style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0 }}>No chapters to compare.</p>
          </div>
        ) : (
          <div>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', gap: '0', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px' }}>Chapter</span>
              {['Members', 'Events', 'Tasks', 'Awards'].map((h) => (
                <span key={h} style={{ fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>{h}</span>
              ))}
            </div>
            {chapters.map((ch, idx) => {
              const members = mMap[ch.id] ?? 0
              const barWidth = Math.round((members / maxMembers) * 100)
              return (
                <div key={ch.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', gap: '0',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: idx < chapters.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>{ch.name}</div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(90deg, #3B82F6, #1E40AF)', borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#3B82F6', textAlign: 'right' }}>{members}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#9CA3AF', textAlign: 'right' }}>{eMap[ch.id] ?? 0}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#9CA3AF', textAlign: 'right' }}>{tMap[ch.id] ?? 0}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#9CA3AF', textAlign: 'right' }}>{aMap[ch.id] ?? 0}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Trend placeholder */}
      <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', textAlign: 'center', color: '#374151' }}>
        <TrendingUp size={32} style={{ margin: '0 auto 10px' }} />
        <p style={{ margin: 0, fontSize: '14px' }}>Time-series charts coming in Phase 6</p>
      </div>
    </div>
  )
}
