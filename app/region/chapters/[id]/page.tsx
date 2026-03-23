'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Trash2, Save, Users, X, ChevronDown } from 'lucide-react'
import { ROLE_GROUPS, HT_SLUGS, ROLE_BY_SLUG } from '@/lib/roles'

const MEETING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type Chapter = {
  id: string; name: string; slug: string; city: string | null; meetingDay: string | null;
  meetingTime: string | null; meetingLocation: string | null; meetingFee: number | null;
  visitorFee: number | null; logoUrl: string | null; isActive: boolean; regionId: string;
}
type Member = { id: string; name: string; role: string; business: string | null; phone: string | null }

export default function ChapterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [form, setForm] = useState({
    name: '', slug: '', city: '', meetingDay: '', meetingTime: '',
    meetingLocation: '', meetingFee: '', visitorFee: '', logoUrl: '', isActive: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Role management
  const [members, setMembers] = useState<Member[]>([])
  const [assignments, setAssignments] = useState<Record<string, Member[]>>({})
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleSaving, setRoleSaving] = useState('')
  const [roleToast, setRoleToast] = useState('')

  useEffect(() => {
    fetch(`/api/region/chapters/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setChapter(data)
        setForm({
          name: data.name ?? '', slug: data.slug ?? '', city: data.city ?? '',
          meetingDay: data.meetingDay ?? '', meetingTime: data.meetingTime ?? '',
          meetingLocation: data.meetingLocation ?? '', meetingFee: data.meetingFee ?? '',
          visitorFee: data.visitorFee ?? '', logoUrl: data.logoUrl ?? '',
          isActive: data.isActive ?? true,
        })
        setLoading(false)
      })
      .catch(() => { setError('Failed to load chapter'); setLoading(false) })

    loadRoles()
  }, [id])

  function loadRoles() {
    setRoleLoading(true)
    fetch(`/api/region/roles?chapterId=${id}`)
      .then(r => r.json())
      .then(data => { setMembers(data.members ?? []); setAssignments(data.assignments ?? {}); setRoleLoading(false) })
      .catch(() => setRoleLoading(false))
  }

  function showRoleToast(msg: string) { setRoleToast(msg); setTimeout(() => setRoleToast(''), 3000) }

  async function assignRole(userId: string, roleSlug: string) {
    setRoleSaving(roleSlug + userId)
    const res = await fetch('/api/region/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roleSlug, chapterId: id }),
    })
    if (res.ok) { loadRoles(); showRoleToast('Role assigned') }
    setRoleSaving('')
  }

  async function removeRole(userId: string) {
    setRoleSaving('remove' + userId)
    const res = await fetch(`/api/region/roles?userId=${userId}&chapterId=${id}`, { method: 'DELETE' })
    if (res.ok) { loadRoles(); showRoleToast('Role removed') }
    setRoleSaving('')
  }

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
        body: JSON.stringify({
          ...form,
          meetingFee: form.meetingFee ? parseFloat(form.meetingFee as string) : null,
          visitorFee: form.visitorFee ? parseFloat(form.visitorFee as string) : null,
        }),
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

  const htGroup = ROLE_GROUPS.find(g => g.key === 'HT')!

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {roleToast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '12px 18px', color: '#6EE7B7', fontSize: '14px', fontWeight: '600' }}>
          {roleToast}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <Link href="/region/chapters" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', textDecoration: 'none', marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back to chapters
        </Link>
        <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '32px', letterSpacing: '3px', color: '#ffffff', margin: 0 }}>
          EDIT <span style={{ color: '#3B82F6' }}>CHAPTER</span>
        </h1>
        {chapter && <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>slug: <span style={{ color: '#4B5563' }}>{chapter.slug}</span></p>}
      </div>

      {/* Chapter Details */}
      <form onSubmit={handleSave} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px', fontWeight: '600' }}>Chapter Details</div>

        {error && <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#6EE7B7', fontSize: '14px' }}>Saved successfully.</div>}

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Chapter Name</label>
              <input name="name" value={form.name} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>URL Slug</label>
              <input name="slug" value={form.slug} onChange={handleChange} style={inputStyle} pattern="[a-z0-9\-]+" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Malappuram" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Logo URL</label>
              <input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Meeting Location</label>
            <input name="meetingLocation" value={form.meetingLocation} onChange={handleChange} placeholder="e.g. The Leela Hotel, Banquet Hall" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Meeting Day</label>
              <select name="meetingDay" value={form.meetingDay} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer', background: '#111827', colorScheme: 'dark' }}>
                <option value="">Select day</option>
                {MEETING_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Meeting Time</label>
              <input name="meetingTime" value={form.meetingTime} onChange={handleChange} type="time" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Meeting Fee (₹)</label>
              <input name="meetingFee" value={form.meetingFee} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Visitor Fee (₹)</label>
              <input name="visitorFee" value={form.visitorFee} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0.00" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3B82F6' }} />
            <label htmlFor="isActive" style={{ fontSize: '14px', color: '#9CA3AF', cursor: 'pointer' }}>Chapter is Active</label>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: saving ? 'rgba(30,64,175,0.4)' : 'rgba(30,64,175,0.8)', border: '1px solid rgba(59,130,246,0.4)', color: '#ffffff', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={15} /> Save Changes</>}
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '12px 16px', borderRadius: '10px', background: confirmDelete ? 'rgba(204,0,0,0.2)' : 'rgba(255,255,255,0.04)', border: confirmDelete ? '1px solid rgba(204,0,0,0.4)' : '1px solid rgba(255,255,255,0.1)', color: confirmDelete ? '#FCA5A5' : '#6B7280', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          {confirmDelete && <button type="button" onClick={() => setConfirmDelete(false)} style={{ padding: '12px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>}
        </div>
      </form>

      {/* HT Role Assignment */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CC0000' }} />
          <span style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', letterSpacing: '2px', color: '#CC0000' }}>HEAD TABLE ASSIGNMENTS</span>
        </div>

        {roleLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {htGroup.roles.map(role => {
              const assigned = assignments[role.slug] ?? []
              return (
                <div key={role.slug} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: '200px', flex: '0 0 200px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{role.label}</div>
                    <div style={{ fontSize: '11px', color: '#CC0000', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>HT</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {assigned.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.2)' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{m.name}</span>
                        {m.phone && <span style={{ fontSize: '11px', color: '#6B7280' }}>{m.phone}</span>}
                        <button onClick={() => removeRole(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px' }}>
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <MemberPicker members={members} assignedIds={assigned.map(m => m.id)} onPick={(uid) => assignRole(uid, role.slug)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function MemberPicker({ members, assignedIds, onPick }: { members: Member[]; assignedIds: string[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const available = members.filter(m => !assignedIds.includes(m.id))
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>
        <Users size={13} /> Assign <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, minWidth: '200px', maxHeight: '220px', overflowY: 'auto', background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
          {available.length === 0 ? (
            <div style={{ padding: '14px', fontSize: '13px', color: '#4B5563' }}>No members available</div>
          ) : available.map(m => (
            <button key={m.id} onClick={() => { onPick(m.id); setOpen(false) }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left', cursor: 'pointer', color: '#ffffff', fontSize: '13px', fontWeight: '500' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(204,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {m.name}{m.business ? ` — ${m.business}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
