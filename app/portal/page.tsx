import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { computeTrafficScore, TRAFFIC_COLORS } from '@/lib/traffic-light'
import {
  Mic2, GraduationCap, Calendar, Trophy, Users,
  TrendingUp, Shield, Star, ChevronRight, UserCheck,
} from 'lucide-react'
import ReminderBell from './ReminderBell'
import ProfileCompleteness from './ProfileCompleteness'

function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  chapter: '#3B82F6', regional: '#8B5CF6', training: '#10B981',
  social: '#F59E0B', trip: '#EC4899', international: '#C9A84C',
}

const AWARD_ICONS: Record<string, string> = {
  chapter_award: '🏆', member_award: '⭐', competition: '🥇',
  training: '📚', milestone: '🎯', special: '💎',
  referral: '🤝', testimonial: '💬', 'one-to-one': '☕',
  visitor: '👥', tyfcb: '💰',
}

const AWARD_COLORS: Record<string, string> = {
  chapter_award: '#C9A84C', member_award: '#F59E0B', competition: '#F97316',
  training: '#3B82F6', milestone: '#8B5CF6', special: '#10B981',
  referral: '#10B981', testimonial: '#3B82F6', 'one-to-one': '#8B5CF6',
  visitor: '#F59E0B', tyfcb: '#C9A84C',
}

