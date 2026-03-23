'use client'
import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'

export default function RegionSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', logoUrl: '' })

  useEffect(() => {
    fetch('/api/region/settings')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setForm({ name: data.name ?? '', slug: data.slug ?? '', logoUrl: data.logoUrl ?? '' })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)
    try {
      const res = await fetch('/api/region/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); setSaving(false); return }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch { setError('Network error') }
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          REGION <span style={{ color: '#3B82F6' }}>SETTINGS</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>Configure your region profile</p>
      </div>

      <form onSubmit={handleSave} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
        {error && <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#6EE7B7', fontSize: '14px' }}>Settings saved.</div>}

        <div style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Region Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. BNI South Kerala" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Region Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} placeholder="e.g. bni-south" style={inputStyle} pattern="[a-z0-9\-]+" />
            <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '4px' }}>Login URL: <span style={{ color: '#3B82F6' }}>bni.sisbios.cloud</span></p>
          </div>
          <div>
            <label style={labelStyle}>Logo URL</label>
            <input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button type="submit" disabled={saving} style={{
            padding: '12px 28px', borderRadius: '10px',
            background: saving ? 'rgba(30,64,175,0.4)' : 'rgba(30,64,175,0.8)',
            border: '1px solid rgba(59,130,246,0.4)', color: '#ffffff',
            fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Settings</>}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
