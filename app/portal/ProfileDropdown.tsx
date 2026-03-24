'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown, Edit2 } from 'lucide-react'
import Link from 'next/link'

type ProfileData = {
  name: string
  avatar: string | null
  business: string | null
  category: string | null
  role: string
}

function Avatar({ data, size }: { data: ProfileData | null; size: number }) {
  const name = data?.name ?? ''
  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0] || '').join('').toUpperCase() || 'M'
  const radius = Math.round(size * 0.28)

  if (data?.avatar) {
    return (
      <img
        src={data.avatar}
        alt={name}
        style={{
          width: size, height: size, borderRadius: radius, objectFit: 'cover',
          border: '2px solid rgba(201,168,76,0.5)', flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: 'linear-gradient(135deg, rgba(201,168,76,0.28), rgba(201,168,76,0.1))',
      border: '1.5px solid rgba(201,168,76,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-bebas), sans-serif', fontSize: Math.round(size * 0.42), color: '#C9A84C',
    }}>
      {initials}
    </div>
  )
}

export default function ProfileDropdown() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      if (res.ok) setProfile(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchProfile()
    // Re-fetch whenever profile is saved from any page
    const handler = () => fetchProfile()
    window.addEventListener('oscar:profile-updated', handler)
    return () => window.removeEventListener('oscar:profile-updated', handler)
  }, [fetchProfile])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await signOut({ redirect: false })
    router.push('/login')
  }

  const firstName = (profile?.name ?? '').split(' ')[0] || 'Member'

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 8px 5px 5px', borderRadius: '10px',
          border: `1px solid ${open ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
          background: open ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)',
          cursor: 'pointer', transition: 'all 0.15s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Avatar data={profile} size={32} />

        <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {firstName}
          </div>
          <div style={{ fontSize: '10px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
            {profile?.category ?? 'Member Portal'}
          </div>
        </div>

        <ChevronDown size={12} style={{ color: '#6B7280', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
          width: '230px', borderRadius: '12px', overflow: 'hidden',
          background: 'rgba(10,15,30,0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}>
          {/* Profile header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar data={profile} size={44} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.name ?? 'Member'}
                </div>
                {profile?.business && (
                  <div style={{ fontSize: '11px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {profile.business}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#C9A84C', marginTop: '3px' }}>
                  {profile?.category ?? 'BNI Member'}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: '6px' }}>
            <Link
              href="/portal/profile"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', textDecoration: 'none',
                color: '#D1D5DB', fontSize: '13px', fontWeight: '500',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D1D5DB' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Edit2 size={13} style={{ color: '#3B82F6' }} />
              </div>
              Edit Profile
            </Link>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '9px 12px', borderRadius: '8px',
                background: 'transparent', border: 'none',
                color: '#D1D5DB', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; e.currentTarget.style.color = '#CC0000' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D1D5DB' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LogOut size={13} style={{ color: '#CC0000' }} />
              </div>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
