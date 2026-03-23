'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { computeTrafficScore, TRAFFIC_COLORS, type ScoreBreakdown } from '@/lib/traffic-light'
import { X, Award, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

type BniPin = {
  id: string; slug: string; label: string; description: string | null; icon: string; color: string
}
type MemberPinData = {
  id: string; pinId: string; pin: BniPin; awardedAt: string
}
type Role = {
  id: string; slug: string; label: string; color: string
}

type Props = {
  memberId: string
  memberName: string
  trafficScore: ScoreBreakdown
  memberPins: MemberPinData[]
  allPins: BniPin[]
  canManagePins: boolean
  canManage: boolean
  membershipValidTill: string | null
  memberEmail: string
  memberPhone: string | null
  memberBusiness: string | null
  memberCategory: string | null
  memberRole: string
  memberJoinedAt: string | null
  roles: Role[]
}

const TL_BG = {
  green: 'rgba(16,185,129,0.15)', yellow: 'rgba(245,158,11,0.15)',
  red: 'rgba(204,0,0,0.15)', black: 'rgba(107,114,128,0.15)',
} as const

const CARD_STYLE = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

const INPUT_STYLE = {
  width: '100%',
  background: 'rgba(6,10,20,0.8)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  borderRadius: '7px',
  padding: '9px 12px',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  colorScheme: 'dark',
}

export default function MemberProfileClient({
  memberId, memberName, trafficScore,
  memberPins: initialPins, allPins, canManagePins, canManage,
  membershipValidTill,
  memberEmail, memberPhone, memberBusiness, memberCategory, memberRole, memberJoinedAt, roles,
}: Props) {
  const router = useRouter()
  const [showTrafficPopup, setShowTrafficPopup] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [pins, setPins] = useState(initialPins)
  const [membershipDate, setMembershipDate] = useState(membershipValidTill ? membershipValidTill.split('T')[0] : '')
  const [savingMembership, setSavingMembership] = useState(false)

  // Edit form state
  // Strip +91 for display in phone inputs
  function stripCode(v: string | null) { return (v ?? '').replace(/^\+91[\s-]?/, '').replace(/\s/g, '') }

  const [editForm, setEditForm] = useState({
    name: memberName,
    email: memberEmail,
    phone: stripCode(memberPhone),
    business: memberBusiness ?? '',
    category: memberCategory ?? '',
    role: memberRole,
    joinedAt: memberJoinedAt ? memberJoinedAt.split('T')[0] : '',
    membershipValidTill: membershipValidTill ? membershipValidTill.split('T')[0] : '',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const hex = TRAFFIC_COLORS[trafficScore.color]
  const awardedIds = new Set(pins.map((p) => p.pinId))

  async function awardPin(pinId: string) {
    const res = await fetch('/api/member-pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberId, pinId }),
    })
    if (res.ok) {
      const data = await res.json()
      setPins((prev) => [...prev, { id: data.id, pinId: data.pinId, pin: data.pin, awardedAt: data.awardedAt }])
      toast.success(`${data.pin.label} awarded to ${memberName}`)
    } else toast.error('Failed to award pin')
  }

  async function revokePin(pinId: string, pinLabel: string) {
    if (!confirm(`Remove "${pinLabel}" from ${memberName}?`)) return
    const res = await fetch(`/api/member-pins/${pinId}`, { method: 'DELETE' })
    if (res.ok) {
      setPins((prev) => prev.filter((p) => p.id !== pinId))
      toast.success('Pin removed')
    } else toast.error('Failed to remove pin')
  }

  async function saveMembership() {
    setSavingMembership(true)
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipValidTill: membershipDate || null }),
    })
    if (res.ok) {
      toast.success('Membership date saved')
      router.refresh()
    } else toast.error('Failed to save membership date')
    setSavingMembership(false)
  }

  async function saveEdit() {
    if (!editForm.name.trim()) return toast.error('Name is required')
    if (!editForm.email.trim()) return toast.error('Email is required')
    setSavingEdit(true)
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() ? `+91${editForm.phone.replace(/\D/g,'')}` : null,
        business: editForm.business.trim() || null,
        category: editForm.category.trim() || null,
        role: editForm.role,
        joinedAt: editForm.joinedAt || null,
        membershipValidTill: editForm.membershipValidTill || null,
      }),
    })
    if (res.ok) {
      toast.success('Member details saved')
      setShowEditModal(false)
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to save')
    }
    setSavingEdit(false)
  }

  return (
    <>
      {/* Traffic light + Pins + Membership row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>

        {/* Traffic Light Card */}
        <div style={{ ...CARD_STYLE, padding: '20px', cursor: 'pointer' }} onClick={() => setShowTrafficPopup(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', background: hex,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '20px', color: trafficScore.color === 'yellow' ? '#000' : '#fff',
              boxShadow: `0 0 20px ${hex}60`, flexShrink: 0,
            }}>{trafficScore.total}</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{trafficScore.label}</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{trafficScore.totalWeeksTracked} weeks tracked</div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Click for breakdown</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
            {[
              { v: trafficScore.referrals,    c: '#3B82F6', l: 'R',  max: 20 },
              { v: trafficScore.visitors,     c: '#F59E0B', l: 'V',  max: 20 },
              { v: trafficScore.tyfcb,        c: '#C9A84C', l: '₹',  max: 15 },
              { v: trafficScore.training,     c: '#EC4899', l: 'T',  max: 15 },
              { v: trafficScore.testimonials, c: '#8B5CF6', l: 'Te', max: 10 },
              { v: trafficScore.absence,      c: '#10B981', l: 'At', max: 15 },
              { v: trafficScore.late,         c: '#6B7280', l: 'L',  max: 5  },
            ].map((bar) => (
              <div key={bar.l} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: '28px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height: `${(bar.v / bar.max) * 100}%`, background: bar.c, borderRadius: '3px 3px 0 0', minHeight: bar.v > 0 ? '3px' : '0' }} />
                </div>
                <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px', fontWeight: '700' }}>{bar.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pins Card */}
        <div style={{ ...CARD_STYLE, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} style={{ color: '#C9A84C' }} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>BNI Pins & Badges</span>
            </div>
            {canManagePins && (
              <button onClick={() => setShowPinModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(201,168,76,0.15)', color: '#C9A84C', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                <Plus size={12} /> Award
              </button>
            )}
          </div>
          {pins.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '16px 0' }}>No pins awarded yet</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {pins.map((mp) => (
                <div key={mp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', background: `${mp.pin.color}18`, border: `1px solid ${mp.pin.color}40`, color: mp.pin.color, fontWeight: '600' }}>
                  <span>{mp.pin.icon}</span>
                  {mp.pin.label}
                  {canManagePins && (
                    <button onClick={() => revokePin(mp.id, mp.pin.label)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: mp.pin.color, opacity: 0.6, padding: '0 0 0 2px', display: 'flex', alignItems: 'center' }}
                      title="Remove pin">
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Membership Card + Edit button */}
        {canManagePins && (
          <div style={{ ...CARD_STYLE, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Membership Validity</span>
              </div>
              {canManage && (
                <button onClick={() => setShowEditModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                  <Edit2 size={12} /> Edit Member
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" value={membershipDate} onChange={(e) => setMembershipDate(e.target.value)}
                style={{ flex: 1, background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '7px', padding: '8px 12px', fontSize: '13px', outline: 'none', colorScheme: 'dark' }}
              />
              <button onClick={saveMembership} disabled={savingMembership}
                style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', opacity: savingMembership ? 0.7 : 1 }}>
                Save
              </button>
            </div>
            {membershipDate && (
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                Valid until {new Date(membershipDate).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Traffic Light Popup ── */}
      {showTrafficPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => { setShowTrafficPopup(false); setTipsOpen(false) }}>
          <div style={{ ...CARD_STYLE, maxWidth: '440px', width: '100%', padding: '28px', border: `1px solid ${hex}40`, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#fff' }}>{memberName}</div>
                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Traffic Light Score — Last 26 Weeks</div>
              </div>
              <button onClick={() => { setShowTrafficPopup(false); setTipsOpen(false) }}
                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Big score */}
            <div style={{ textAlign: 'center', padding: '20px', background: TL_BG[trafficScore.color], borderRadius: '10px', marginBottom: '20px', border: `1px solid ${hex}30` }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: hex, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: '800', fontSize: '22px', color: trafficScore.color === 'yellow' ? '#000' : '#fff', boxShadow: `0 0 24px ${hex}80` }}>{trafficScore.total}</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#fff' }}>{trafficScore.label}</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>{trafficScore.totalWeeksTracked} weeks of data recorded</div>
            </div>

            {/* Score breakdown */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: '700' }}>Score Breakdown</div>
              {[
                { label: 'Referrals',    pts: trafficScore.referrals,    max: 20, raw: `${trafficScore.rawReferrals} total`,                       color: '#3B82F6', tiers: '1→5 · 6→10 · 10→15 · 14→20' },
                { label: 'Visitors',     pts: trafficScore.visitors,     max: 20, raw: `${trafficScore.rawVisitors} total`,                        color: '#F59E0B', tiers: '1→5 · 5→10 · 11→15 · 17→20' },
                { label: 'TYFCB',        pts: trafficScore.tyfcb,        max: 15, raw: `₹${trafficScore.rawTyfcb.toLocaleString('en-IN')}`,        color: '#C9A84C', tiers: '₹4.97L→5 · ₹9.97L→10 · ₹19.97L→15' },
                { label: 'Training',     pts: trafficScore.training,     max: 15, raw: `${trafficScore.rawTraining} sessions`,                     color: '#EC4899', tiers: '1→5 · 2→10 · 3→15' },
                { label: 'Testimonials', pts: trafficScore.testimonials, max: 10, raw: `${trafficScore.rawTestimonials} given`,                    color: '#8B5CF6', tiers: '1→5 · 2→10' },
                { label: 'Absence',      pts: trafficScore.absence,      max: 15, raw: `${trafficScore.rawAbsent} absent (medical exempt)`,        color: '#10B981', tiers: '-5 per absence · max 15' },
                { label: 'Late Arrival', pts: trafficScore.late,         max: 5,  raw: `${trafficScore.rawLate} late`,                             color: '#6B7280', tiers: '0 lates → 5 pts' },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>{item.label} <span style={{ color: '#4B5563', fontWeight: '400', fontSize: '10px' }}>({item.tiers})</span></span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.pts}/{item.max} · <span style={{ color: '#6B7280', fontWeight: '400' }}>{item.raw}</span></span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(item.pts / item.max) * 100}%`, background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* To Improve — collapsible */}
            {trafficScore.tips.length > 0 && (
              <div style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <button
                  onClick={() => setTipsOpen((v) => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                    To Improve ({trafficScore.tips.length})
                  </span>
                  {tipsOpen ? <ChevronUp size={14} style={{ color: '#C9A84C' }} /> : <ChevronDown size={14} style={{ color: '#C9A84C' }} />}
                </button>
                {tipsOpen && (
                  <div style={{ padding: '10px 14px' }}>
                    {trafficScore.tips.map((tip, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '5px', paddingLeft: '12px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#C9A84C' }}>→</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Member Modal ── */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowEditModal(false)}>
          <div style={{ ...CARD_STYLE, background: 'rgba(10,15,28,0.95)', maxWidth: '540px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Edit Member</h2>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>{memberName}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Full Name *</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" style={INPUT_STYLE} />
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Email *</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Mobile</label>
                  <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(6,10,20,0.7)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 9px', borderRight: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>🇮🇳 +91</div>
                    <input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))} placeholder="98765 43210" maxLength={10} style={{ ...INPUT_STYLE, border: 'none', background: 'transparent', paddingLeft: '9px', flex: 1 }} />
                  </div>
                </div>
              </div>

              {/* Business + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Business</label>
                  <input value={editForm.business} onChange={(e) => setEditForm((f) => ({ ...f, business: e.target.value }))} placeholder="Business name" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Category</label>
                  <input value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} placeholder="Industry / sector" style={INPUT_STYLE} />
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Chapter Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer' }}>
                  {roles.map((r) => (
                    <option key={r.slug} value={r.slug} style={{ background: '#0d1324' }}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Joined At + Membership Valid Till */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Joining Date</label>
                  <input type="date" value={editForm.joinedAt} onChange={(e) => setEditForm((f) => ({ ...f, joinedAt: e.target.value }))} style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Membership Valid Till</label>
                  <input type="date" value={editForm.membershipValidTill} onChange={(e) => setEditForm((f) => ({ ...f, membershipValidTill: e.target.value }))} style={INPUT_STYLE} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)}
                style={{ padding: '9px 18px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={savingEdit}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', opacity: savingEdit ? 0.7 : 1 }}>
                <Save size={14} />
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pin Award Modal ── */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowPinModal(false)}>
          <div style={{ ...CARD_STYLE, maxWidth: '380px', width: '100%', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Award BNI Pin</div>
              <button onClick={() => setShowPinModal(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allPins.map((pin) => {
                const hasPin = awardedIds.has(pin.id)
                return (
                  <div key={pin.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: hasPin ? `${pin.color}12` : 'rgba(255,255,255,0.04)', border: `1px solid ${hasPin ? pin.color + '30' : 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{pin.icon}</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: hasPin ? pin.color : '#fff' }}>{pin.label}</div>
                        {pin.description && <div style={{ fontSize: '11px', color: '#6B7280' }}>{pin.description}</div>}
                      </div>
                    </div>
                    {hasPin ? (
                      <span style={{ fontSize: '11px', color: pin.color, fontWeight: '700' }}>✓ Awarded</span>
                    ) : (
                      <button onClick={() => awardPin(pin.id)}
                        style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: `${pin.color}20`, color: pin.color, cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                        Award
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
