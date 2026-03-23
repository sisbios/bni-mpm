'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'

type ProfileData = {
  name: string | null
  phone: string | null
  business: string | null
  category: string | null
  avatar: string | null
  professionalPhoto: string | null
}

function computeCompleteness(p: ProfileData | null): { pct: number; missing: string[] } {
  if (!p) return { pct: 0, missing: [] }
  const checks = [
    { key: 'name', label: 'Name', ok: !!p.name?.trim() },
    { key: 'phone', label: 'Phone', ok: !!p.phone },
    { key: 'business', label: 'Business', ok: !!p.business },
    { key: 'category', label: 'Industry', ok: !!p.category },
    { key: 'avatar', label: 'Profile photo', ok: !!p.avatar },
  ]
  const done = checks.filter((c) => c.ok).length
  const missing = checks.filter((c) => !c.ok).map((c) => c.label)
  return { pct: Math.round((done / checks.length) * 100), missing }
}

export default function ProfileCompleteness({ compact = false }: { compact?: boolean }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      if (res.ok) setProfile(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetch_()
    const h = () => fetch_()
    window.addEventListener('oscar:profile-updated', h)
    return () => window.removeEventListener('oscar:profile-updated', h)
  }, [fetch_])

  const { pct, missing } = computeCompleteness(profile)
  if (pct === 100) return null // hide when complete

  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#C9A84C' : '#CC0000'

  if (compact) {
    // Compact version for mobile header area
    return (
      <Link href="/portal/profile" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(201,168,76,0.06)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#C9A84C', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Profile {pct}% complete
            </span>
            <AlertCircle size={12} style={{ color: '#C9A84C' }} />
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: '2px', transition: 'width 0.4s' }} />
          </div>
          {missing.length > 0 && (
            <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>
              Add: {missing.slice(0, 2).join(', ')}{missing.length > 2 ? ` +${missing.length - 2}` : ''}
            </div>
          )}
        </div>
      </Link>
    )
  }

  // Sidebar version
  return (
    <Link href="/portal/profile" style={{ textDecoration: 'none', display: 'block', padding: '12px', margin: '0 8px 8px' }}>
      <div style={{ background: 'rgba(201,168,76,0.06)', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.14)', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#C9A84C', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Profile Completeness
          </span>
          <span style={{ fontSize: '13px', fontWeight: '800', color }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: '3px', transition: 'width 0.4s' }} />
        </div>
        {missing.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {missing.map((m) => (
              <span key={m} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)' }}>
                {m}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
          <CheckCircle2 size={11} style={{ color: '#C9A84C' }} />
          <span style={{ fontSize: '10px', color: '#C9A84C', fontWeight: '600' }}>Tap to complete profile</span>
        </div>
      </div>
    </Link>
  )
}
