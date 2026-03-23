'use client'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  User, Mail, Phone, Building, Camera, Lock, Save, Globe,
  DollarSign, Image as ImageIcon, Shield,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import RolesTab, { type FullRole, type MemberSummary } from './RolesTab'

type UserData = {
  id: string; name: string; email: string; phone: string | null
  business: string | null; category: string | null; avatar: string | null; role: string
}

export default function SettingsClient({
  user: initialUser,
  accessLevel,
  canEditChapter,
  canManageRoles,
  chapterSettings: initialChapterSettings,
  roles,
  allMembers,
}: {
  user: UserData
  accessLevel: string
  canEditChapter: boolean
  canManageRoles: boolean
  chapterSettings: Record<string, string>
  roles: FullRole[]
  allMembers: MemberSummary[]
}) {
  const { update: updateSession } = useSession()
  const [user, setUser] = useState(initialUser)
  const [chapterSettings, setChapterSettings] = useState(initialChapterSettings)
  const [profileSaving, setProfileSaving] = useState(false)
  const [chapterSaving, setChapterSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'chapter' | 'roles' | 'password'>('profile')

  // Strip +91 prefix for phone display in input
  function stripCode(v: string | null) { return (v ?? '').replace(/^\+91[\s-]?/, '').replace(/\s/g, '') }

  const [profileForm, setProfileForm] = useState({
    name: user.name, email: user.email,
    phone: stripCode(user.phone), business: user.business ?? '',
    category: user.category ?? '', avatar: user.avatar ?? '',
  })
  const avatarRef = useRef<HTMLInputElement>(null)

  const [chapterForm, setChapterForm] = useState({
    chapterName: initialChapterSettings.chapterName ?? '',
    regionName: initialChapterSettings.regionName ?? '',
    weeklyPaymentAmount: initialChapterSettings.weeklyPaymentAmount ?? '',
    meetingDay: initialChapterSettings.meetingDay ?? '',
    meetingTime: initialChapterSettings.meetingTime ?? '',
    meetingVenue: initialChapterSettings.meetingVenue ?? '',
    chapterLogo: initialChapterSettings.chapterLogo ?? '',
    regionLogo: initialChapterSettings.regionLogo ?? '',
  })
  const chapterLogoRef = useRef<HTMLInputElement>(null)
  const regionLogoRef = useRef<HTMLInputElement>(null)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(6,10,20,0.8)',
    color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-montserrat), sans-serif', colorScheme: 'dark',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', color: '#9CA3AF',
    marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px',
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setProfileForm((p) => ({ ...p, avatar: reader.result as string }))
    reader.readAsDataURL(file)
  }

  function handleLogoChange(field: 'chapterLogo' | 'regionLogo', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setChapterForm((p) => ({ ...p, [field]: reader.result as string }))
    reader.readAsDataURL(file)
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    const res = await fetch(`/api/members/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileForm.name, email: profileForm.email,
        phone: profileForm.phone ? `+91${profileForm.phone.replace(/\D/g,'')}` : null,
        business: profileForm.business || null,
        category: profileForm.category || null, avatar: profileForm.avatar || null,
      }),
    })
    setProfileSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setUser((p) => ({ ...p, ...updated }))
      await updateSession({ name: updated.name })
      toast.success('Profile updated')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to save')
    }
  }

  async function handleChapterSave(e: React.FormEvent) {
    e.preventDefault()
    setChapterSaving(true)
    const res = await fetch('/api/chapter-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chapterForm),
    })
    setChapterSaving(false)
    if (res.ok) {
      const data = await res.json()
      setChapterSettings(data)
      toast.success('Chapter settings saved')
    } else toast.error('Failed to save chapter settings')
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.next.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setPwSaving(true)
    const res = await fetch(`/api/members/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwForm.next }),
    })
    setPwSaving(false)
    if (res.ok) {
      setPwForm({ current: '', next: '', confirm: '' })
      toast.success('Password changed')
    } else toast.error('Failed to change password')
  }

  const tabs = [
    { key: 'profile',  label: 'My Profile',       icon: User   },
    ...(canEditChapter  ? [{ key: 'chapter',  label: 'Chapter',  icon: Globe   }] : []),
    ...(canManageRoles  ? [{ key: 'roles',    label: 'Roles',    icon: Shield  }] : []),
    { key: 'password', label: 'Password',          icon: Lock   },
  ]

  return (
    <div style={{ maxWidth: activeTab === 'roles' ? '900px' : '700px', margin: '0 auto', transition: 'max-width 0.2s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1' }}>SETTINGS</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '5px' }}>
        {tabs.map((t) => {
          const IconComp = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '10px 8px', borderRadius: '7px', border: 'none',
                background: activeTab === t.key ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: activeTab === t.key ? '#C9A84C' : '#6B7280',
                fontSize: '12px', fontWeight: activeTab === t.key ? '700' : '600',
                cursor: 'pointer', transition: 'all 0.15s',
                borderBottom: activeTab === t.key ? '2px solid #C9A84C' : '2px solid transparent',
              }}
            >
              <IconComp size={14} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── MY PROFILE ── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave}>
          <div style={{ background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(201,168,76,0.4)' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '3px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#C9A84C' }}>
                    {profileForm.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button type="button" onClick={() => avatarRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#C9A84C', border: '2px solid #0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={12} style={{ color: '#000' }} />
                </button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>{user.name}</div>
                <div style={{ fontSize: '14px', color: '#C9A84C', textTransform: 'capitalize', marginTop: '2px' }}>
                  {roles.find((r) => r.slug === user.role)?.label ?? user.role}
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Click the camera to update your photo</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}><User size={11} style={{ display: 'inline', marginRight: '5px' }} />Full Name</label>
                  <input style={inputStyle} value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label style={labelStyle}><Mail size={11} style={{ display: 'inline', marginRight: '5px' }} />Email</label>
                  <input style={inputStyle} type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}><Phone size={11} style={{ display: 'inline', marginRight: '5px' }} />Mobile</label>
                  <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(6,10,20,0.8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="98765 43210"
                      maxLength={10}
                      style={{ ...inputStyle, border: 'none', background: 'transparent', paddingLeft: '10px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}><Building size={11} style={{ display: 'inline', marginRight: '5px' }} />Company</label>
                  <input style={inputStyle} value={profileForm.business} onChange={(e) => setProfileForm((p) => ({ ...p, business: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Business Category</label>
                <input style={inputStyle} value={profileForm.category} onChange={(e) => setProfileForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Real Estate, Insurance" />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={profileSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '15px', fontWeight: '700', cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.7 : 1 }}>
                <Save size={15} />{profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── CHAPTER SETTINGS ── */}
      {activeTab === 'chapter' && canEditChapter && (
        <form onSubmit={handleChapterSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={15} style={{ color: '#C9A84C' }} /> Logos
                </div>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Chapter Logo</label>
                  <div onClick={() => chapterLogoRef.current?.click()} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '10px', border: '2px dashed rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {chapterForm.chapterLogo
                      ? <img src={chapterForm.chapterLogo} alt="chapter logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                      : <><ImageIcon size={24} style={{ color: '#C9A84C', marginBottom: '6px' }} /><span style={{ fontSize: '13px', color: '#6B7280' }}>Click to upload</span></>}
                  </div>
                  <input ref={chapterLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleLogoChange('chapterLogo', e)} />
                </div>
                <div>
                  <label style={labelStyle}>Region Logo</label>
                  <div onClick={() => regionLogoRef.current?.click()} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '10px', border: '2px dashed rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {chapterForm.regionLogo
                      ? <img src={chapterForm.regionLogo} alt="region logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                      : <><ImageIcon size={24} style={{ color: '#3B82F6', marginBottom: '6px' }} /><span style={{ fontSize: '13px', color: '#6B7280' }}>Click to upload</span></>}
                  </div>
                  <input ref={regionLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleLogoChange('regionLogo', e)} />
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={15} style={{ color: '#C9A84C' }} /> Chapter Information
                </div>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Chapter Name</label>
                    <input style={inputStyle} value={chapterForm.chapterName} onChange={(e) => setChapterForm((p) => ({ ...p, chapterName: e.target.value }))} placeholder="BNI Oscar" />
                  </div>
                  <div>
                    <label style={labelStyle}>Region Name</label>
                    <input style={inputStyle} value={chapterForm.regionName} onChange={(e) => setChapterForm((p) => ({ ...p, regionName: e.target.value }))} placeholder="Region name" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}><DollarSign size={11} style={{ display: 'inline', marginRight: '5px' }} />Weekly Payment (₹)</label>
                  <input style={inputStyle} type="number" value={chapterForm.weeklyPaymentAmount} onChange={(e) => setChapterForm((p) => ({ ...p, weeklyPaymentAmount: e.target.value }))} placeholder="500" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Meeting Day</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={chapterForm.meetingDay} onChange={(e) => setChapterForm((p) => ({ ...p, meetingDay: e.target.value }))}>
                      <option value="">Select day...</option>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Meeting Time</label>
                    <input style={inputStyle} type="time" value={chapterForm.meetingTime} onChange={(e) => setChapterForm((p) => ({ ...p, meetingTime: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Meeting Venue</label>
                  <input style={inputStyle} value={chapterForm.meetingVenue} onChange={(e) => setChapterForm((p) => ({ ...p, meetingVenue: e.target.value }))} placeholder="Hotel / Address" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={chapterSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '15px', fontWeight: '700', cursor: chapterSaving ? 'not-allowed' : 'pointer', opacity: chapterSaving ? 0.7 : 1 }}>
                <Save size={15} />{chapterSaving ? 'Saving...' : 'Save Chapter Settings'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── ROLES ── */}
      {activeTab === 'roles' && canManageRoles && (
        <RolesTab roles={roles} members={allMembers} />
      )}

      {/* ── CHANGE PASSWORD ── */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSave}>
          <div style={{ background: 'rgba(13,19,36,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} style={{ color: '#C9A84C' }} /> Change Password
              </div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input style={inputStyle} type="password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} required placeholder="Minimum 6 characters" autoComplete="new-password" />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input style={inputStyle} type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} required placeholder="Repeat new password" autoComplete="new-password" />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={pwSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #880000)', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: pwSaving ? 'not-allowed' : 'pointer', opacity: pwSaving ? 0.7 : 1 }}>
                <Save size={15} />{pwSaving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
