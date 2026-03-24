import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Building2, Users, CalendarCheck, UserCheck, Plus, AlertCircle, TrendingUp, ChevronRight, Trophy } from 'lucide-react'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'

export const dynamic = 'force-dynamic'

// ── Inline SVG bar chart (server-rendered, zero JS) ───────────────────────
function BarChart({ data, colors, height = 52 }: {
  data: { label: string; values: number[] }[]
  colors: string[]
  height?: number
}) {
  const maxVal = Math.max(...data.flatMap(d => d.values.reduce((a, b) => a + b, 0)), 1)
  const W = 260, H = height
  const slotW = W / data.length
  const barW = slotW - 6

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const total = d.values.reduce((a, b) => a + b, 0)
        const x = i * slotW + 3
        let yOffset = H
        return (
          <g key={i}>
            {d.values.map((v, ci) => {
              const bh = maxVal > 0 ? (v / maxVal) * H : 0
              yOffset -= bh
              const yPos = yOffset
              yOffset = yOffset  // already decremented
              return (
                <rect key={ci} x={x} y={yPos} width={barW} height={bh} rx="2"
                  fill={colors[ci % colors.length]} opacity={bh > 0 ? 0.82 : 0.12} />
              )
            })}
            {total > 0 && (
              <text x={x + barW / 2}
                y={Math.max(H - (total / maxVal) * H - 2, 7)}
                textAnchor="middle" fill={colors[0]} fontSize="7" fontFamily="sans-serif" fontWeight="bold">
                {total}
              </text>
            )}
            <text x={x + barW / 2} y={H + 11} textAnchor="middle" fill="#6B7280" fontSize="7.5" fontFamily="sans-serif">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const GLASS = {
  background: 'rgba(10,14,26,0.6)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
} as const

export default async function RegionOverviewPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const { accessLevel, regionId } = session.user as { accessLevel: string; regionId: string | null }
  if (accessLevel !== 'regionAdmin' && accessLevel !== 'platform') redirect('/dashboard')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate())
  const threeMonthsEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59)

  const [region, chapters] = await Promise.all([
    regionId ? db.region.findUnique({ where: { id: regionId }, select: { name: true } }) : null,
    db.chapter.findMany({
      where: regionId ? { regionId } : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, isActive: true, city: true, meetingDay: true },
    }),
  ])
  const chapterIds = chapters.map(c => c.id)

  const [
    totalMembers,
    totalEventsThisMonth,
    totalVisitorsThisMonth,
    memberCountsRaw,
    upcomingRenewals,
    newMembersRaw,
    visitorsRaw,
    achievementsRaw,
    upcomingEventsRaw,
    topChapterStats,
  ] = await Promise.all([
    db.user.count({ where: { chapterId: { in: chapterIds }, isActive: true, ...NON_ADMIN_FILTER } }),
    db.event.count({ where: { isActive: true, date: { gte: startOfMonth, lte: endOfMonth }, chapterId: { in: chapterIds } } }),
    db.visitor.count({ where: { chapterId: { in: chapterIds }, visitDate: { gte: startOfMonth, lte: endOfMonth } } }),
    db.user.groupBy({
      by: ['chapterId'],
      _count: { id: true },
      where: { chapterId: { in: chapterIds }, isActive: true, ...NON_ADMIN_FILTER },
    }),
    db.user.findMany({
      where: {
        chapterId: { in: chapterIds }, isActive: true, ...NON_ADMIN_FILTER,
        membershipValidTill: { gte: now, lte: twoMonthsFromNow },
      },
      select: { id: true, membershipValidTill: true },
      orderBy: { membershipValidTill: 'asc' },
    }),
    db.user.findMany({
      where: { chapterId: { in: chapterIds }, isActive: true, ...NON_ADMIN_FILTER, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    db.visitor.findMany({
      where: { chapterId: { in: chapterIds }, visitDate: { gte: sixMonthsAgo } },
      select: { visitDate: true },
    }),
    db.greenAchievement.findMany({
      where: { chapterId: { in: chapterIds }, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, points: true },
    }),
    db.event.findMany({
      where: {
        isActive: true,
        date: { gte: startOfMonth, lte: threeMonthsEnd },
        OR: [
          { chapterId: { in: chapterIds } },
          ...(regionId ? [{ regionId }] : []),
        ],
      },
      select: { date: true, regionId: true },
    }),
    db.greenAchievement.groupBy({
      by: ['chapterId'],
      where: { chapterId: { in: chapterIds }, createdAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { points: true },
      _count: { id: true },
      orderBy: { _sum: { points: 'desc' } },
      take: 5,
    }),
  ])

  // ── member map ──
  const memberMap: Record<string, number> = {}
  for (const r of memberCountsRaw) if (r.chapterId) memberMap[r.chapterId] = r._count.id

  // ── renewal urgency ──
  const critical = upcomingRenewals.filter(m => {
    const days = Math.ceil((new Date(m.membershipValidTill!).getTime() - now.getTime()) / 86400000)
    return days <= 14
  }).length
  const dueSoon = upcomingRenewals.length - critical

  // ── date key helper ──
  const mkKey = (d: Date | string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${dt.getMonth()}`
  }

  // ── 6-month chart data ──
  const months6: { label: string; key: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months6.push({ label: d.toLocaleDateString('en', { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}` })
  }

  const memberGrowth = months6.map(m => ({
    label: m.label,
    values: [newMembersRaw.filter(u => mkKey(u.createdAt) === m.key).length],
  }))
  const visitorTrend = months6.map(m => ({
    label: m.label,
    values: [visitorsRaw.filter(v => mkKey(v.visitDate) === m.key).length],
  }))
  const achievementTrend = months6.map(m => ({
    label: m.label,
    values: [achievementsRaw.filter(a => mkKey(a.createdAt) === m.key).reduce((s, a) => s + a.points, 0)],
  }))

  // ── events next 3 months (chapter + regional, stacked) ──
  const months3: { label: string; key: string }[] = []
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months3.push({ label: d.toLocaleDateString('en', { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}` })
  }
  const eventsBy3Months = months3.map(m => ({
    label: m.label,
    values: [
      upcomingEventsRaw.filter(e => mkKey(e.date) === m.key && !e.regionId).length,  // chapter
      upcomingEventsRaw.filter(e => mkKey(e.date) === m.key && !!e.regionId).length, // regional
    ],
  }))

  // ── top chapters with names ──
  const topChapters = topChapterStats.map(a => ({
    ...a,
    chapter: chapters.find(c => c.id === a.chapterId),
  }))

  const kpis = [
    { label: 'Chapters', value: chapters.length, color: '#CC0000', icon: Building2, link: '/region/chapters' },
    { label: 'Members', value: totalMembers, color: '#10B981', icon: Users, link: '/region/members' },
    { label: 'Events This Month', value: totalEventsThisMonth, color: '#C9A84C', icon: CalendarCheck, link: '/region/calendar' },
    { label: 'Visitors This Month', value: totalVisitorsThisMonth, color: '#8B5CF6', icon: UserCheck, link: '/region/visitors' },
  ]

  return (
    <>
      <style>{`
        .rg-grid { display:grid; grid-template-columns:1fr; gap:12px; max-width:1100px; margin:0 auto; }
        .rg-kpi  { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .rg-two  { display:grid; grid-template-columns:1fr; gap:12px; }
        .rg-charts { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        @media(min-width:640px){ .rg-kpi{ grid-template-columns:repeat(4,1fr); } }
        @media(min-width:768px){ .rg-two{ grid-template-columns:1fr 1fr; } }
      `}</style>

      <div className="rg-grid">

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'3px', height:'26px', background:'linear-gradient(180deg,#CC0000,#C9A84C)', borderRadius:'2px', flexShrink:0 }} />
            <div>
              <h1 style={{ fontFamily:'var(--font-bebas),sans-serif', fontSize:'26px', letterSpacing:'2px', color:'#fff', lineHeight:1 }}>
                REGION <span style={{ color:'#CC0000' }}>OVERVIEW</span>
              </h1>
              <p style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'1px' }}>
                {region?.name ?? 'Region'} · {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {[
              { href:'/region/chapters/new', label:'+ Chapter', color:'#CC0000' },
              { href:'/region/calendar',     label:'Calendar',  color:'#C9A84C' },
              { href:'/region/members',      label:'Members',   color:'#10B981' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
                <div style={{ fontSize:'11px', fontWeight:'700', padding:'5px 12px', borderRadius:'20px', border:`1px solid ${a.color}40`, background:`${a.color}12`, color:a.color }}>
                  {a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="rg-kpi">
          {kpis.map(k => (
            <Link key={k.label} href={k.link} style={{ textDecoration:'none' }}>
              <div style={{ ...GLASS, padding:'12px 14px', border:`1px solid ${k.color}25`, display:'flex', alignItems:'center', gap:'10px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:k.color, opacity:0.7 }} />
                <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:`${k.color}15`, border:`1px solid ${k.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <k.icon size={15} style={{ color:k.color }} />
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-bebas),sans-serif', fontSize:'28px', color:'#fff', lineHeight:1 }}>{k.value}</div>
                  <div style={{ fontSize:'9px', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.4px' }}>{k.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Renewals Alert ── */}
        {upcomingRenewals.length > 0 && (
          <div style={{ ...GLASS, padding:'12px 16px', border: critical > 0 ? '1px solid rgba(204,0,0,0.35)' : '1px solid rgba(245,158,11,0.3)', background: critical > 0 ? 'rgba(204,0,0,0.06)' : 'rgba(245,158,11,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <AlertCircle size={14} style={{ color: critical > 0 ? '#CC0000' : '#F59E0B', flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'700', color:'#fff' }}>
                    {upcomingRenewals.length} Membership Renewal{upcomingRenewals.length > 1 ? 's' : ''}
                    <span style={{ fontSize:'10px', color:'#9CA3AF', fontWeight:'400', marginLeft:'6px' }}>next 60 days</span>
                  </div>
                  <div style={{ display:'flex', gap:'8px', marginTop:'4px', flexWrap:'wrap' }}>
                    {critical > 0 && (
                      <span style={{ fontSize:'10px', padding:'1px 8px', borderRadius:'20px', background:'rgba(204,0,0,0.2)', color:'#FF6B6B', border:'1px solid rgba(204,0,0,0.3)', fontWeight:'600' }}>
                        🔴 {critical} critical (&lt;14d)
                      </span>
                    )}
                    {dueSoon > 0 && (
                      <span style={{ fontSize:'10px', padding:'1px 8px', borderRadius:'20px', background:'rgba(245,158,11,0.15)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.3)', fontWeight:'600' }}>
                        🟡 {dueSoon} due soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/region/renewals" style={{ textDecoration:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#CC0000', fontWeight:'700', padding:'6px 14px', borderRadius:'20px', border:'1px solid rgba(204,0,0,0.3)', background:'rgba(204,0,0,0.1)', whiteSpace:'nowrap' }}>
                  View Details <ChevronRight size={11} />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── Events (next 3 months) + Member Growth ── */}
        <div className="rg-charts">
          <div style={{ ...GLASS, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'4px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <CalendarCheck size={11} style={{ color:'#C9A84C' }} />
                <span style={{ fontSize:'11px', fontWeight:'700', color:'#fff' }}>Events Scheduled</span>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'8px', color:'#9CA3AF' }}>
                  <span style={{ display:'inline-block', width:'6px', height:'6px', borderRadius:'1px', background:'#C9A84C' }} />Chapter
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'8px', color:'#9CA3AF' }}>
                  <span style={{ display:'inline-block', width:'6px', height:'6px', borderRadius:'1px', background:'#CC0000' }} />Regional
                </span>
                <span style={{ fontSize:'8px', color:'#4B5563' }}>3 months</span>
              </div>
            </div>
            <BarChart data={eventsBy3Months} colors={['#C9A84C', '#CC0000']} height={52} />
          </div>

          <div style={{ ...GLASS, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'8px' }}>
              <Users size={11} style={{ color:'#10B981' }} />
              <span style={{ fontSize:'11px', fontWeight:'700', color:'#fff' }}>New Members</span>
              <span style={{ fontSize:'9px', color:'#4B5563', marginLeft:'auto' }}>6 months</span>
            </div>
            <BarChart data={memberGrowth} colors={['#10B981']} height={52} />
          </div>
        </div>

        {/* ── Visitors + Achievement Trends ── */}
        <div className="rg-charts">
          <div style={{ ...GLASS, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'8px' }}>
              <UserCheck size={11} style={{ color:'#8B5CF6' }} />
              <span style={{ fontSize:'11px', fontWeight:'700', color:'#fff' }}>Visitors Brought</span>
              <span style={{ fontSize:'9px', color:'#4B5563', marginLeft:'auto' }}>6 months</span>
            </div>
            <BarChart data={visitorTrend} colors={['#8B5CF6']} height={52} />
          </div>

          <div style={{ ...GLASS, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'8px' }}>
              <Trophy size={11} style={{ color:'#F59E0B' }} />
              <span style={{ fontSize:'11px', fontWeight:'700', color:'#fff' }}>Achievement Points</span>
              <span style={{ fontSize:'9px', color:'#4B5563', marginLeft:'auto' }}>6 months</span>
            </div>
            <BarChart data={achievementTrend} colors={['#F59E0B']} height={52} />
          </div>
        </div>

        {/* ── Top Chapters This Month ── */}
        {topChapters.length > 0 && (
          <div style={GLASS}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <TrendingUp size={12} style={{ color:'#C9A84C' }} />
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#fff' }}>Top Chapters This Month</span>
              </div>
              <span style={{ fontSize:'10px', color:'#6B7280' }}>by achievement pts</span>
            </div>
            <div>
              {topChapters.map((a, i) => {
                const medals = ['#C9A84C','#9CA3AF','#B46B44','#6B7280','#4B5563']
                const mc = medals[i] ?? '#4B5563'
                return (
                  <Link key={a.chapterId!} href={`/region/chapters/${a.chapterId}`} style={{ textDecoration:'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:`${mc}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', color:mc, flexShrink:0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'12px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {a.chapter?.name ?? a.chapterId}
                        </div>
                        <div style={{ fontSize:'10px', color:'#6B7280' }}>{a._count.id} achievement{a._count.id !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ fontSize:'13px', fontWeight:'700', color:'#F59E0B', flexShrink:0 }}>
                        {a._sum.points ?? 0}<span style={{ fontSize:'9px', color:'#6B7280', marginLeft:'2px' }}>pts</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Chapter Summary ── */}
        <div style={GLASS}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#fff' }}>
              Chapters <span style={{ fontSize:'11px', color:'#6B7280', fontWeight:'400' }}>({chapters.length})</span>
            </span>
            <Link href="/region/chapters" style={{ fontSize:'11px', color:'#CC0000', textDecoration:'none', fontWeight:'600' }}>View All →</Link>
          </div>
          {chapters.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center', color:'#4B5563', fontSize:'12px' }}>
              No chapters yet.{' '}
              <Link href="/region/chapters/new" style={{ color:'#CC0000', textDecoration:'none' }}>Create one →</Link>
            </div>
          ) : (
            <div style={{ padding:'10px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:'8px' }}>
              {chapters.map(ch => (
                <Link key={ch.id} href={`/region/chapters/${ch.id}`} style={{ textDecoration:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px', padding:'10px' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'rgba(204,0,0,0.12)', border:'1px solid rgba(204,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-bebas),sans-serif', fontSize:'16px', color:'#CC0000', flexShrink:0 }}>
                      {ch.name.charAt(0)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12px', fontWeight:'600', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'2px' }}>
                        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: ch.isActive ? '#10B981' : '#4B5563', flexShrink:0 }} />
                        <span style={{ fontSize:'9px', color:'#6B7280' }}>
                          {memberMap[ch.id] ?? 0} members{ch.meetingDay ? ` · ${ch.meetingDay}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={11} style={{ color:'#374151', flexShrink:0 }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {[
            { href:'/region/traffic-light',         label:'Traffic Lights',       color:'#10B981' },
            { href:'/region/analytics',              label:'Analytics',            color:'#3B82F6' },
            { href:'/region/event-registrations',    label:'Event Registrations',  color:'#8B5CF6' },
            { href:'/region/presentations',          label:'Presentations',         color:'#C9A84C' },
            { href:'/region/roles',                  label:'Roles',                color:'#CC0000' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration:'none' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', padding:'6px 13px', borderRadius:'20px', border:`1px solid ${a.color}30`, background:`${a.color}0d`, color:a.color }}>
                {a.label}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  )
}
