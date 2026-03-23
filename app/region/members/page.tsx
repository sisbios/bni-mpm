import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Users } from 'lucide-react'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

export const dynamic = 'force-dynamic'

export default async function RegionMembersPage({ searchParams }: { searchParams: Promise<{ chapter?: string; q?: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const sp = await searchParams
  const chapterFilter = sp?.chapter
  const q = sp?.q?.toLowerCase()

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
  const chapterIds = chapters.map((c) => c.id)

  const members = await db.user.findMany({
    where: {
      chapterId: chapterFilter ? chapterFilter : { in: chapterIds },
      isActive: true,
      ...NON_ADMIN_FILTER,
    },
    orderBy: [{ chapterId: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, role: true, accessLevel: true, phone: true, business: true, chapterId: true, joinedAt: true },
  })

  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c.name]))
  const filtered = q ? members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.business ?? '').toLowerCase().includes(q)) : members

  const accessColors: Record<string, string> = { superadmin: '#CC0000', officer: '#C9A84C', member: '#6B7280', regionAdmin: '#3B82F6', platform: '#8B5CF6' }

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
            ALL <span style={{ color: '#3B82F6' }}>MEMBERS</span>
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>{filtered.length} member{filtered.length !== 1 ? 's' : ''} across {chapters.length} chapters</p>
        </div>
        {/* Filters */}
        <form method="GET" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            name="q" defaultValue={q} placeholder="Search name, email, business..."
            style={{ padding: '9px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '13px', width: '220px', outline: 'none' }}
          />
          <select name="chapter" defaultValue={chapterFilter ?? ''} style={{ padding: '9px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: chapterFilter ? '#ffffff' : '#6B7280', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
            <option value="">All Chapters</option>
            {chapters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" style={{ padding: '9px 18px', borderRadius: '9px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Filter</button>
        </form>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#4B5563' }}>
            <Users size={40} style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0 }}>No members found.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 140px 120px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Member', 'Chapter', 'Role', 'Access'].map((h) => (
                <span key={h} style={{ fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</span>
              ))}
            </div>
            {filtered.map((m, idx) => (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 180px 140px 120px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{m.email}</div>
                  {m.business && <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '1px' }}>{m.business}</div>}
                </div>
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{m.chapterId ? (chapterMap[m.chapterId] ?? '—') : '—'}</span>
                <span style={{ fontSize: '13px', color: '#9CA3AF', textTransform: 'capitalize' }}>{m.role}</span>
                <span style={{
                  display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                  background: `${accessColors[m.accessLevel] ?? '#6B7280'}18`,
                  color: accessColors[m.accessLevel] ?? '#6B7280',
                  width: 'fit-content',
                }}>
                  {m.accessLevel}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
