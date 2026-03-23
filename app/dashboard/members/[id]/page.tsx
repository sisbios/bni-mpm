import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Building, Tag, Calendar, Trophy, ClipboardList, Users, Award, MessageCircle, Share2 } from 'lucide-react'
import { computeTrafficScore, TRAFFIC_COLORS, type PalmsRow } from '@/lib/traffic-light'
import MemberProfileClient from './MemberProfileClient'

async function getMemberData(id: string) {
  const [user, achievements, tasks, contacts, totalContacts, roles, palmsEntries, memberPins, allPins] = await Promise.all([
    db.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        business: true, category: true, isActive: true, createdAt: true,
        membershipValidTill: true, joinedAt: true,
      },
    }),
    db.greenAchievement.findMany({
      where: { userId: id },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    db.weeklyTask.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.contactSphere.findMany({
      where: { userId: id },
      orderBy: { contactName: 'asc' },
      take: 10,
    }),
    db.contactSphere.count({ where: { userId: id } }),
    db.chapterRole.findMany({ orderBy: { label: 'asc' } }),
    db.palmsEntry.findMany({
      where: { userId: id },
      orderBy: { weekDate: 'desc' },
      take: 26,
    }),
    db.memberPin.findMany({
      where: { userId: id },
      include: { pin: true },
      orderBy: { awardedAt: 'asc' },
    }),
    db.bniPin.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  return { user, achievements, tasks, contacts, totalContacts, roles, palmsEntries, memberPins, allPins }
}

const CATEGORY_COLORS: Record<string, string> = {
  referral: '#3B82F6',
  testimonial: '#10B981',
  'one-to-one': '#8B5CF6',
  visitor: '#F59E0B',
  tyfcb: '#C9A84C',
  training: '#EC4899',
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user.accessLevel ?? 'member') === 'member') redirect('/portal')

  const { id } = await params
  const { user, achievements, tasks, contacts, totalContacts, roles, palmsEntries, memberPins, allPins } = await getMemberData(id)
  if (!user) notFound()

  const canManagePins = (session.user.accessLevel ?? 'member') !== 'member'
  const canManage =
    (session.user.accessLevel ?? 'member') === 'superadmin' ||
    ['president', 'vicePresident'].includes(session.user.role ?? '')

  const roleObj = roles.find((r) => r.slug === user.role)
  const roleColor = roleObj?.color ?? '#9CA3AF'
  const roleBg = `${roleColor}18`
  const roleLabel = roleObj?.label ?? user.role

  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0)
  const verifiedAchievements = achievements.filter((a) => a.verified).length

  // Traffic light
  const palmsRows: PalmsRow[] = palmsEntries.map((e) => ({
    attended: e.attended, substitute: e.substitute, late: e.late, medical: (e as any).medical ?? false,
    referrals: e.referrals, visitors: e.visitors, oneToOnes: e.oneToOnes,
    ceus: e.ceus, tyfcbAmount: e.tyfcbAmount, testimonials: (e as any).testimonials ?? 0,
  }))
  const trafficScore = computeTrafficScore(palmsRows)
  const trafficHex = TRAFFIC_COLORS[trafficScore.color]

  // Membership expiry
  const membershipExpiry = user.membershipValidTill ? new Date(user.membershipValidTill) : null
  const today = new Date()
  const daysToExpiry = membershipExpiry
    ? Math.ceil((membershipExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back */}
      <Link
        href="/dashboard/members"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          color: '#9CA3AF', textDecoration: 'none', fontSize: '17px',
          marginBottom: '20px', transition: 'color 0.15s',
        }}
        className="oscar-back-link"
      >
        <ArrowLeft size={16} />
        Back to Members
      </Link>

      {/* ── MOBILE profile card ── */}
      {(() => {
        const cleanPhone = user.phone ? user.phone.replace(/\s/g, '') : null
        const waPhone = cleanPhone ? cleanPhone.replace(/^\+/, '') : null
        const shareText = encodeURIComponent(
          `*${user.name}*\n${roleLabel}${user.business ? `\n🏢 ${user.business}` : ''}${user.category ? `\n🏷️ ${user.category}` : ''}\n📧 ${user.email}${cleanPhone ? `\n📞 ${cleanPhone}` : ''}`
        )
        return (
          <div className="md:hidden" style={{ marginBottom: '16px' }}>
            {/* Card */}
            <div style={{
              background: 'rgba(13,19,36,0.70)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              borderRadius: '16px',
              border: `1px solid ${trafficHex}30`,
              overflow: 'hidden',
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)`,
            }}>
              {/* Banner gradient */}
              <div style={{
                height: '72px',
                background: `linear-gradient(135deg, #CC0000 0%, #8B0000 40%, ${trafficHex}40 100%)`,
                position: 'relative',
              }} />

              {/* Avatar — overlaps banner */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-44px', paddingBottom: '0', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a2035, #0d1324)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '34px', color: '#C9A84C',
                    border: `3px solid ${trafficHex}`,
                    boxShadow: `0 0 20px ${trafficHex}80, 0 4px 16px rgba(0,0,0,0.5)`,
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div title={trafficScore.label} style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: trafficHex, border: '2px solid #0A0F1E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: '800', color: trafficScore.color === 'yellow' ? '#000' : '#fff',
                    boxShadow: `0 0 10px ${trafficHex}`,
                  }}>{trafficScore.total}</div>
                </div>

                {/* Name + badges */}
                <div style={{ textAlign: 'center', padding: '10px 20px 0' }}>
                  <h1 style={{ fontFamily: 'var(--font-montserrat), sans-serif', fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                    {user.name}
                  </h1>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: roleBg, color: roleColor, fontWeight: '700', border: `1px solid ${roleColor}30` }}>
                      {roleLabel}
                    </span>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: `${trafficHex}18`, color: trafficHex, fontWeight: '700', border: `1px solid ${trafficHex}30` }}>
                      {trafficScore.label}
                    </span>
                  </div>

                  {/* BNI Pins */}
                  {memberPins.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                      {memberPins.map((mp) => (
                        <span key={mp.id} title={mp.pin.label} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          padding: '2px 8px', borderRadius: '10px', fontSize: '11px',
                          background: `${mp.pin.color}18`, border: `1px solid ${mp.pin.color}40`,
                          color: mp.pin.color, fontWeight: '600',
                        }}>
                          {mp.pin.icon} {mp.pin.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info rows */}
                <div style={{ width: '100%', padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {user.business && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '600' }}>{user.business}</span>
                    </div>
                  )}
                  {user.category && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Tag size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{user.category}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#9CA3AF', wordBreak: 'break-all' }}>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                      Joined {new Date((user as any).joinedAt ?? user.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {membershipExpiry && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', alignSelf: 'flex-start',
                      background: daysToExpiry !== null && daysToExpiry <= 30 ? 'rgba(204,0,0,0.12)' : daysToExpiry !== null && daysToExpiry <= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${daysToExpiry !== null && daysToExpiry <= 30 ? 'rgba(204,0,0,0.3)' : daysToExpiry !== null && daysToExpiry <= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                      color: daysToExpiry !== null && daysToExpiry <= 30 ? '#CC0000' : daysToExpiry !== null && daysToExpiry <= 60 ? '#F59E0B' : '#10B981',
                    }}>
                      <Award size={11} />
                      Valid till {membershipExpiry.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {daysToExpiry !== null && daysToExpiry <= 60 && ` · ${daysToExpiry <= 0 ? 'EXPIRED' : `${daysToExpiry}d`}`}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {cleanPhone && (
                  <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 0', width: '100%' }}>
                    <a href={`tel:${cleanPhone}`}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        padding: '11px', borderRadius: '10px', textDecoration: 'none',
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#10B981', fontSize: '13px', fontWeight: '700',
                      }}>
                      <Phone size={15} /> Call
                    </a>
                    <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                        padding: '11px', borderRadius: '10px', textDecoration: 'none',
                        background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)',
                        color: '#25D366', fontSize: '13px', fontWeight: '700',
                      }}>
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                  </div>
                )}

                {/* Share contact via WhatsApp */}
                <div style={{ padding: '10px 20px 20px', width: '100%' }}>
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '11px', borderRadius: '10px', textDecoration: 'none', width: '100%',
                      background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(204,0,0,0.08))',
                      border: '1px solid rgba(201,168,76,0.25)',
                      color: '#C9A84C', fontSize: '13px', fontWeight: '700',
                    }}>
                    <Share2 size={14} /> Share Contact via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── DESKTOP profile header ── */}
      <div className="hidden md:flex" style={{
        background: 'rgba(13,19,36,0.55)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
        padding: '32px', marginBottom: '20px',
        alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
      }}>
        {/* Avatar with traffic light ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4B5563, #6B7280)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '28px', color: '#C9A84C',
            border: `3px solid ${trafficHex}`,
            boxShadow: `0 0 16px ${trafficHex}60`,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div title={trafficScore.label} style={{
            position: 'absolute', bottom: '-4px', right: '-4px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: trafficHex, border: '2px solid #0A0F1E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: '800', color: trafficScore.color === 'yellow' ? '#000' : '#fff',
            boxShadow: `0 0 8px ${trafficHex}80`,
          }}>{trafficScore.total}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-montserrat), sans-serif', fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>
              {user.name}
            </h1>
            <span style={{ fontSize: '13px', padding: '3px 10px', borderRadius: '4px', backgroundColor: roleBg, color: roleColor, textTransform: 'capitalize' }}>
              {roleLabel}
            </span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '4px', backgroundColor: `${trafficHex}18`, color: trafficHex, fontWeight: '700' }}>
              {trafficScore.label}
            </span>
          </div>

          {memberPins.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {memberPins.map((mp) => (
                <span key={mp.id} title={`${mp.pin.label}${mp.notes ? ` — ${mp.notes}` : ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '12px', fontSize: '12px', background: `${mp.pin.color}18`, border: `1px solid ${mp.pin.color}40`, color: mp.pin.color, fontWeight: '600' }}>
                  <span>{mp.pin.icon}</span> {mp.pin.label}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {[
              { icon: Mail, value: user.email },
              user.phone ? { icon: Phone, value: user.phone } : null,
              user.business ? { icon: Building, value: user.business } : null,
              user.category ? { icon: Tag, value: user.category } : null,
              { icon: Calendar, value: `Joined ${new Date((user as any).joinedAt ?? user.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}` },
            ]
              .filter((x): x is { icon: typeof Mail; value: string } => x !== null)
              .map((item, i) => {
                const IconComp = item.icon
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF', fontSize: '13px' }}>
                    <IconComp size={13} style={{ color: '#6B7280' }} />
                    {item.value}
                  </div>
                )
              })}
          </div>

          {membershipExpiry && (
            <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: daysToExpiry !== null && daysToExpiry <= 30 ? 'rgba(204,0,0,0.1)' : daysToExpiry !== null && daysToExpiry <= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${daysToExpiry !== null && daysToExpiry <= 30 ? 'rgba(204,0,0,0.25)' : daysToExpiry !== null && daysToExpiry <= 60 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`, color: daysToExpiry !== null && daysToExpiry <= 30 ? '#CC0000' : daysToExpiry !== null && daysToExpiry <= 60 ? '#F59E0B' : '#10B981' }}>
              <Award size={12} />
              Membership valid till {membershipExpiry.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
              {daysToExpiry !== null && daysToExpiry <= 60 && ` (${daysToExpiry <= 0 ? 'EXPIRED' : `${daysToExpiry} days`})`}
            </div>
          )}
        </div>

        {/* Stats — desktop only */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Points', value: totalPoints, color: '#C9A84C' },
            { label: 'Verified', value: verifiedAchievements, color: '#10B981' },
            { label: 'Tasks', value: tasks.length, color: '#3B82F6' },
            { label: 'Contacts', value: totalContacts, color: '#8B5CF6' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(6,10,20,0.6)', border: '1px solid rgba(255,255,255,0.07)', minWidth: '70px' }}>
              <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', color: stat.color, lineHeight: '1' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic light + Pins management (client interactive) */}
      <MemberProfileClient
        memberId={id}
        memberName={user.name}
        trafficScore={trafficScore}
        memberPins={memberPins.map((mp) => ({ id: mp.id, pinSlug: mp.pinSlug, pin: mp.pin, awardedAt: mp.awardedAt?.toString() ?? '' }))}
        allPins={allPins}
        canManagePins={canManagePins}
        canManage={canManage}
        membershipValidTill={user.membershipValidTill?.toISOString() ?? null}
        memberEmail={user.email}
        memberPhone={user.phone ?? null}
        memberBusiness={user.business ?? null}
        memberCategory={user.category ?? null}
        memberRole={user.role}
        memberJoinedAt={(user as any).joinedAt?.toISOString() ?? null}
        roles={roles.map((r) => ({ id: r.id, slug: r.slug, label: r.label, color: r.color }))}
      />

      {/* Profile Completeness */}
      {(() => {
        const spherePct = Math.min(Math.round((totalContacts / 40) * 100), 100)
        const sphereColor = totalContacts >= 40 ? '#10B981' : totalContacts >= 20 ? '#C9A84C' : '#CC0000'
        const hasPhone = !!user.phone
        const hasBusiness = !!user.business
        const hasCategory = !!user.category
        const profileFields = [hasPhone, hasBusiness, hasCategory, totalContacts > 0]
        const profileScore = profileFields.filter(Boolean).length
        const overallPct = Math.round(((profileScore / 4) * 40 + (Math.min(totalContacts, 40))) / 80 * 100)
        return (
          <div style={{
            background: 'rgba(13,19,36,0.55)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
            padding: '20px 24px', marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Profile Completeness</h2>
              <span style={{
                fontSize: '22px', fontFamily: 'var(--font-bebas), sans-serif',
                color: overallPct >= 80 ? '#10B981' : overallPct >= 50 ? '#C9A84C' : '#CC0000',
                letterSpacing: '1px',
              }}>{overallPct}%</span>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '600' }}>Contact Sphere</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: sphereColor }}>{totalContacts} / 40 contacts</span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255,255,255,0.07)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${spherePct}%`,
                  background: totalContacts >= 40 ? '#10B981' : `linear-gradient(90deg, #CC0000, ${sphereColor})`,
                  borderRadius: '5px', transition: 'width 0.4s',
                }} />
              </div>
              <p style={{ fontSize: '13px', color: '#8B95A3', marginTop: '4px' }}>
                {totalContacts >= 40 ? '✓ Full sphere contributed — great work!' : `${40 - totalContacts} more contacts needed`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Phone', done: hasPhone },
                { label: 'Business', done: hasBusiness },
                { label: 'Category', done: hasCategory },
                { label: 'Has Contacts', done: totalContacts > 0 },
              ].map((item) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px',
                  borderRadius: '5px', fontSize: '13px',
                  background: item.done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${item.done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  color: item.done ? '#10B981' : '#6B7280',
                }}>
                  <span>{item.done ? '✓' : '○'}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Three columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Achievements */}
        <div style={{
          background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={16} style={{ color: '#C9A84C' }} />
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>Recent Achievements</h2>
          </div>
          <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
            {achievements.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8B95A3', fontSize: '17px' }}>No achievements yet</div>
            ) : (
              achievements.map((a) => (
                <div key={a.id} style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '17px', padding: '2px 8px', borderRadius: '3px', backgroundColor: `${CATEGORY_COLORS[a.category] ?? '#9CA3AF'}20`, color: CATEGORY_COLORS[a.category] ?? '#9CA3AF', textTransform: 'capitalize' }}>
                      {a.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '700', color: '#10B981' }}>+{a.points}</span>
                      {a.verified && <span style={{ fontSize: '17px', color: '#10B981' }}>✓</span>}
                    </div>
                  </div>
                  {a.description && <p style={{ fontSize: '17px', color: '#6B7280', margin: 0 }}>{a.description}</p>}
                  <div style={{ fontSize: '17px', color: '#8B95A3', marginTop: '4px' }}>{new Date(a.date).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks */}
        <div style={{
          background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={16} style={{ color: '#CC0000' }} />
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>Recent Tasks</h2>
          </div>
          <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8B95A3', fontSize: '17px' }}>No tasks yet</div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '17px', color: '#ffffff', fontWeight: '600' }}>{t.contactName}</div>
                    <span style={{
                      fontSize: '17px', padding: '2px 6px', borderRadius: '3px',
                      backgroundColor: t.status === 'done' ? 'rgba(16,185,129,0.15)' : t.status === 'callback' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                      color: t.status === 'done' ? '#10B981' : t.status === 'callback' ? '#F59E0B' : '#9CA3AF',
                    }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize: '17px', color: '#8B95A3', marginTop: '2px' }}>{t.week} • {t.taskType}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact Sphere */}
        <div style={{
          background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} style={{ color: '#8B5CF6' }} />
            <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff' }}>Contact Sphere</h2>
          </div>
          <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
            {contacts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8B95A3', fontSize: '17px' }}>No contacts yet</div>
            ) : (
              contacts.map((c) => (
                <div key={c.id} style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '17px', color: '#ffffff', fontWeight: '600' }}>{c.contactName}</div>
                  <div style={{ fontSize: '17px', color: '#6B7280', marginTop: '2px' }}>
                    {c.business || c.relationship || ''}{c.phone && ` • ${c.phone}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
