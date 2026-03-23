import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { NON_ADMIN_FILTER } from '@/lib/member-filter'
import { computeTrafficScore, TRAFFIC_COLORS } from '@/lib/traffic-light'
import Link from 'next/link'
import {
  Users, CalendarCheck, ClipboardList, Trophy,
  Plus, GraduationCap, Mic2, ChevronRight, Activity, Zap,
} from 'lucide-react'

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  )
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function BarChart({ data, color, height = 52 }: {
  data: { label: string; value: number }[]
  color: string
  height?: number
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 240, H = height
  const slotW = W / data.length
  const barW = slotW - 6
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * H : 0
        const x = i * slotW + 3
        const y = H - barH
        return (
          <g key={i}>
            <rect x={x} y={H} width={barW} height={0} rx="2" fill={color} opacity="0.15" />
            <rect x={x} y={y} width={barW} height={barH} rx="2" fill={color} opacity={barH > 0 ? 0.85 : 0.2} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={Math.max(y - 2, 7)} textAnchor="middle" fill={color} fontSize="7" fontFamily="sans-serif" fontWeight="bold">
                {d.value}
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
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const now = new Date()
  const chapterId = session.user.chapterId
  const userId = session.user.id
  const isoWeek = getISOWeek(now)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const weeks26Ago = new Date(now)
  weeks26Ago.setDate(weeks26Ago.getDate() - 182)

  const chapterFilter = chapterId ? { chapterId } : {}

  const [
    chapter,
    totalMembers,
    upcomingEvents,
    openTasks,
    achievementsThisMonth,
    recentMembers,
    newMembersRaw,
    achievementTrendRaw,
    allPalmsRaw,
    myPalmsEntries,
    myUpcomingSlots,
    topAchievers,
  ] = await Promise.all([
    chapterId
      ? db.chapter.findUnique({ where: { id: chapterId }, select: { name: true } })
      : null,
    db.user.count({ where: { isActive: true, ...chapterFilter, ...NON_ADMIN_FILTER } }),
    db.event.count({ where: { isActive: true, date: { gte: now, lte: endOfMonth }, ...chapterFilter } }),
    db.weeklyTask.count({ where: { week: isoWeek, status: { in: ['pending', 'callback'] }, ...chapterFilter } }),
    db.greenAchievement.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth }, ...chapterFilter } }),
    db.user.findMany({
      where: { isActive: true, ...chapterFilter, ...NON_ADMIN_FILTER },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, business: true, category: true, createdAt: true, role: true },
    }),
    db.user.findMany({
      where: { isActive: true, ...chapterFilter, ...NON_ADMIN_FILTER, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    db.greenAchievement.findMany({
      where: { ...chapterFilter, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, points: true },
    }),
    db.palmsEntry.findMany({
      where: {
        weekDate: { gte: weeks26Ago },
        user: { ...chapterFilter, isActive: true, ...NON_ADMIN_FILTER },
      },
      select: {
        userId: true, attended: true, substitute: true, late: true, medical: true,
        referrals: true, visitors: true, testimonials: true, oneToOnes: true,
        ceus: true, tyfcbAmount: true, week: true, weekDate: true,
      },
    }),
    db.palmsEntry.findMany({ where: { userId }, orderBy: { weekDate: 'desc' }, take: 26 }),
    db.meetingSlot.findMany({
      where: {
        assignedUserId: userId,
        status: { not: 'completed' },
        event: { isActive: true, date: { gte: now } },
      },
      include: { event: { select: { id: true, date: true, title: true } } },
      orderBy: { event: { date: 'asc' } },
      take: 3,
    }),
    db.greenAchievement.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth }, ...chapterFilter },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: 5,
    }),
  ])

  // Top achievers names
  const achieverUsers = await db.user.findMany({
    where: { id: { in: topAchievers.map(a => a.userId) } },
    select: { id: true, name: true, business: true },
  })
  const topAchieversWithNames = topAchievers.map(a => ({
    ...a,
    user: achieverUsers.find(u => u.id === a.userId),
  }))

  // ── Traffic Light Distribution ──
  const byUser = new Map<string, typeof allPalmsRaw>()
  for (const p of allPalmsRaw) {
    if (!byUser.has(p.userId)) byUser.set(p.userId, [])
    byUser.get(p.userId)!.push(p)
  }
  const dist = { green: 0, yellow: 0, red: 0, black: 0 }
  const trackedIds = new Set<string>()
  for (const [uid, entries] of byUser) {
    trackedIds.add(uid)
    const score = computeTrafficScore(entries)
    dist[score.color]++
  }
  // Members with no palms data → black
  const untrackedCount = totalMembers - trackedIds.size
  dist.black += untrackedCount

  const tlTotal = dist.green + dist.yellow + dist.red + dist.black
  const greenPct = tlTotal > 0 ? Math.round((dist.green / tlTotal) * 100) : 0

  // ── 6-month growth charts ──
  const months6: { label: string; monthKey: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months6.push({
      label: d.toLocaleDateString('en', { month: 'short' }),
      monthKey: `${d.getFullYear()}-${d.getMonth()}`,
    })
  }
  const memberGrowth = months6.map(m => ({
    label: m.label,
    value: newMembersRaw.filter(u => {
      const d = new Date(u.createdAt)
      return `${d.getFullYear()}-${d.getMonth()}` === m.monthKey
    }).length,
  }))
  const achievementTrend = months6.map(m => ({
    label: m.label,
    value: achievementTrendRaw
      .filter(a => {
        const d = new Date(a.createdAt)
        return `${d.getFullYear()}-${d.getMonth()}` === m.monthKey
      })
      .reduce((sum, a) => sum + a.points, 0),
  }))

  // ── My Traffic Light (logged-in user) ──
  const myScore = myPalmsEntries.length > 0 ? computeTrafficScore(myPalmsEntries) : null
  const myTlColor = myScore ? TRAFFIC_COLORS[myScore.color] : null
  const myTlMetrics = myScore ? [
    { label: 'Refs', pts: myScore.referrals, max: 20 },
    { label: 'Visitors', pts: myScore.visitors, max: 20 },
    { label: 'TYFCB', pts: myScore.tyfcb, max: 15 },
    { label: 'Training', pts: myScore.training, max: 15 },
    { label: 'Testimony', pts: myScore.testimonials, max: 10 },
    { label: 'Attend', pts: myScore.absence, max: 15 },
  ] : []

  const chapterName = chapter?.name ?? 'Chapter'

  const statCards = [
    { label: 'Members', value: totalMembers, icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', link: '/dashboard/members' },
    { label: 'Events', value: upcomingEvents, icon: CalendarCheck, color: '#C9A84C', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.2)', link: '/dashboard/events' },
    { label: 'Open Tasks', value: openTasks, icon: ClipboardList, color: '#CC0000', bg: 'rgba(204,0,0,0.1)', border: 'rgba(204,0,0,0.2)', link: '/dashboard/tasks' },
    { label: 'Achievements', value: achievementsThisMonth, icon: Trophy, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', link: '/dashboard/achievements' },
  ]

  const tlDots: { color: string; count: number; label: string; hex: string }[] = [
    { color: 'green', count: dist.green, label: 'Green', hex: TRAFFIC_COLORS.green },
    { color: 'yellow', count: dist.yellow, label: 'Yellow', hex: TRAFFIC_COLORS.yellow },
    { color: 'red', count: dist.red, label: 'Red', hex: TRAFFIC_COLORS.red },
    { color: 'black', count: dist.black, label: 'Untracked', hex: '#374151' },
  ]

  return (
    <>
      <style>{`
        .db-grid { display: grid; grid-template-columns: 1fr; gap: 12px; max-width: 1100px; margin: 0 auto; }
        .db-stats { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
        .db-two { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .db-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .my-tl-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; }
        @media (min-width: 640px) {
          .db-stats { grid-template-columns: repeat(4,1fr); }
        }
        @media (min-width: 768px) {
          .db-two { grid-template-columns: 1fr 1fr; }
          .my-tl-metrics { grid-template-columns: repeat(6,1fr); }
        }
      `}</style>

      <div className="db-grid">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '3px', height: '24px', background: 'linear-gradient(180deg,#CC0000,#C9A84C)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '26px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
                CHAPTER DASHBOARD
              </h1>
              <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                {chapterName} · Welcome, {session.user.name}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { href: '/dashboard/members', label: '+ Member', color: '#3B82F6' },
              { href: '/dashboard/events', label: '+ Event', color: '#C9A84C' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px', border: `1px solid ${a.color}40`, background: `${a.color}12`, color: a.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── KPI Stat Cards ── */}
        <div className="db-stats">
          {statCards.map(card => (
            <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
              <div style={{ ...GLASS, padding: '12px 14px', border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <card.icon size={17} style={{ color: card.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '28px', color: '#fff', lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>{card.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Green Member Stats ── */}
        <div style={{ ...GLASS, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} style={{ color: '#10B981' }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Member Health</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B98180' }} />
              <span style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '20px', color: '#10B981', lineHeight: 1 }}>{greenPct}%</span>
              <span style={{ fontSize: '10px', color: '#6B7280' }}>green</span>
            </div>
          </div>

          {/* Stacked bar */}
          {tlTotal > 0 && (
            <div style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '10px', gap: '1px' }}>
              {tlDots.filter(t => t.count > 0).map(t => (
                <div key={t.color} style={{ flex: t.count, background: t.hex, opacity: t.color === 'black' ? 0.4 : 0.85 }} />
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {tlDots.map(t => (
              <div key={t.color} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: `${t.hex}20`, border: `1px solid ${t.hex}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: t.hex, boxShadow: t.color !== 'black' ? `0 0 4px ${t.hex}` : 'none' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '16px', color: t.hex, lineHeight: 1 }}>{t.count}</div>
                  <div style={{ fontSize: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Growth Charts ── */}
        <div className="db-charts">
          <div style={{ ...GLASS, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Users size={11} style={{ color: '#3B82F6' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>New Members</span>
              <span style={{ fontSize: '9px', color: '#6B7280', marginLeft: 'auto' }}>6 months</span>
            </div>
            <BarChart data={memberGrowth} color="#3B82F6" height={48} />
          </div>
          <div style={{ ...GLASS, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Trophy size={11} style={{ color: '#10B981' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>Achievement Points</span>
              <span style={{ fontSize: '9px', color: '#6B7280', marginLeft: 'auto' }}>6 months</span>
            </div>
            <BarChart data={achievementTrend} color="#10B981" height={48} />
          </div>
        </div>

        {/* ── My Performance (logged-in user's TL + slots) ── */}
        {myScore && (
          <div style={{ ...GLASS, padding: '14px 16px', border: `1px solid ${myTlColor}25`, boxShadow: `0 4px 20px rgba(0,0,0,0.28), 0 0 0 1px ${myTlColor}10` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} style={{ color: myTlColor! }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>My Performance</span>
                <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '20px', background: `${myTlColor}20`, color: myTlColor!, border: `1px solid ${myTlColor}40`, textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '700' }}>
                  {myScore.color}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {(['green', 'yellow', 'red', 'black'] as const).map(k => (
                  <div key={k} style={{ width: '7px', height: '7px', borderRadius: '50%', background: myScore.color === k ? TRAFFIC_COLORS[k] : 'rgba(255,255,255,0.08)', boxShadow: myScore.color === k ? `0 0 5px ${TRAFFIC_COLORS[k]}` : 'none' }} />
                ))}
                <span style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '22px', color: myTlColor!, lineHeight: 1, marginLeft: '6px' }}>
                  {myScore.total}<span style={{ fontSize: '11px', color: '#6B7280' }}>/100</span>
                </span>
              </div>
            </div>

            <div className="my-tl-metrics">
              {myTlMetrics.map(m => {
                const pct = m.max > 0 ? m.pts / m.max : 0
                const c = pct >= 0.8 ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#CC0000'
                return (
                  <div key={m.label} style={{ textAlign: 'center', padding: '5px 3px', borderRadius: '6px', background: `${c}08`, border: `1px solid ${c}20` }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: c, fontFamily: 'var(--font-bebas),sans-serif', lineHeight: 1 }}>
                      {m.pts}<span style={{ fontSize: '8px', color: '#6B7280' }}>/{m.max}</span>
                    </div>
                    <div style={{ height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.06)', marginTop: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, background: c }} />
                    </div>
                    <div style={{ fontSize: '8px', color: '#9CA3AF', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.2px' }}>{m.label}</div>
                  </div>
                )
              })}
            </div>

            {myUpcomingSlots.length > 0 && (
              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '600', marginBottom: '6px' }}>My Upcoming Slots</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {myUpcomingSlots.map(slot => {
                    const isEdu = slot.slotType === 'edu_slot'
                    const sc = isEdu ? '#10B981' : '#C9A84C'
                    const Icon = isEdu ? GraduationCap : Mic2
                    const d = slot.event.date
                    return (
                      <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', background: `${sc}08`, border: `1px solid ${sc}20` }}>
                        <Icon size={11} style={{ color: sc, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: sc }}>
                            {isEdu ? 'EDU Slot' : `Feature Presentation ${slot.slotNumber}`}
                          </span>
                          <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '6px' }}>{slot.event.title}</span>
                        </div>
                        <span style={{ fontSize: '9px', color: '#6B7280', flexShrink: 0 }}>
                          {new Date(d).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Recent Members + Top Achievers ── */}
        <div className="db-two">

          {/* Recent Members */}
          <div style={GLASS}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Recent Members</span>
              <Link href="/dashboard/members" style={{ fontSize: '11px', color: '#C9A84C', textDecoration: 'none' }}>View all →</Link>
            </div>
            {recentMembers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>No members yet</div>
            ) : (
              recentMembers.map(member => (
                <Link key={member.id} href={`/dashboard/members/${member.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                    onMouseEnter={() => {}} // hover handled by oscar-hover-row class if needed
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: '#C9A84C', flexShrink: 0 }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                      <div style={{ fontSize: '10px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.business || member.category || member.role}</div>
                    </div>
                    <ChevronRight size={11} style={{ color: '#374151', flexShrink: 0 }} />
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Top Achievers */}
          <div style={GLASS}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Top Achievers</span>
              <Link href="/dashboard/achievements" style={{ fontSize: '11px', color: '#C9A84C', textDecoration: 'none' }}>View all →</Link>
            </div>
            {topAchieversWithNames.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>No achievements this month</div>
            ) : (
              topAchieversWithNames.map((achiever, index) => {
                const medalColors = ['#C9A84C', '#9CA3AF', '#B46B44']
                const mc = medalColors[index] ?? '#4B5563'
                return (
                  <div key={achiever.userId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${mc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: mc, flexShrink: 0 }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{achiever.user?.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: '10px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{achiever.user?.business ?? ''}</div>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', flexShrink: 0 }}>
                      {achiever._sum.points ?? 0}
                      <span style={{ fontSize: '9px', color: '#6B7280', marginLeft: '2px' }}>pts</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Add Member', href: '/dashboard/members', color: '#3B82F6' },
            { label: 'Create Event', href: '/dashboard/events', color: '#C9A84C' },
            { label: 'Assign Tasks', href: '/dashboard/tasks', color: '#CC0000' },
            { label: 'Log Achievement', href: '/dashboard/achievements', color: '#10B981' },
            { label: 'Manage Roles', href: '/dashboard/roles', color: '#8B5CF6' },
          ].map(action => (
            <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', border: `1px solid ${action.color}35`, background: `${action.color}10`, color: action.color, fontSize: '12px', fontWeight: '600' }}>
                <Plus size={12} />
                {action.label}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  )
}
