import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Building2, Users, CalendarCheck, UserCheck, Plus, ArrowRight } from 'lucide-react'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

export const dynamic = 'force-dynamic'

export default async function RegionOverviewPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, isActive: true, city: true, meetingDay: true },
  })
  const chapterIds = chapters.map((c) => c.id)

  const [totalMembers, totalEventsThisMonth, totalVisitorsThisMonth, lastEvents, memberCountsRaw] = await Promise.all([
    db.user.count({ where: { chapterId: { in: chapterIds }, ...NON_ADMIN_FILTER } }),
    db.event.count({
      where: {
        chapterId: { in: chapterIds },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    db.visitor.count({
      where: {
        chapterId: { in: chapterIds },
        visitDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    db.event.findMany({
      where: { chapterId: { in: chapterIds } },
      orderBy: { date: 'desc' },
      select: { chapterId: true, date: true },
      distinct: ['chapterId'],
    }),
    db.user.groupBy({
      by: ['chapterId'],
      _count: { id: true },
      where: { chapterId: { in: chapterIds }, ...NON_ADMIN_FILTER },
    }),
  ])

  const memberMap: Record<string, number> = {}
  for (const row of memberCountsRaw) {
    if (row.chapterId) memberMap[row.chapterId] = row._count.id
  }
  const lastEventMap: Record<string, Date> = {}
  for (const ev of lastEvents) {
    if (ev.chapterId) lastEventMap[ev.chapterId] = ev.date
  }

  const stats = [
    { label: 'Total Chapters', value: chapters.length, color: '#3B82F6', icon: Building2 },
    { label: 'Total Members', value: totalMembers, color: '#10B981', icon: Users },
    { label: 'Events This Month', value: totalEventsThisMonth, color: '#C9A84C', icon: CalendarCheck },
    { label: 'Visitors This Month', value: totalVisitorsThisMonth, color: '#8B5CF6', icon: UserCheck },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
            REGION <span style={{ color: '#3B82F6' }}>OVERVIEW</span>
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
            Malappuram Region — All chapters at a glance
          </p>
        </div>
        <Link
          href="/region/chapters/new"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px', textDecoration: 'none',
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#3B82F6', fontSize: '13px', fontWeight: '600',
          }}
        >
          <Plus size={14} /> Create Chapter
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${s.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '36px', color: '#ffffff', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chapter summary table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Chapter Summary</h2>
          <Link href="/region/chapters" style={{
            fontSize: '12px', color: '#3B82F6', textDecoration: 'none', fontWeight: '600',
          }}>
            View All →
          </Link>
        </div>

        {chapters.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <Building2 size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ margin: 0 }}>No chapters yet. Create your first chapter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Chapter Name', 'Members', 'Last Event', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '11px 20px', textAlign: 'left',
                      fontSize: '11px', color: '#6B7280', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                    }}>{h}</th>
                  ))}
                  <th style={{ padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }} />
                </tr>
              </thead>
              <tbody>
                {chapters.map((ch, idx) => {
                  const lastEv = lastEventMap[ch.id]
                  return (
                    <tr key={ch.id} style={{ borderBottom: idx < chapters.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-bebas), sans-serif', fontSize: '14px', color: '#3B82F6',
                          }}>
                            {ch.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{ch.name}</div>
                            {ch.city && <div style={{ fontSize: '11px', color: '#6B7280' }}>{ch.city}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#9CA3AF' }}>
                        {memberMap[ch.id] ?? 0}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#9CA3AF' }}>
                        {lastEv ? new Date(lastEv).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          background: ch.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                          color: ch.isActive ? '#10B981' : '#6B7280',
                        }}>
                          {ch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Link href={`/region/chapters/${ch.id}`} style={{ color: '#4B5563', display: 'flex', justifyContent: 'flex-end' }}>
                          <ArrowRight size={14} />
                        </Link>
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
