'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'regional',      label: 'Regional Event' },
  { value: 'training',      label: 'Training' },
  { value: 'social',        label: 'Social' },
  { value: 'trip',          label: 'Trip' },
  { value: 'international', label: 'International' },
]

export default function NewRegionalEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    date: '', title: '', subtitle: '', eventType: 'regional', bookingRequired: false,
  })

  function set(key: string, val: string | boolean) { setForm((p) => ({ ...p, [key]: val })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date || !form.title.trim()) { setError('Date and title are required.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/region/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to create event'); setLoading(false); return }
    router.push('/region/events')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', color: '#9CA3AF', marginBottom: '5px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/region/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', textDecoration: 'none', marginBottom: '10px' }}>
          <ArrowLeft size={13} /> Back to events
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          NEW <span style={{ color: '#3B82F6' }}>REGIONAL EVENT</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>This event will appear in all chapter calendars</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
        {error && <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px', color: '#FCA5A5', fontSize: '13px' }}>{error}</div>}

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} required />
          </div>
          <div>
            <label style={labelStyle}>Event Title *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Regional Training Day" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Subtitle / Venue</label>
            <input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Grand Hyatt, Kochi" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Event Type</label>
            <select value={form.eventType} onChange={(e) => set('eventType', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', background: '#111827', colorScheme: 'dark' }}>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,10,20,0.4)' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Booking Required</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Enable registrations for this event</div>
            </div>
            <button type="button" onClick={() => set('bookingRequired', !form.bookingRequired)} style={{
              width: '44px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
              background: form.bookingRequired ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: '4px', left: form.bookingRequired ? '22px' : '4px',
                width: '18px', height: '18px', borderRadius: '50%', background: '#ffffff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: '22px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.4)',
            background: loading ? 'rgba(30,64,175,0.3)' : 'rgba(30,64,175,0.7)',
            color: '#ffffff', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create Regional Event'}
          </button>
          <Link href="/region/events" style={{ padding: '11px 18px', borderRadius: '10px', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', fontSize: '14px', fontWeight: '600' }}>
            Cancel
          </Link>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
