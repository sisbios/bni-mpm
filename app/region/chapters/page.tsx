import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Plus, Building2, ArrowRight, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ChaptersListPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    orderBy: { name: 'asc' },
    include: { region: { select: { name: true } } },
  })

  // Count members per chapter
  const memberCounts = await db.user.groupBy({
    by: ['chapterId'],
    _count: { id: true },
    where: { chapterId: { in: chapters.map((c) => c.id) } },
  })
  const countMap = Object.fromEntries(memberCounts.map((m) => [m.chapterId!, m._count.id]))

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
            CHAPTERS
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} in your region
          </p>
        </div>
        <Link href="/region/chapters/new" style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
          borderRadius: '10px', textDecoration: 'none',
          background: 'rgba(30,64,175,0.2)', border: '1px solid rgba(59,130,246,0.35)',
          color: '#3B82F6', fontSize: '14px', fontWeight: '600',
        }}>
          <Plus size={16} /> New Chapter
        </Link>
      </div>

      {chapters.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '60px', textAlign: 'center',
        }}>
          <Building2 size={48} style={{ color: '#374151', margin: '0 auto 16px' }} />
          <p style={{ color: '#4B5563', margin: 0, fontSize: '16px' }}>No chapters yet.</p>
          <Link href="/region/chapters/new" style={{ display: 'inline-block', marginTop: '16px', color: '#3B82F6', fontWeight: '600', textDecoration: 'none' }}>
            Create your first chapter →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {chapters.map((ch) => (
            <div
              key={ch.id}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                background: ch.isActive ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.1)',
                border: `1px solid ${ch.isActive ? 'rgba(59,130,246,0.25)' : 'rgba(107,114,128,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px',
                color: ch.isActive ? '#3B82F6' : '#6B7280',
              }}>
                {ch.name.charAt(0)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>{ch.name}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                    background: ch.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                    color: ch.isActive ? '#10B981' : '#6B7280',
                  }}>
                    {ch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  {ch.city ? `${ch.city} · ` : ''}{ch.meetingDay ?? 'Day TBD'} {ch.meetingTime ?? ''} · <span style={{ color: '#9CA3AF' }}>{countMap[ch.id] ?? 0} members</span>
                </div>
                <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px' }}>slug: {ch.slug}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/region/chapters/${ch.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  borderRadius: '8px', textDecoration: 'none',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9CA3AF', fontSize: '13px', fontWeight: '600',
                }}>
                  <Pencil size={13} /> Edit
                </Link>
                <Link href={`/region/chapters/${ch.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px',
                  borderRadius: '8px', textDecoration: 'none',
                  background: 'transparent', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#3B82F6', fontSize: '13px',
                }}>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
