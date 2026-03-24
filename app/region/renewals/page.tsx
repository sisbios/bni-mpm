import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ChevronLeft, Phone, Mail, Building2, Trophy, AlertCircle } from 'lucide-react'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'
import { computeTrafficScore, TRAFFIC_COLORS } from '@/lib/traffic-light'

export const dynamic = 'force-dynamic'

const GLASS = {
  background: 'rgba(10,14,26,0.6)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
} as const

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function urgencyColor(days: number) {
  if (days <= 14) return '#CC0000'
  if (days <= 30) return '#F59E0B'
  return '#10B981'
}

function urgencyLabel(days: number) {
  if (days <= 0) return 'Expired'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export default async function RenewalsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const now = new Date()
  const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate())
  const weeks26Ago = new Date(now)
  weeks26Ago.setDate(weeks26Ago.getDate() - 182)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const chapters = await db.chapter.findMany({
    where: regionId ? { regionId } : undefined,
    select: { id: true, name: true, city: true, meetingDay: true },
  })
  const chapterIds = chapters.map(c => c.id)
  const chapterMap = Object.fromEntries(chapters.map(c => [c.id, c]))

  // Fetch all renewing members with full details
  const renewingMembers = await db.user.findMany({
    where: {
      chapterId: { in: chapterIds },
      isActive: true,
      ...NON_ADMIN_FILTER,
      membershipValidTill: { gte: now, lte: twoMonthsFromNow },
    },
    select: {
      id: true, name: true, email: true, phone: true,
      business: true, category: true, role: true,
      membershipValidTill: true, joinedAt: true,
      chapterId: true, avatar: true,
    },
    orderBy: { membershipValidTill: 'asc' },
  })

  if (renewingMembers.length === 0) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Link href="/region" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
              <ChevronLeft size={14} /> Dashboard
            </div>
          </Link>
        </div>
        <div style={{ ...GLASS, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', marginBottom: '4px' }}>No upcoming renewals</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>All memberships are valid beyond 60 days.</div>
        </div>
      </div>
    )
  }

  const memberIds = renewingMembers.map(m => m.id)

  // Fetch palms + achievements in parallel
  const [palmsAll, achievementsAll] = await Promise.all([
    db.palmsEntry.findMany({
      where: { userId: { in: memberIds }, weekDate: { gte: weeks26Ago } },
      select: {
        userId: true, attended: true, substitute: true, late: true, medical: true,
        referrals: true, visitors: true, testimonials: true, oneToOnes: true,
        ceus: true, tyfcbAmount: true, week: true, weekDate: true,
      },
    }),
    db.greenAchievement.findMany({
      where: { userId: { in: memberIds }, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      select: { userId: true, points: true, category: true },
    }),
  ])

  // total achievements (all time) per member
  const totalAchievements = await db.greenAchievement.groupBy({
    by: ['userId'],
    where: { userId: { in: memberIds } },
    _sum: { points: true },
    _count: { id: true },
  })
  const achMap = Object.fromEntries(totalAchievements.map(a => [a.userId, a]))

  // Group palms by userId
  const palmsByUser = new Map<string, typeof palmsAll>()
  for (const p of palmsAll) {
    if (!palmsByUser.has(p.userId)) palmsByUser.set(p.userId, [])
    palmsByUser.get(p.userId)!.push(p)
  }

  // Compute traffic scores
  const scores = new Map(
    renewingMembers.map(m => {
      const entries = palmsByUser.get(m.id) ?? []
      return [m.id, entries.length > 0 ? computeTrafficScore(entries) : null]
    })
  )

  // Group by urgency bucket
  const critical = renewingMembers.filter(m => daysUntil(new Date(m.membershipValidTill!)) <= 14)
  const soon     = renewingMembers.filter(m => { const d = daysUntil(new Date(m.membershipValidTill!)); return d > 14 && d <= 30 })
  const upcoming = renewingMembers.filter(m => daysUntil(new Date(m.membershipValidTill!)) > 30)

  const buckets = [
    { label: 'Critical — expiring within 14 days', members: critical, accent: '#CC0000' },
    { label: 'Due Soon — 15–30 days',              members: soon,     accent: '#F59E0B' },
    { label: 'Upcoming — 31–60 days',              members: upcoming, accent: '#10B981' },
  ].filter(b => b.members.length > 0)

  return (
    <>
      <style>{`
        .rn-grid { display:grid; grid-template-columns:1fr; gap:12px; max-width:900px; margin:0 auto; }
        .rn-tl { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; }
        @media(min-width:640px){ .rn-tl{ grid-template-columns:repeat(6,1fr); } }
      `}</style>

      <div className="rn-grid">

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
          <Link href="/region" style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#9CA3AF', padding:'5px 10px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)' }}>
              <ChevronLeft size={13} /> Dashboard
            </div>
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'3px', height:'22px', background:'linear-gradient(180deg,#CC0000,#C9A84C)', borderRadius:'2px' }} />
            <div>
              <h1 style={{ fontFamily:'var(--font-bebas),sans-serif', fontSize:'22px', letterSpacing:'2px', color:'#fff', lineHeight:1 }}>
                UPCOMING RENEWALS
              </h1>
              <p style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'1px' }}>
                {renewingMembers.length} member{renewingMembers.length !== 1 ? 's' : ''} · next 60 days
              </p>
            </div>
          </div>
        </div>

        {/* Buckets */}
        {buckets.map(bucket => (
          <div key={bucket.label}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:bucket.accent, boxShadow:`0 0 6px ${bucket.accent}80` }} />
              <span style={{ fontSize:'11px', fontWeight:'700', color:bucket.accent, textTransform:'uppercase', letterSpacing:'0.6px' }}>
                {bucket.label}
              </span>
              <span style={{ fontSize:'10px', color:'#6B7280' }}>({bucket.members.length})</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {bucket.members.map(member => {
                const score = scores.get(member.id)
                const tlHex = score ? TRAFFIC_COLORS[score.color] : '#374151'
                const days = daysUntil(new Date(member.membershipValidTill!))
                const uc = urgencyColor(days)
                const chapter = member.chapterId ? chapterMap[member.chapterId] : null
                const ach = achMap[member.id]
                const initials = member.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

                const tlMetrics = score ? [
                  { label: 'Refs',    pts: score.referrals,    max: 20 },
                  { label: 'Visitors',pts: score.visitors,     max: 20 },
                  { label: 'TYFCB',   pts: score.tyfcb,        max: 15 },
                  { label: 'Training',pts: score.training,     max: 15 },
                  { label: 'Testimony',pts: score.testimonials,max: 10 },
                  { label: 'Attend',  pts: score.absence,      max: 15 },
                ] : []

                return (
                  <div key={member.id} style={{ ...GLASS, border:`1px solid ${tlHex}20`, overflow:'hidden' }}>

                    {/* Top accent */}
                    <div style={{ height:'2px', background:`linear-gradient(90deg,${tlHex},${uc})` }} />

                    <div style={{ padding:'12px 14px' }}>
                      {/* Row 1: Avatar + Name + Expiry */}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'10px', flexShrink:0, background:`${tlHex}20`, border:`1px solid ${tlHex}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-bebas),sans-serif', fontSize:'17px', color:tlHex }}>
                          {initials}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'7px', flexWrap:'wrap' }}>
                            <span style={{ fontSize:'14px', fontWeight:'700', color:'#fff' }}>{member.name}</span>
                            {score && (
                              <span style={{ fontSize:'9px', padding:'1px 7px', borderRadius:'20px', background:`${tlHex}20`, color:tlHex, border:`1px solid ${tlHex}40`, fontWeight:'700', textTransform:'uppercase' }}>
                                {score.color} · {score.total}/100
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {member.business || member.category || member.role}
                          </div>
                        </div>
                        {/* Expiry badge */}
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:'11px', fontWeight:'700', color:uc }}>{urgencyLabel(days)}</div>
                          <div style={{ fontSize:'9px', color:'#6B7280', marginTop:'1px' }}>
                            {new Date(member.membershipValidTill!).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Contact + Chapter info */}
                      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'10px' }}>
                        {member.phone && (
                          <a href={`tel:${member.phone}`} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#9CA3AF', textDecoration:'none' }}>
                            <Phone size={10} style={{ color:'#10B981' }} />
                            {member.phone}
                          </a>
                        )}
                        {member.email && (
                          <a href={`mailto:${member.email}`} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#9CA3AF', textDecoration:'none' }}>
                            <Mail size={10} style={{ color:'#3B82F6' }} />
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', maxWidth:'160px', whiteSpace:'nowrap' }}>{member.email}</span>
                          </a>
                        )}
                        {chapter && (
                          <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#9CA3AF' }}>
                            <Building2 size={10} style={{ color:'#CC0000' }} />
                            <span>{chapter.name}{chapter.city ? ` · ${chapter.city}` : ''}</span>
                          </div>
                        )}
                        {member.joinedAt && (
                          <div style={{ fontSize:'10px', color:'#6B7280' }}>
                            Member since {new Date(member.joinedAt).getFullYear()}
                          </div>
                        )}
                      </div>

                      {/* Row 3: Achievement summary */}
                      {ach && (
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 10px', borderRadius:'7px', background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.15)', marginBottom:'10px' }}>
                          <Trophy size={11} style={{ color:'#C9A84C', flexShrink:0 }} />
                          <span style={{ fontSize:'11px', color:'#C9A84C', fontWeight:'600' }}>
                            {ach._count.id} achievement{ach._count.id !== 1 ? 's' : ''}
                          </span>
                          <span style={{ fontSize:'10px', color:'#9CA3AF' }}>
                            {ach._sum.points ?? 0} total pts
                          </span>
                          {achievementsAll.filter(a => a.userId === member.id).length > 0 && (
                            <span style={{ fontSize:'9px', padding:'1px 6px', borderRadius:'20px', background:'rgba(201,168,76,0.2)', color:'#C9A84C', border:'1px solid rgba(201,168,76,0.3)', marginLeft:'auto' }}>
                              +{achievementsAll.filter(a => a.userId === member.id).reduce((s, a) => s + a.points, 0)} this month
                            </span>
                          )}
                        </div>
                      )}

                      {/* Row 4: Traffic light breakdown */}
                      {score && (
                        <div className="rn-tl">
                          {tlMetrics.map(m => {
                            const pct = m.max > 0 ? m.pts / m.max : 0
                            const c = pct >= 0.8 ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#CC0000'
                            return (
                              <div key={m.label} style={{ textAlign:'center', padding:'5px 3px', borderRadius:'6px', background:`${c}08`, border:`1px solid ${c}18` }}>
                                <div style={{ fontSize:'11px', fontWeight:'700', color:c, fontFamily:'var(--font-bebas),sans-serif', lineHeight:1 }}>
                                  {m.pts}<span style={{ fontSize:'8px', color:'#6B7280' }}>/{m.max}</span>
                                </div>
                                <div style={{ height:'2px', borderRadius:'1px', background:'rgba(255,255,255,0.06)', marginTop:'3px', overflow:'hidden' }}>
                                  <div style={{ height:'100%', width:`${Math.min(100, pct * 100)}%`, background:c }} />
                                </div>
                                <div style={{ fontSize:'7px', color:'#9CA3AF', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.2px' }}>{m.label}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {!score && (
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'7px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                          <AlertCircle size={10} style={{ color:'#4B5563' }} />
                          <span style={{ fontSize:'10px', color:'#6B7280' }}>No PALMS data — traffic light not tracked</span>
                        </div>
                      )}

                      {/* View profile link */}
                      <div style={{ marginTop:'10px', display:'flex', justifyContent:'flex-end' }}>
                        <Link href={`/dashboard/members/${member.id}`} style={{ textDecoration:'none' }}>
                          <div style={{ fontSize:'10px', color:'#CC0000', fontWeight:'600', padding:'4px 10px', borderRadius:'20px', border:'1px solid rgba(204,0,0,0.25)', background:'rgba(204,0,0,0.08)' }}>
                            View Profile →
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      </div>
    </>
  )
}
