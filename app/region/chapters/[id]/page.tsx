'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trash2, Save } from 'lucide-react'

const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type Chapter = {
  id: string; name: string; slug: string; city: string | null; meetingDay: string | null;
  meetingTime: string | null; logoUrl: string | null; isActive: boolean; regionId: string;
}

export default function ChapterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', city: '', meetingDay: '', meetingTime: '', logoUrl: '', isActive: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    fetch(`/api/region/chapters/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setChapter(data)
        setForm({
          name: data.name ?? '', slug: data.slug ?? '', city: data.city ?? '',
          meetingDay: data.meetingDay ?? '', meetingTime: data.meetingTime ?? '',
          logoUrl: data.logoUrl ?? '', isActive: data.isActive ?? true,
        })
        setLoading(false)
      })
      .catch(() => { setError('Failed to load chapter'); setLoading(false) })
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)
    try {
      const res = await fetch(`/api/region/chapters/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); setSaving(false); return }
      setChapter(data); setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch { setError('Network error') }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/region/chapters/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Delete failed'); setDeleting(false); setConfirmDelete(false); return }
      router.push('/region/chapters')
    } catch { setError('Network error'); setDeleting(false); setConfirmDelete(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/region/chapters" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', textDecoration: 'none', marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to chapters
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          EDIT <span style={{ color: '#3B82F6' }}>CHAPTER</span>
        </h1>
        {chapter && <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>slug: <span style={{ color: '#4B5563' }}>{chapter.slug}</span></p>}
      </div>

      <form onSubmit={handleSave} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
        {error && <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#6EE7B7', fontSize: '14px' }}>Saved successfully.</div>}

        <div style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Chapter Name</label>
            <input name="name" value={form.name} onChange={handleChange} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>URL Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} style={inputStyle} pattern="[a-z0-9\-]+" required />
            <p style={{ fontSize: '11px', color: '#4B5563', marginTop: '4px' }}>Subdomain: <span style={{ color: '#3B82F6' }}>{form.slug}.bni.sisbios.cloud</span></p>
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Malappuram" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Meeting Day</label>
              <select name="meetingDay" value={form.meetingDay} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select day</option>
                {MEETING_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Meeting Time</label>
              <input name="meetingTime" value={form.meetingTime} onChange={handleChange} type="time" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Logo URL</label>
            <input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox" name="isActive" id="isActive"
              checked={form.isActive}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3B82F6' }}
            />
            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#9CA3AF', cursor: 'pointer' }}>Chapter is Active</label>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={saving} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            background: saving ? 'rgba(30,64,175,0.4)' : 'rgba(30,64,175,0.8)',
            border: '1px solid rgba(59,130,246,0.4)', color: '#ffffff',
            fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Changes</>}
          </button>
          <button
            type="button" onClick={handleDelete} disabled={deleting}
            style={{
              padding: '12px 16px', borderRadius: '10px',
              background: confirmDelete ? 'rgba(204,0,0,0.2)' : 'rgba(255,255,255,0.04)',
              border: confirmDelete ? '1px solid rgba(204,0,0,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: confirmDelete ? '#FCA5A5' : '#6B7280',
              fontSize: '13px', cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600',
            }}
          >
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          {confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(false)} style={{ padding: '12px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
