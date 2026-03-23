'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  User, Phone, Mail, Building2, Tag, Lock, Save,
  ArrowLeft, Eye, EyeOff, Camera, ImageIcon, X,
} from 'lucide-react'
import Link from 'next/link'

type UserData = {
  id: string
  name: string
  email: string
  phone: string | null
  business: string | null
  category: string | null
  avatar: string | null
  professionalPhoto: string | null
  role: string
  membershipValidTill: string | null
  joinedAt: string | null
}

// Strip +91 prefix for display, return raw digits
function stripCountryCode(val: string | null): string {
  if (!val) return ''
  return val.replace(/^\+91[\s-]?/, '').replace(/\s/g, '')
}

// Always store as +91XXXXXXXXXX
function withCountryCode(digits: string): string | null {
  const clean = digits.replace(/\D/g, '').replace(/^91/, '')
  return clean ? `+91${clean}` : null
}

const GLASS: React.CSSProperties = {
  background: 'rgba(13,19,36,0.6)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
}

const INPUT: React.CSSProperties = {
  flex: 1, padding: '10px 12px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(6,10,20,0.7)',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '700', color: '#9CA3AF',
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px',
}

export default function PortalProfileClient({
  user,
  roleLabel,
  roleColor,
}: {
  user: UserData
  roleLabel: string | null
  roleColor: string
}) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const avatarRef = useRef<HTMLInputElement>(null)
  const proPhotoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: stripCountryCode(user.phone),
    business: user.business ?? '',
    category: user.category ?? '',
    avatar: user.avatar ?? '',
    professionalPhoto: user.professionalPhoto ?? '',
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [activeSection, setActiveSection] = useState<'info' | 'photos' | 'password'>('info')

  const initials = form.name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()

  function handleImageFile(
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'avatar' | 'professionalPhoto',
    maxMB: number
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Image must be under ${maxMB}MB`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, [field]: reader.result as string }))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const res = await fetch(`/api/members/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: withCountryCode(form.phone),
        business: form.business.trim() || null,
        category: form.category.trim() || null,
        avatar: form.avatar || null,
        professionalPhoto: form.professionalPhoto || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      // Sync name into the JWT session
      await updateSession({ name: updated.name }).catch(() => {})
      // Notify ProfileDropdown to re-fetch avatar/details
      window.dispatchEvent(new CustomEvent('oscar:profile-updated'))
      toast.success('Profile updated!')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error ?? 'Failed to save')
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { toast.error('Enter a new password'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    setSavingPwd(true)
    const res = await fetch(`/api/members/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setSavingPwd(false)
    if (res.ok) {
      toast.success('Password changed!')
      setPassword('')
      setConfirmPassword('')
    } else {
      toast.error('Failed to change password')
    }
  }

  const SECTIONS = [
    { key: 'info', label: 'Personal Info' },
    { key: 'photos', label: 'Photos' },
    { key: 'password', label: 'Password' },
  ] as const

  return (
    <>
      <style>{`
        .profile-grid { display: grid; grid-template-columns: 1fr; gap: 14px; max-width: 600px; margin: 0 auto; }
        .phone-wrap { display: flex; align-items: stretch; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); background: rgba(6,10,20,0.7); }
        .phone-prefix { display: flex; align-items: center; gap: 5px; padding: 0 10px; border-right: 1px solid rgba(255,255,255,0.08); color: #9CA3AF; font-size: 13px; white-space: nowrap; flex-shrink: 0; }
        .phone-input { flex: 1; padding: 10px 12px; border: none; background: transparent; color: #fff; font-size: 14px; outline: none; min-width: 0; }
        .phone-wrap:focus-within { border-color: rgba(201,168,76,0.5); }
        .section-tab { padding: 8px 16px; border-radius: 7px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .field-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="profile-grid">
        {/* Back */}
        <Link href="/portal" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {/* Profile header card */}
        <div style={{ ...GLASS, padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar with camera button */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {form.avatar ? (
              <img src={form.avatar} alt="avatar" style={{ width: '62px', height: '62px', borderRadius: '14px', objectFit: 'cover', border: `2px solid ${roleColor}50` }} />
            ) : (
              <div style={{ width: '62px', height: '62px', borderRadius: '14px', background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}10)`, border: `2px solid ${roleColor}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-bebas), sans-serif', fontSize: '22px', color: roleColor }}>
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              title="Change profile photo"
              style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: '#C9A84C', border: '2px solid #0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Camera size={10} style={{ color: '#000' }} />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFile(e, 'avatar', 2)} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.name || 'Your Name'}
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>
              {form.business || 'Your Business'}
            </div>
            {roleLabel && (
              <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: '700', padding: '2px 9px', borderRadius: '20px', background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}35` }}>
                {roleLabel}
              </span>
            )}
          </div>

          {user.membershipValidTill && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valid till</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#C9A84C' }}>
                {new Date(user.membershipValidTill).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className="section-tab"
              style={{
                flex: 1,
                background: activeSection === s.key ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: activeSection === s.key ? '#C9A84C' : '#6B7280',
                borderBottom: activeSection === s.key ? '2px solid #C9A84C' : '2px solid transparent',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── PERSONAL INFO ── */}
        {activeSection === 'info' && (
          <form onSubmit={saveProfile}>
            <div style={{ ...GLASS, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Personal Information
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '13px' }}>

                {/* Name + Email */}
                <div className="field-row">
                  <div>
                    <label style={LABEL}><User size={10} style={{ display: 'inline', marginRight: '4px' }} />Full Name *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        value={form.name} required
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        style={{ ...INPUT, paddingLeft: '12px' }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={LABEL}><Mail size={10} style={{ display: 'inline', marginRight: '4px' }} />Email *</label>
                    <input
                      type="email" value={form.email} required
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      style={{ ...INPUT, width: '100%' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                </div>

                {/* Phone with +91 */}
                <div>
                  <label style={LABEL}><Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />Mobile Number</label>
                  <div className="phone-wrap">
                    <div className="phone-prefix">
                      🇮🇳 +91
                    </div>
                    <input
                      className="phone-input"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setForm((f) => ({ ...f, phone: digits }))
                      }}
                      placeholder="98765 43210"
                      maxLength={10}
                    />
                    {form.phone && (
                      <button type="button" onClick={() => setForm((f) => ({ ...f, phone: '' }))} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>Enter 10-digit number without country code</div>
                </div>

                {/* Business + Category */}
                <div className="field-row">
                  <div>
                    <label style={LABEL}><Building2 size={10} style={{ display: 'inline', marginRight: '4px' }} />Business Name</label>
                    <input
                      value={form.business}
                      onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))}
                      placeholder="Your company / brand"
                      style={{ ...INPUT, width: '100%' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                  <div>
                    <label style={LABEL}><Tag size={10} style={{ display: 'inline', marginRight: '4px' }} />Category</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Digital Marketing"
                      style={{ ...INPUT, width: '100%' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '9px', border: 'none', background: saving ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.9)', color: '#000', fontSize: '13px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}>
                  <Save size={14} />{saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── PHOTOS ── */}
        {activeSection === 'photos' && (
          <form onSubmit={saveProfile}>
            <div style={{ ...GLASS, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Profile Photos
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Profile photo */}
                <div>
                  <label style={{ ...LABEL, marginBottom: '10px' }}>
                    <Camera size={10} style={{ display: 'inline', marginRight: '4px' }} />Profile Photo
                    <span style={{ marginLeft: '6px', fontWeight: '400', color: '#6B7280', textTransform: 'none', letterSpacing: 0 }}>— max 2MB</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      onClick={() => avatarRef.current?.click()}
                      style={{ width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', border: `2px dashed ${form.avatar ? roleColor + '60' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}
                    >
                      {form.avatar ? (
                        <img src={form.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Camera size={22} style={{ color: '#6B7280' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#D1D5DB', marginBottom: '4px', fontWeight: '600' }}>
                        {form.avatar ? 'Profile photo uploaded' : 'No profile photo'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '8px' }}>
                        Used across the chapter portal. Keep it professional.
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => avatarRef.current?.click()} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.1)', color: '#C9A84C', cursor: 'pointer', fontWeight: '600' }}>
                          {form.avatar ? 'Change' : 'Upload'}
                        </button>
                        {form.avatar && (
                          <button type="button" onClick={() => setForm((f) => ({ ...f, avatar: '' }))} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer' }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFile(e, 'avatar', 2)} />
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                {/* Professional photo */}
                <div>
                  <label style={{ ...LABEL, marginBottom: '10px' }}>
                    <ImageIcon size={10} style={{ display: 'inline', marginRight: '4px' }} />Professional Suite Photo
                    <span style={{ marginLeft: '6px', fontWeight: '400', color: '#6B7280', textTransform: 'none', letterSpacing: 0 }}>— max 5MB</span>
                  </label>
                  <div
                    onClick={() => proPhotoRef.current?.click()}
                    style={{ width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', border: `2px dashed ${form.professionalPhoto ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative' }}
                  >
                    {form.professionalPhoto ? (
                      <>
                        <img src={form.professionalPhoto} alt="professional" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
                          <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); proPhotoRef.current?.click() }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(0,0,0,0.7)', color: '#fff', cursor: 'pointer' }}>Change</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, professionalPhoto: '' })) }} style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: 'none', background: 'rgba(204,0,0,0.7)', color: '#fff', cursor: 'pointer' }}>Remove</button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px' }}>
                        <ImageIcon size={32} style={{ color: '#4B5563', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>Click to upload professional photo</div>
                        <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '4px' }}>Used for chapter posters & announcements</div>
                        <div style={{ fontSize: '10px', color: '#374151', marginTop: '3px' }}>JPG, PNG · Max 5MB · Portrait preferred</div>
                      </div>
                    )}
                  </div>
                  <input ref={proPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageFile(e, 'professionalPhoto', 5)} />
                </div>
              </div>

              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '9px', border: 'none', background: saving ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.9)', color: '#000', fontSize: '13px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  <Save size={14} />{saving ? 'Saving...' : 'Save Photos'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── PASSWORD ── */}
        {activeSection === 'password' && (
          <form onSubmit={changePassword}>
            <div style={{ ...GLASS, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                Change Password
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                <div>
                  <label style={LABEL}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      style={{ ...INPUT, width: '100%', paddingLeft: '36px', paddingRight: '38px' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex' }}>
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={LABEL}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{ ...INPUT, width: '100%', paddingLeft: '36px' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(201,168,76,0.5)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <div style={{ fontSize: '11px', color: '#CC0000', background: 'rgba(204,0,0,0.1)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(204,0,0,0.25)' }}>
                    Passwords do not match
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="submit" disabled={savingPwd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', padding: '11px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#D1D5DB', fontSize: '13px', fontWeight: '800', cursor: savingPwd ? 'not-allowed' : 'pointer' }}>
                  <Lock size={14} />{savingPwd ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </>
  )
}
