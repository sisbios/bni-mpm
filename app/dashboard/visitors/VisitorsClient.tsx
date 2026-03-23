'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Phone, Search, X, Check, Edit2, Trash2, CheckCircle, Circle, BookUser, ChevronDown } from 'lucide-react'

type Referrer = { id: string; name: string; business: string | null; role: string }

type Visitor = {
  id: string
  name: string
  phone: string | null
  email: string | null
  business: string | null
  category: string | null
  referrerId: string
  referrer: Referrer
  visitDate: string
  week: string
  eoiSubmitted: boolean
  eoiDate: string | null
  fromContactId: string | null
  notes: string | null
}

type ContactResult = {
  id: string
  contactName: string
  phone: string | null
  email: string | null
  business: string | null
  category: string | null
  userId: string
}

type Props = {
  initialVisitors: Visitor[]
  members: { id: string; name: string; business: string | null; role: string }[]
  canEdit: boolean
}

const CARD_STYLE = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
} as const

const INPUT = {
  background: 'rgba(6,10,20,0.8)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  borderRadius: '7px',
  padding: '9px 12px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  colorScheme: 'dark',
} as const

type VisitorForm = {
  name: string
  phone: string
  email: string
  business: string
  category: string
  referrerId: string
  visitDate: string
  notes: string
  fromContactId: string
}

function emptyForm(members: Props['members']): VisitorForm {
  return {
    name: '', phone: '', email: '', business: '', category: '',
    referrerId: members[0]?.id ?? '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: '', fromContactId: '',
  }
}

