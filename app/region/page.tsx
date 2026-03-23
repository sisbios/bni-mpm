import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Building2, Users, CalendarCheck, UserCheck, Plus } from 'lucide-react'
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

  const [totalMembers, totalEventsThisMonth, totalVisitorsThisMonth, memberCountsRaw] = await Promise.all([
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

  const stats = [
    { label: 'Total Chapters', value: chapters.length, color: '#CC0000', icon: Building2 },
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
            REGION <span style={{ color: '#CC0000' }}>OVERVIEW</span>
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
            background: 'rgba(139,0,0,0.2)', border: '1px solid rgba(204,0,0,0.3)',
            color: '#CC0000', fontSize: '13px', fontWeight: '600',
          }}
        >
          <Plus size={14} /> Create Chapter
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.color, borderRadius: '14px 14px 0 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${s.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '40px', color: '#ffffff', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chapter mini-card grid */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
            Chapter Summary
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '400', color: '#6B7280' }}>({chapters.length})</span>
          </h2>
          <Link href="/region/chapters" style={{
            fontSize: '12px', color: '#CC0000', textDecoration: 'none', fontWeight: '600',
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
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/region/chapters/${ch.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  textDecoration: 'none',
                  minHeight: '80px',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'rgba(204,0,0,0.3)'
                  el.style.background = 'rgba(204,0,0,0.05)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = 'rgba(255,255,255,0.08)'
                  el.style.background = 'rgba(255,255,255,0.04)'
                }}
              >
                {/* Initial circle */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', color: '#CC0000',
                }}>
                  {ch.name.charAt(0)}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                  {ch.city && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{ch.city}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ch.isActive ? '#10B981' : '#4B5563', flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', color: ch.isActive ? '#10B981' : '#6B7280' }}>{ch.isActive ? 'Active' : 'Inactive'}</span>
                    <span style={{ fontSize: '10px', color: '#4B5563', marginLeft: '4px' }}>·</span>
                    <Users size={10} style={{ color: '#4B5563' }} />
                    <span style={{ fontSize: '10px', color: '#6B7280' }}>{memberMap[ch.id] ?? 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