export default async function PortalPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const now = new Date()
  const userId = session.user.id

  const [
    memberData,
    palmsEntries,
    recentAchievements,
    upcomingEvents,
    mySlots,
    myVisitors,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, business: true, avatar: true, role: true, membershipValidTill: true, joinedAt: true },
    }),
    db.palmsEntry.findMany({ where: { userId }, orderBy: { weekDate: 'desc' }, take: 26 }),
    db.greenAchievement.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 }),
    db.event.findMany({ where: { isActive: true, date: { gte: now } }, orderBy: { date: 'asc' }, take: 5 }),
    db.meetingSlot.findMany({
      where: { assignedUserId: userId, status: { not: 'completed' }, event: { isActive: true, date: { gte: now } } },
      include: { event: { select: { id: true, date: true, title: true } } },
      orderBy: { event: { date: 'asc' } },
      take: 4,
    }),
    (db as any).visitor.findMany({ where: { referrerId: userId }, orderBy: { visitDate: 'desc' }, take: 5 }),
  ])

  const roleDetails = await db.chapterRole.findFirst({ where: { slug: memberData?.role ?? '' } }).catch(() => null)

  const trafficScore = computeTrafficScore(palmsEntries)
  const tlColor = TRAFFIC_COLORS[trafficScore.color]

  const monthlyHistory = (() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const entries = palmsEntries.filter((e) => {
        const wd = new Date(e.weekDate)
        return wd.getFullYear() === d.getFullYear() && wd.getMonth() === d.getMonth()
      })
      const score = entries.length > 0 ? computeTrafficScore(entries) : null
      months.push({
        label: d.toLocaleDateString('en', { month: 'short' }),
        isCurrent: i === 0,
        color: score ? TRAFFIC_COLORS[score.color] : null,
        total: score?.total ?? null,
        hasData: entries.length > 0,
      })
    }
    return months
  })()

  const rsvps = await db.eventRSVP.findMany({
    where: { userId, eventId: { in: upcomingEvents.map((e) => e.id) } },
  })
  const eventsWithRsvp = upcomingEvents.map((e) => ({
    ...e, date: e.date.toISOString(),
    myRsvp: rsvps.find((r) => r.eventId === e.id) ?? null,
  }))
  const slotsOut = mySlots.map((s) => ({
    ...s,
    event: { ...s.event, date: s.event.date.toISOString() },
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))
  const visitorsOut = myVisitors.map((v: any) => ({
    ...v,
    visitDate: v.visitDate instanceof Date ? v.visitDate.toISOString() : v.visitDate,
  }))
  const achievementsOut = recentAchievements.map((a) => ({
    ...a, date: a.date.toISOString(), createdAt: a.createdAt.toISOString(),
  }))

  const currentWeek = getISOWeek(now)
  const thisWeekPalms = palmsEntries.find((p) => p.week === currentWeek)
  const roleColor = (roleDetails as any)?.color ?? '#9CA3AF'

  const GLASS = {
    background: 'rgba(13,19,36,0.55)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
  } as const

  const tlStatusLabel = trafficScore.color === 'green' ? 'High Performer'
    : trafficScore.color === 'yellow' ? 'Needs Improvement'
    : trafficScore.color === 'red' ? 'At Risk' : 'Critical'

  const tlMetrics = [
    { label: 'Refs', pts: trafficScore.referrals, max: 20 },
    { label: 'Visitors', pts: trafficScore.visitors, max: 20 },
    { label: 'TYFCB', pts: trafficScore.tyfcb, max: 15 },
    { label: 'Training', pts: trafficScore.training, max: 15 },
    { label: 'Testimony', pts: trafficScore.testimonials, max: 10 },
    { label: 'Attendance', pts: trafficScore.absence, max: 15 },
  ]

  return (
    <>
      <style>{`
        .pd-grid { display: grid; grid-template-columns: 1fr; gap: 10px; max-width: 1100px; margin: 0 auto; }
        .pd-two { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .tl-metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
        @media (min-width: 768px) {
          .pd-two { grid-template-columns: 1fr 1fr; }
          .tl-metrics-row { grid-template-columns: repeat(6, 1fr); }
        }
      `}</style>

      <div className="pd-grid">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '3px', height: '22px', background: 'linear-gradient(180deg,#C9A84C,#CC0000)', borderRadius: '2px', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '24px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
              MY DASHBOARD
            </h1>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>Welcome back, {session.user.name}</p>
          </div>
        </div>

        {/* Profile completeness — mobile only */}
        <div className="lg:hidden">
          <ProfileCompleteness compact />
        </div>

        {/* ── Profile + Traffic Light ── */}
        <div className="pd-two">

          {/* Profile card */}
          <div style={{ ...GLASS, padding: '14px' }}>
            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {memberData?.avatar ? (
                <img src={memberData.avatar} alt={memberData.name} style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: `2px solid ${roleColor}50`, flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: '46px', height: '46px', borderRadius: '10px', flexShrink: 0,
                  background: `linear-gradient(135deg,${roleColor}30,${roleColor}15)`,
                  border: `2px solid ${roleColor}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-bebas),sans-serif', fontSize: '20px', color: roleColor,
                }}>
                  {(memberData?.name ?? 'M').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1.2 }}>{memberData?.name}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {memberData?.business ?? ''}
                </div>
                {roleDetails ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                    background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40`,
                    letterSpacing: '0.4px', textTransform: 'uppercase',
                  }}>
                    <Shield size={8} />{(roleDetails as any).label}
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                    background: 'rgba(156,163,175,0.15)', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.25)',
                    letterSpacing: '0.4px', textTransform: 'uppercase',
                  }}>
                    <Shield size={8} />Member
                  </span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[
                { label: 'Achievements', value: achievementsOut.length, color: '#C9A84C' },
                { label: 'Visitors', value: visitorsOut.length, color: '#10B981' },
                { label: 'Wk Refs', value: thisWeekPalms?.referrals ?? 0, color: '#3B82F6' },
                { label: 'Since', value: memberData?.joinedAt ? new Date(memberData.joinedAt).getFullYear() : '—', color: '#8B5CF6' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '7px 6px', borderRadius: '7px', background: `${item.color}10`, border: `1px solid ${item.color}20`, textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: item.color, fontFamily: 'var(--font-bebas),sans-serif', lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {memberData?.membershipValidTill && (
              <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#6B7280' }}>Valid till</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#C9A84C' }}>
                  {new Date(memberData.membershipValidTill).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* Traffic Light card — compact */}
          <div style={{ ...GLASS, padding: '14px' }}>

            {/* Title + score */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={13} style={{ color: tlColor }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Traffic Light</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Inline TL indicator */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {(['green','yellow','red','black'] as const).map((k) => (
                    <div key={k} style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: trafficScore.color === k ? TRAFFIC_COLORS[k] : 'rgba(255,255,255,0.1)',
                      boxShadow: trafficScore.color === k ? `0 0 6px ${TRAFFIC_COLORS[k]}` : 'none',
                    }} />
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '26px', color: tlColor, lineHeight: 1 }}>
                  {trafficScore.total}<span style={{ fontSize: '13px', color: '#6B7280' }}>/100</span>
                </div>
              </div>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '6px 10px', borderRadius: '7px', background: `${tlColor}10`, border: `1px solid ${tlColor}20` }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tlColor, boxShadow: `0 0 8px ${tlColor}80`, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: tlColor, textTransform: 'capitalize' }}>{trafficScore.color}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>— {tlStatusLabel}</span>
              <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: 'auto' }}>{trafficScore.totalWeeksTracked}w</span>
            </div>

            {/* Metrics compact row */}
            <div className="tl-metrics-row" style={{ marginBottom: '10px' }}>
              {tlMetrics.map((m) => {
                const pct = m.max > 0 ? m.pts / m.max : 0
                const c = pct >= 0.8 ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#CC0000'
                return (
                  <div key={m.label} style={{ textAlign: 'center', padding: '5px 3px', borderRadius: '6px', background: `${c}08`, border: `1px solid ${c}20` }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: c, fontFamily: 'var(--font-bebas),sans-serif', lineHeight: 1 }}>{m.pts}<span style={{ fontSize: '9px', color: '#6B7280' }}>/{m.max}</span></div>
                    <div style={{ fontSize: '8px', color: '#9CA3AF', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.2px' }}>{m.label}</div>
                    {/* Mini progress bar */}
                    <div style={{ height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.06)', marginTop: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, background: c, borderRadius: '1px' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 6-month history strip */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
              <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '600' }}>
                6-Month History
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '4px' }}>
                {monthlyHistory.map((m) => {
                  const dot = m.color ?? 'rgba(255,255,255,0.08)'
                  return (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: m.hasData ? dot : 'rgba(255,255,255,0.05)',
                        border: m.isCurrent ? `2px solid ${dot}` : `1px solid ${m.hasData ? dot + '60' : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: m.isCurrent && m.hasData ? `0 0 8px ${dot}60` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '8px', color: m.hasData ? '#000' : '#4B5563', fontWeight: '700',
                      }}>
                        {m.hasData ? m.total : '·'}
                      </div>
                      <span style={{ fontSize: '8px', color: m.isCurrent ? '#C9A84C' : '#6B7280', fontWeight: m.isCurrent ? '700' : '400', textTransform: 'uppercase' }}>
                        {m.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <Link href="/portal/calendar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px', padding: '6px', borderRadius: '7px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', textDecoration: 'none', fontSize: '11px' }}>
              Chapter Calendar <ChevronRight size={11} />
            </Link>
          </div>
        </div>

        {/* ── My Upcoming Presentations ── */}
        {slotsOut.length > 0 && (
          <div style={GLASS}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Mic2 size={13} style={{ color: '#C9A84C' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>My Presentations</span>
              </div>
              <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                {slotsOut.length} slot{slotsOut.length > 1 ? 's' : ''}
              </span>
            </div>
            <div>
              {slotsOut.map((slot) => {
                const slotDate = new Date(slot.event.date)
                const isEdu = slot.slotType === 'edu_slot'
                const color = isEdu ? '#10B981' : '#C9A84C'
                const Icon = isEdu ? GraduationCap : Mic2
                return (
                  <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', borderLeft: `2px solid ${color}`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {isEdu ? 'EDU Slot' : `Feature Presentation ${slot.slotNumber}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#D1D5DB' }}>{slot.event.title}</div>
                      {slot.topic && <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Topic: {slot.topic}</div>}
                      <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '1px' }}>
                        📅 {slotDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: slot.status === 'confirmed' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)', color: slot.status === 'confirmed' ? '#3B82F6' : '#F59E0B', border: `1px solid ${slot.status === 'confirmed' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}`, flexShrink: 0 }}>
                      {slot.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Events + Achievements ── */}
        <div className="pd-two">

          {/* Upcoming events */}
          <div style={GLASS}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Calendar size={13} style={{ color: '#3B82F6' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Upcoming Events</span>
              </div>
              <Link href="/portal/calendar" style={{ fontSize: '11px', color: '#C9A84C', textDecoration: 'none' }}>View all →</Link>
            </div>
            {eventsWithRsvp.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>No upcoming events</div>
            ) : (
              eventsWithRsvp.map((event) => {
                const d = new Date(event.date)
                const tc = EVENT_TYPE_COLORS[event.eventType] ?? '#9CA3AF'
                const rsvpStatus = event.myRsvp?.status
                const rsvpColor = rsvpStatus === 'confirmed' ? '#10B981' : rsvpStatus === 'declined' ? '#CC0000' : rsvpStatus === 'maybe' ? '#F59E0B' : null
                return (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderLeft: `2px solid ${tc}`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ textAlign: 'center', minWidth: '30px' }}>
                      <div style={{ fontFamily: 'var(--font-bebas),sans-serif', fontSize: '18px', color: tc, lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: '8px', color: '#6B7280', textTransform: 'uppercase' }}>{d.toLocaleString('en', { month: 'short' })}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                      {rsvpColor && <div style={{ fontSize: '10px', color: rsvpColor, marginTop: '1px', textTransform: 'capitalize' }}>{rsvpStatus}</div>}
                    </div>
                    <ReminderBell eventId={event.id} eventTitle={event.title} />
                  </div>
                )
              })
            )}
          </div>

          {/* Recent achievements */}
          <div style={GLASS}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Trophy size={13} style={{ color: '#C9A84C' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>My Achievements</span>
              </div>
              <Link href="/portal/achievements" style={{ fontSize: '11px', color: '#C9A84C', textDecoration: 'none' }}>View all →</Link>
            </div>
            {achievementsOut.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>No achievements yet</div>
            ) : (
              achievementsOut.map((a) => {
                const icon = AWARD_ICONS[a.category] ?? '🏅'
                const color = AWARD_COLORS[a.category] ?? '#9CA3AF'
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color, textTransform: 'capitalize' }}>{a.category.replace(/_/g, ' ')}</div>
                      {a.description && <div style={{ fontSize: '10px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</div>}
                      <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '1px' }}>
                        {new Date(a.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color, padding: '2px 7px', borderRadius: '20px', background: `${color}18`, border: `1px solid ${color}30`, flexShrink: 0 }}>
                      +{a.points}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── My Visitors ── */}
        {visitorsOut.length > 0 && (
          <div style={GLASS}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <UserCheck size={13} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>My Visitors</span>
              </div>
              <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                {visitorsOut.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
              {visitorsOut.map((v: any) => (
                <div key={v.id} style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', marginBottom: '1px' }}>{v.name}</div>
                  {v.business && <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{v.business}</div>}
                  <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>
                    {new Date(v.visitDate).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    {v.eoiSubmitted && <span style={{ marginLeft: '5px', color: '#C9A84C' }}>EOI ✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px' }}>
          {[
            { href: '/portal/members', icon: Users, label: 'Chapter Members', color: '#8B5CF6' },
            { href: '/portal/presentations', icon: Mic2, label: 'Presentations', color: '#C9A84C' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ ...GLASS, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '9px', borderColor: `${item.color}20` }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${item.color}15`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={13} style={{ color: item.color }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#D1D5DB' }}>{item.label}</span>
                <ChevronRight size={12} style={{ color: '#4B5563', marginLeft: 'auto' }} />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </>
  )
}