// Modal for adding/editing a visitor
function VisitorModal({
  initial,
  members,
  onSave,
  onClose,
}: {
  initial: VisitorForm
  members: Props['members']
  onSave: (form: VisitorForm) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactResults, setContactResults] = useState<ContactResult[]>([])
  const [searchingContacts, setSearchingContacts] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)

  async function searchContacts(q: string) {
    if (!q.trim()) { setContactResults([]); return }
    setSearchingContacts(true)
    // Fetch all contacts and filter client-side
    const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}`)
    if (res.ok) {
      const data = await res.json()
      setContactResults(data)
    }
    setSearchingContacts(false)
  }

  function importContact(c: ContactResult) {
    setForm((f) => ({
      ...f,
      name: c.contactName,
      phone: c.phone ?? '',
      email: c.email ?? '',
      business: c.business ?? '',
      category: c.category ?? '',
      fromContactId: c.id,
    }))
    setShowContactPicker(false)
    setContactSearch('')
    setContactResults([])
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Visitor name is required')
    if (!form.referrerId) return toast.error('Referrer is required')
    if (!form.visitDate) return toast.error('Visit date is required')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}>
      <div style={{ ...CARD_STYLE, background: 'rgba(10,15,28,0.95)', width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
            {initial.name ? 'Edit Visitor' : 'Add Visitor'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Import from contact pool */}
        {!initial.name && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowContactPicker(!showContactPicker)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.06)', color: '#C9A84C', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
            >
              <BookUser size={14} />
              Import from Contact Pool
            </button>
            {showContactPicker && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(6,10,20,0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                  <input
                    autoFocus
                    placeholder="Search contacts by name, business..."
                    value={contactSearch}
                    onChange={(e) => { setContactSearch(e.target.value); searchContacts(e.target.value) }}
                    style={{ ...INPUT, paddingLeft: '28px' }}
                  />
                </div>
                {searchingContacts && <div style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', padding: '8px' }}>Searching...</div>}
                {contactResults.length === 0 && contactSearch && !searchingContacts && (
                  <div style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', padding: '8px' }}>No contacts found</div>
                )}
                {contactResults.map((c) => (
                  <button key={c.id} onClick={() => importContact(c)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', marginBottom: '2px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{c.contactName}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{c.business ?? ''}{c.phone ? ` · ${c.phone}` : ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Visitor Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 9999..." style={INPUT} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Business</label>
              <input value={form.business} onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))} placeholder="Business name" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Category</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Industry" style={INPUT} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" style={INPUT} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Referred by *</label>
              <div style={{ position: 'relative' }}>
                <select value={form.referrerId} onChange={(e) => setForm((f) => ({ ...f, referrerId: e.target.value }))}
                  style={{ ...INPUT, appearance: 'none', paddingRight: '28px' }}>
                  {members.map((m) => <option key={m.id} value={m.id} style={{ background: '#0d1324' }}>{m.name}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Visit Date *</label>
              <input type="date" value={form.visitDate} onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))} style={INPUT} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional notes..." style={{ ...INPUT, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '9px 20px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {saving ? 'Saving…' : <><Check size={14} /> Save Visitor</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VisitorsClient({ initialVisitors, members, canEdit }: Props) {
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors)
  const [search, setSearch] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null)
  const [togglingEoi, setTogglingEoi] = useState<string | null>(null)

  const filtered = visitors.filter((v) => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.name.toLowerCase().includes(q) || (v.business ?? '').toLowerCase().includes(q) || (v.phone ?? '').includes(q) || v.referrer.name.toLowerCase().includes(q)
    const matchMember = !filterMember || v.referrerId === filterMember
    return matchSearch && matchMember
  })

  const eoiCount = visitors.filter((v) => v.eoiSubmitted).length

  async function handleAdd(form: VisitorForm) {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, phone: form.phone || null, email: form.email || null,
        business: form.business || null, category: form.category || null,
        referrerId: form.referrerId,
        visitDate: form.visitDate,
        fromContactId: form.fromContactId || null,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setVisitors((prev) => [{ ...created, visitDate: created.visitDate, weekDate: created.weekDate }, ...prev])
      setShowModal(false)
      toast.success(`${form.name} added to visitors pool`)
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to add visitor')
    }
  }

  async function handleEdit(form: VisitorForm) {
    if (!editingVisitor) return
    const res = await fetch(`/api/visitors/${editingVisitor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, phone: form.phone || null, email: form.email || null,
        business: form.business || null, category: form.category || null,
        referrerId: form.referrerId,
        visitDate: form.visitDate,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setVisitors((prev) => prev.map((v) => v.id === updated.id ? updated : v))
      setEditingVisitor(null)
      toast.success('Visitor updated')
    } else {
      toast.error('Failed to update visitor')
    }
  }

  async function handleDelete(v: Visitor) {
    if (!confirm(`Remove ${v.name} from visitors pool?`)) return
    const res = await fetch(`/api/visitors/${v.id}`, { method: 'DELETE' })
    if (res.ok) {
      setVisitors((prev) => prev.filter((x) => x.id !== v.id))
      toast.success(`${v.name} removed`)
    } else toast.error('Failed to remove visitor')
  }

  async function toggleEoi(v: Visitor) {
    setTogglingEoi(v.id)
    const newVal = !v.eoiSubmitted
    const res = await fetch(`/api/visitors/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eoiSubmitted: newVal }),
    })
    if (res.ok) {
      const updated = await res.json()
      setVisitors((prev) => prev.map((x) => x.id === updated.id ? updated : x))
      toast.success(newVal ? 'EOI marked as submitted' : 'EOI cleared')
    } else toast.error('Failed to update EOI')
    setTogglingEoi(null)
  }

  function toFormValues(v: Visitor): VisitorForm {
    return {
      name: v.name,
      phone: v.phone ?? '',
      email: v.email ?? '',
      business: v.business ?? '',
      category: v.category ?? '',
      referrerId: v.referrerId,
      visitDate: v.visitDate.split('T')[0],
      notes: v.notes ?? '',
      fromContactId: v.fromContactId ?? '',
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px' }} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '28px', letterSpacing: '2px', color: '#fff', lineHeight: '1' }}>VISITORS POOL</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
              {visitors.length} visitors · {eoiCount} EOI submitted
            </p>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #CC0000, #990000)', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(204,0,0,0.3)' }}>
            <Plus size={14} /> Add Visitor
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Visitors', value: visitors.length, color: '#C9A84C' },
          { label: 'EOI Submitted', value: eoiCount, color: '#10B981' },
          { label: 'EOI Pending', value: visitors.length - eoiCount, color: '#F59E0B' },
          { label: 'From Contact Pool', value: visitors.filter((v) => v.fromContactId).length, color: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} style={{ ...CARD_STYLE, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', color: s.color, lineHeight: '1' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input
            placeholder="Search visitor, business, referrer..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...INPUT, paddingLeft: '30px' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
            style={{ ...INPUT, width: 'auto', minWidth: '180px', paddingRight: '28px', appearance: 'none' }}>
            <option value="">All Members</option>
            {members.map((m) => <option key={m.id} value={m.id} style={{ background: '#0d1324' }}>{m.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Table */}
      <div style={CARD_STYLE}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <Users size={36} style={{ margin: '0 auto 12px', color: '#374151' }} />
            <p style={{ fontSize: '14px' }}>{search || filterMember ? 'No visitors match your filters' : 'No visitors recorded yet'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Visitor', 'Contact', 'Referred By', 'Visit Week', 'EOI', ...(canEdit ? ['Actions'] : [])].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6B7280', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>

                    {/* Visitor */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                          background: v.fromContactId ? 'rgba(59,130,246,0.15)' : 'rgba(201,168,76,0.1)',
                          border: v.fromContactId ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(201,168,76,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', color: v.fromContactId ? '#3B82F6' : '#C9A84C',
                        }}>
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{v.name}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {v.business ?? ''}{v.category ? ` · ${v.category}` : ''}
                          </div>
                          {v.fromContactId && (
                            <div style={{ fontSize: '10px', color: '#3B82F6', marginTop: '1px' }}>from contact pool</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '12px 14px' }}>
                      {v.phone ? (
                        <a href={`tel:${v.phone}`} title={v.phone}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', textDecoration: 'none', fontSize: '12px', fontWeight: '500' }}>
                          <Phone size={11} /> {v.phone}
                        </a>
                      ) : (
                        <span style={{ color: '#4B5563' }}>—</span>
                      )}
                      {v.email && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>{v.email}</div>}
                    </td>

                    {/* Referred By */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>{v.referrer.name}</div>
                      {v.referrer.business && <div style={{ fontSize: '11px', color: '#6B7280' }}>{v.referrer.business}</div>}
                    </td>

                    {/* Visit Week */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                        {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4B5563' }}>{v.week}</div>
                    </td>

                    {/* EOI */}
                    <td style={{ padding: '12px 14px' }}>
                      {canEdit ? (
                        <button
                          onClick={() => toggleEoi(v)}
                          disabled={togglingEoi === v.id}
                          title={v.eoiSubmitted ? `Submitted${v.eoiDate ? ' · ' + new Date(v.eoiDate).toLocaleDateString('en-IN') : ''}` : 'Click to mark EOI submitted'}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.12s', background: v.eoiSubmitted ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: v.eoiSubmitted ? '#10B981' : '#6B7280' }}>
                          {v.eoiSubmitted ? <CheckCircle size={13} /> : <Circle size={13} />}
                          {v.eoiSubmitted ? 'Submitted' : 'Pending'}
                        </button>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: v.eoiSubmitted ? '#10B981' : '#6B7280' }}>
                          {v.eoiSubmitted ? <CheckCircle size={13} /> : <Circle size={13} />}
                          {v.eoiSubmitted ? 'Submitted' : 'Pending'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {canEdit && (
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setEditingVisitor(v)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(v)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showModal && (
        <VisitorModal
          initial={emptyForm(members)}
          members={members}
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Edit modal */}
      {editingVisitor && (
        <VisitorModal
          initial={toFormValues(editingVisitor)}
          members={members}
          onSave={handleEdit}
          onClose={() => setEditingVisitor(null)}
        />
      )}
    </div>
  )
}
