import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Users, CalendarCheck, ClipboardList, Trophy, TrendingUp, Plus } from 'lucide-react'

async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const isoWeek = `${now.getFullYear()}-W${String(
    Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
        new Date(now.getFullYear(), 0, 1).getDay() +
        1) /
        7
    )
  ).padStart(2, '0')}`

  const [totalMembers, upcomingEvents, openTasks, achievementsThisMonth, recentMembers] =
    await Promise.all([
      db.user.count({ where: { isActive: true, role: { not: 'admin' } } }),
      db.event.count({
        where: {
          isActive: true,
          date: { gte: now, lte: endOfMonth },
        },
      }),
      db.weeklyTask.count({
        where: { week: isoWeek, status: { in: ['pending', 'callback'] } },
      }),
      db.greenAchievement.count({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      db.user.findMany({
        where: { isActive: true, role: { not: 'admin' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, business: true, category: true, createdAt: true, role: true },
      }),
    ])

  const topAchievers = await db.greenAchievement.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: 'desc' } },
    take: 5,
  })

  const achieverUsers = await db.user.findMany({
    where: { id: { in: topAchievers.map((a) => a.userId) } },
    select: { id: true, name: true, business: true },
  })

  const topAchiversWithNames = topAchievers.map((a) => ({
    ...a,
    user: achieverUsers.find((u) => u.id === a.userId),
  }))

  return {
    totalMembers,
    upcomingEvents,
    openTasks,
    achievementsThisMonth,
    recentMembers,
    topAchievers: topAchiversWithNames,
    currentWeek: isoWeek,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (( session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const stats = await getDashboardStats()

  const statCards = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
      link: '/dashboard/members',
    },
    {
      label: 'Events This Month',
      value: stats.upcomingEvents,
      icon: CalendarCheck,
      color: '#C9A84C',
      bg: 'rgba(201,168,76,0.1)',
      border: 'rgba(201,168,76,0.2)',
      link: '/dashboard/events',
    },
    {
      label: 'Open Tasks (This Week)',
      value: stats.openTasks,
      icon: ClipboardList,
      color: '#CC0000',
      bg: 'rgba(204,0,0,0.1)',
      border: 'rgba(204,0,0,0.2)',
      link: '/dashboard/tasks',
    },
    {
      label: 'Achievements This Month',
      value: stats.achievementsThisMonth,
      icon: Trophy,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
      link: '/dashboard/achievements',
    },
  ]

  const quickActions = [
    { label: 'Add Member', href: '/dashboard/members', color: '#3B82F6' },
    { label: 'Create Event', href: '/dashboard/events', color: '#C9A84C' },
    { label: 'Assign Tasks', href: '/dashboard/tasks', color: '#CC0000' },
    { label: 'Log Achievement', href: '/dashboard/achievements', color: '#10B981' },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="oscar-page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '4px',
              height: '28px',
              background: 'linear-gradient(180deg, #CC0000, #C9A84C)',
              borderRadius: '2px',
            }}
          />
          <h1
            className="oscar-page-title"
            style={{
              fontFamily: 'var(--font-bebas), sans-serif',
              fontSize: '32px',
              letterSpacing: '2px',
              color: '#ffffff',
            }}
          >
            DASHBOARD
          </h1>
        </div>
        <p style={{ color: '#9CA3AF', fontSize: '17px', marginLeft: '16px' }}>
          Welcome back, {session.user.name}. Here&apos;s what&apos;s happening in BNI Oscar Chapter.
        </p>
      </div>

      {/* Stats grid */}
      <div className="oscar-stats-grid">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.link}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="oscar-stat-pad oscar-hover-lift"
              style={{
                background: 'rgba(13,19,36,0.55)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
                borderRadius: '14px',
                padding: '22px',
                border: `1px solid ${card.border}`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div
                  className="oscar-stat-icon"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: card.bg,
                    border: `1px solid ${card.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <card.icon size={20} style={{ color: card.color }} />
                </div>
                <TrendingUp size={13} style={{ color: '#6B7280' }} />
              </div>
              <div
                className="oscar-stat-value"
                style={{
                  fontFamily: 'var(--font-bebas), sans-serif',
                  fontSize: '40px',
                  color: '#ffffff',
                  lineHeight: '1',
                  marginBottom: '4px',
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: '17px', color: '#9CA3AF' }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div className="oscar-two-col">
        {/* Recent Members */}
        <div className="glass-section">
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>Recent Members</h2>
            <Link
              href="/dashboard/members"
              style={{ fontSize: '17px', color: '#C9A84C', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {stats.recentMembers.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#8B95A3', fontSize: '17px' }}>
                No members yet
              </div>
            ) : (
              stats.recentMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/dashboard/members/${member.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="oscar-hover-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 24px',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.22)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '17px',
                        color: '#C9A84C',
                        flexShrink: 0,
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.name}
                      </div>
                      <div style={{ fontSize: '17px', color: '#6B7280' }}>
                        {member.business || member.category || member.role}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '17px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          member.role === 'president'
                            ? 'rgba(201,168,76,0.15)'
                            : member.role === 'admin'
                              ? 'rgba(59,130,246,0.15)'
                              : 'rgba(255,255,255,0.05)',
                        color:
                          member.role === 'president'
                            ? '#C9A84C'
                            : member.role === 'admin'
                              ? '#60A5FA'
                              : '#9CA3AF',
                        textTransform: 'capitalize',
                      }}
                    >
                      {member.role}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Achievers */}
        <div className="glass-section">
          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>
              Top Achievers This Month
            </h2>
            <Link
              href="/dashboard/achievements"
              style={{ fontSize: '17px', color: '#C9A84C', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          <div style={{ padding: '8px 0' }}>
            {stats.topAchievers.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#8B95A3', fontSize: '17px' }}>
                No achievements this month
              </div>
            ) : (
              stats.topAchievers.map((achiever, index) => (
                <div
                  key={achiever.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 24px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor:
                        index === 0
                          ? 'rgba(201,168,76,0.2)'
                          : index === 1
                            ? 'rgba(156,163,175,0.15)'
                            : index === 2
                              ? 'rgba(180,107,68,0.15)'
                              : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '17px',
                      fontWeight: '700',
                      color:
                        index === 0
                          ? '#C9A84C'
                          : index === 1
                            ? '#9CA3AF'
                            : index === 2
                              ? '#B46B44'
                              : '#6B7280',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '17px',
                        fontWeight: '600',
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {achiever.user?.name ?? 'Unknown'}
                    </div>
                    <div style={{ fontSize: '17px', color: '#6B7280' }}>
                      {achiever.user?.business ?? ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: '#10B981' }}>
                      {achiever._sum.points ?? 0}
                    </div>
                    <div style={{ fontSize: '17px', color: '#6B7280' }}>pts</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="glass-section"
        style={{ padding: '20px 22px' }}
      >
        <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '16px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: `1px solid ${action.color}40`,
                  backgroundColor: `${action.color}10`,
                  color: action.color,
                  fontSize: '17px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Plus size={16} />
                {action.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
