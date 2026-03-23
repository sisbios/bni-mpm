'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function NewChapterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', city: '', meetingDay: '', meetingTime: '', logoUrl: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((f) => {
      const updated = { ...f, [name]: value }
      // Auto-generate slug from name if slug is empty or was auto-generated
      if (name === 'name') {
        const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        if (!f.slug || f.slug === f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
          updated.slug = autoSlug
        }
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/region/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create chapter'); setLoading(false); return }
      router.push(`/region/chapters/${data.id}`)
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/region/chapters" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', textDecoration: 'none', marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to chapters
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          NEW <span style={{ color: '#3B82F6' }}>CHAPTER</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>Create a new chapter in your region</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
        {error && (
          <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Chapter Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Oscar" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>URL Slug *</label>
            <input name="slug" value={form.slug} onChange={handleChange} placeholder="e.g. oscar" style={inputStyle} pattern="[a-z0-9\-]+" required />
            <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '4px' }}>Used in subdomain: <span style={{ color: '#3B82F6' }}>{form.slug || 'slug'}.bni.sisbios.cloud</span></p>
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Malappuram" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Meeting Day</label>
              <select name="meetingDay" value={form.meetingDay} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer', background: '#111827', colorScheme: 'dark' }}>
                <option value="">Select day</option>
                {MEETING_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Meeting Time</label>
              <input name="meetingTime" value={form.meetingTime} onChange={handleChange} placeholder="e.g. 07:00" type="time" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Logo URL</label>
            <input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              background: loading ? 'rgba(30,64,175,0.4)' : 'rgba(30,64,175,0.8)',
              border: '1px solid rgba(59,130,246,0.4)', color: '#ffffff',
              fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create Chapter'}
          </button>
          <Link href="/region/chapters" style={{
            padding: '12px 20px', borderRadius: '10px', textDecoration: 'none',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#6B7280', fontSize: '14px', fontWeight: '600',
          }}>
            Cancel
          </Link>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
