import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Building2, Users, TrendingUp, Activity, Plus, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RegionOverviewPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const [region, chapters, totalMembers, activeChapters] = await Promise.all([
    regionId
      ? db.region.findUnique({ where: { id: regionId } })
      : db.region.findFirst({ where: { isActive: true } }),
    regionId
      ? db.chapter.findMany({ where: { regionId, isActive: true }, orderBy: { name: 'asc' } })
      : db.chapter.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, take: 20 }),
    db.user.count({ where: regionId ? { regionId } : undefined }),
    regionId
      ? db.chapter.count({ where: { regionId, isActive: true } })
      : db.chapter.count({ where: { isActive: true } }),
  ])

  const stats = [
    { label: 'Total Chapters', value: activeChapters, icon: Building2, color: '#3B82F6' },
    { label: 'Total Members', value: totalMembers, icon: Users, color: '#10B981' },
    { label: 'Active Chapters', value: activeChapters, icon: Activity, color: '#C9A84C' },
    { label: 'Region Growth', value: '+12%', icon: TrendingUp, color: '#8B5CF6' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          REGION <span style={{ color: '#3B82F6' }}>OVERVIEW</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
          {region?.name ?? 'BNI Region'} — All chapters at a glance
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '36px', color: '#ffffff', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chapters list */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Chapters</h2>
          <Link href="/region/chapters/new" style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
            borderRadius: '8px', textDecoration: 'none',
            background: 'rgba(30,64,175,0.15)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#3B82F6', fontSize: '13px', fontWeight: '600',
          }}>
            <Plus size={14} /> Add Chapter
          </Link>
        </div>

        {chapters.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4B5563' }}>
            <Building2 size={40} style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0 }}>No chapters yet. Create your first chapter.</p>
          </div>
        ) : (
          <div>
            {chapters.map((ch, idx) => (
              <Link
                key={ch.id}
                href={`/region/chapters/${ch.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px', textDecoration: 'none',
                  borderBottom: idx < chapters.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-bebas), sans-serif', fontSize: '16px', color: '#3B82F6',
                }}>
                  {ch.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{ch.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                    {ch.city ?? 'No city'} · {ch.meetingDay ?? 'Day TBD'} {ch.meetingTime ?? ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    background: ch.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                    color: ch.isActive ? '#10B981' : '#6B7280',
                  }}>
                    {ch.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <ArrowRight size={14} style={{ color: '#4B5563' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
