'use client'
import { useState, useMemo } from 'react'
import { Search, Phone, MessageCircle, Share2, Users, X } from 'lucide-react'
import { toast } from 'sonner'

type Member = {
  id: string
  name: string
  business: string | null
  phone: string | null
  avatar: string | null
  role: string
  category: string | null
}

type RoleInfo = { slug: string; label: string; color: string }

const GLASS = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function MemberAvatar({ member, roleColor, size, radius }: { member: Member; roleColor: string; size: number; radius: number }) {
  if (member.avatar) {
    return (
      <img
        src={member.avatar}
        alt={member.name}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, display: 'block' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}10)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-bebas), sans-serif', fontSize: Math.round(size * 0.38), color: roleColor,
    }}>
      {initials(member.name)}
    </div>
  )
}

function ContactModal({ member, role, onClose }: { member: Member; role: RoleInfo | null; onClose: () => void }) {
  const roleColor = role?.color ?? '#9CA3AF'

  function callMember() {
    if (member.phone) window.location.href = `tel:${member.phone}`
    else toast.error('No phone number available')
  }

  function whatsappMember() {
    if (!member.phone) { toast.error('No phone number available'); return }
    const num = member.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(`Hi ${member.name}, I'm reaching out from BNI Oscar Chapter.`)
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  function shareContact() {
    const text = `${member.name}\n${member.business ?? 'BNI Oscar Chapter'}\n${member.phone ?? ''}`
    if (navigator.share) {
      navigator.share({ title: member.name, text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success('Contact details copied!'))
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '360px', borderRadius: '20px', overflow: 'hidden', background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo area with 45° gradient overlay */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: `linear-gradient(135deg, ${roleColor}20, rgba(10,15,30,0.9))` }}>
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '96px', color: roleColor, opacity: 0.5, lineHeight: 1 }}>
                {initials(member.name)}
              </div>
            </div>
          )}

          {/* 45° gradient: dark bottom-left → transparent top-right */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top right, rgba(6,10,20,0.92) 0%, rgba(6,10,20,0.55) 40%, rgba(6,10,20,0.0) 70%)',
            pointerEvents: 'none',
          }} />

          {/* Close button — top right */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.45)', color: '#fff', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>

          {/* Name + details — bottom left */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '60px', textAlign: 'left' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', lineHeight: 1.15, marginBottom: '4px', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
              {member.name}
            </div>
            {member.business && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', lineHeight: 1.3 }}>
                {member.business}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {role && (
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', background: `${roleColor}30`, color: roleColor, border: `1px solid ${roleColor}60`, textTransform: 'uppercase', letterSpacing: '0.5px', backdropFilter: 'blur(4px)' }}>
                  {role.label}
                </span>
              )}
              {member.category && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                  {member.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)' }}>
          {[
            { icon: Phone, label: 'Call', color: '#10B981', action: callMember, disabled: !member.phone },
            { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', action: whatsappMember, disabled: !member.phone },
            { icon: Share2, label: 'Share', color: '#3B82F6', action: shareContact, disabled: false },
          ].map((btn, i) => (
            <button
              key={btn.label}
              onClick={btn.action}
              disabled={btn.disabled}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '5px', padding: '14px 8px',
                border: 'none',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                cursor: btn.disabled ? 'not-allowed' : 'pointer',
                background: 'transparent',
                color: btn.disabled ? '#374151' : btn.color,
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: btn.disabled ? 'rgba(255,255,255,0.03)' : `${btn.color}18`, border: `1px solid ${btn.disabled ? 'rgba(255,255,255,0.05)' : btn.color + '35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <btn.icon size={15} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Phone number footer */}
        {member.phone && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={11} style={{ color: '#6B7280', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{member.phone}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortalMembersClient({
  members,
  roleMap,
  currentUserId,
}: {
  members: Member[]
  roleMap: Record<string, RoleInfo>
  currentUserId: string
}) {
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.business ?? '').toLowerCase().includes(q) ||
        (m.category ?? '').toLowerCase().includes(q) ||
        (roleMap[m.role]?.label ?? '').toLowerCase().includes(q)
    )
  }, [members, search, roleMap])

  return (
    <>
      <style>{`
        .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
        @media (max-width: 600px) { .member-grid { grid-template-columns: 1fr; } }
        .member-card { transition: transform 0.2s, box-shadow 0.2s; }
        .member-card:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,0.45) !important; }
      `}</style>

      {selectedMember && (
        <ContactModal member={selectedMember} role={roleMap[selectedMember.role] ?? null} onClose={() => setSelectedMember(null)} />
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
              CHAPTER MEMBERS
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
              {members.length} active members
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, business or category..."
            style={{
              width: '100%', padding: '10px 36px 10px 38px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(13,19,36,0.7)',
              color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {search && (
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
          </div>
        )}

        {/* Members grid */}
        {filtered.length === 0 ? (
          <div style={{ ...GLASS, padding: '60px', textAlign: 'center', color: '#8B95A3' }}>
            <Users size={36} style={{ margin: '0 auto 12px', color: '#4B5563' }} />
            <p>No members found</p>
          </div>
        ) : (
          <div className="member-grid">
            {filtered.map((member) => {
              const role = roleMap[member.role] ?? null
              const roleColor = role?.color ?? '#9CA3AF'
              const isMe = member.id === currentUserId

              return (
                <div
                  key={member.id}
                  className="member-card"
                  onClick={() => setSelectedMember(member)}
                  style={{
                    ...GLASS,
                    padding: '14px',
                    cursor: 'pointer',
                    borderColor: isMe ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Avatar — photo if available, else initials */}
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0, overflow: 'hidden',
                      border: `2px solid ${roleColor}${isMe ? '80' : '40'}`,
                    }}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}10)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-bebas), sans-serif', fontSize: '19px', color: roleColor,
                        }}>
                          {initials(member.name)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.name}
                        </span>
                        {isMe && (
                          <span style={{ fontSize: '9px', background: 'rgba(201,168,76,0.2)', color: '#C9A84C', padding: '1px 5px', borderRadius: '4px', flexShrink: 0, fontWeight: '700' }}>
                            YOU
                          </span>
                        )}
                      </div>
                      {member.business && (
                        <div style={{ fontSize: '12px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>
                          {member.business}
                        </div>
                      )}
                      {role && (
                        <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                          {role.label}
                        </span>
                      )}
                    </div>

                    {/* Quick action icons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {member.phone && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${member.phone}` }}
                            title="Call"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.1)', color: '#10B981', cursor: 'pointer' }}
                          >
                            <Phone size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const num = member.phone!.replace(/\D/g, '')
                              window.open(`https://wa.me/${num}`, '_blank')
                            }}
                            title="WhatsApp"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', border: '1px solid rgba(37,211,102,0.25)', background: 'rgba(37,211,102,0.1)', color: '#25D366', cursor: 'pointer' }}
                          >
                            <MessageCircle size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {member.category && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#6B7280', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {member.category}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
