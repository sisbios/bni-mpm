'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Edit2, Trash2, Phone, MessageCircle, Share2, Mail, Building2, Search, X, Tag } from 'lucide-react'

type Contact = {
  id: string
  contactName: string
  phone: string | null
  email: string | null
  business: string | null
  relationship: string | null
  category: string | null
  address: string | null
  notes: string | null
}

const RELATIONSHIP_OPTIONS = ['friend', 'family', 'neighbor', 'colleague', 'client', 'vendor', 'other']
const REL_COLORS: Record<string, string> = {
  friend: '#10B981', family: '#C9A84C', neighbor: '#F59E0B',
  colleague: '#3B82F6', client: '#8B5CF6', vendor: '#EC4899', other: '#6B7280',
}

const GLASS: React.CSSProperties = {
  background: 'rgba(13,19,36,0.55)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function PortalContactsClient({ userId }: { userId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  useEffect(() => {
    fetch(`/api/contacts?userId=${userId}`)
      .then((r) => r.json())
      .then(setContacts)
      .finally(() => setLoading(false))
  }, [userId])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from your contact sphere?`)) return
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id))
      toast.success('Contact removed')
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter((c) =>
      c.contactName.toLowerCase().includes(q) ||
      (c.business ?? '').toLowerCase().includes(q) ||
      (c.relationship ?? '').toLowerCase().includes(q) ||
      (c.category ?? '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  const pct = Math.min(Math.round((contacts.length / 40) * 100), 100)
  const goalColor = contacts.length >= 40 ? '#10B981' : contacts.length >= 20 ? '#C9A84C' : '#CC0000'

  return (
    <>
      <style>{`
        .contact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
        @media (max-width: 600px) { .contact-grid { grid-template-columns: 1fr; } }
        .contact-card { transition: transform 0.15s, box-shadow 0.15s; }
        .contact-card:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,0.4) !important; }
        .action-btn { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 12px; border-radius: 7px; border: none; cursor: pointer; font-size: 12px; font-weight: 600; transition: opacity 0.15s; }
        .action-btn:hover { opacity: 0.85; }
        .action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #C9A84C, #CC0000)', borderRadius: '2px' }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '26px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
                MY CONTACTS
              </h1>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{contacts.length} in your contact sphere</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingContact(null); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>

        {/* Goal progress */}
        <div style={{ ...GLASS, padding: '14px 16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>Contact Sphere Goal</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: goalColor }}>{contacts.length} <span style={{ color: '#6B7280', fontWeight: '400' }}>/ 40</span></span>
          </div>
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden', marginBottom: '5px' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: contacts.length >= 40 ? '#10B981' : `linear-gradient(90deg, #CC0000, #C9A84C)`, borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
            {contacts.length >= 40 ? '✓ Full contact sphere achieved!' : `Add ${40 - contacts.length} more to complete your sphere`}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            style={{ width: '100%', padding: '9px 34px 9px 34px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(13,19,36,0.6)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {search && (
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
          </div>
        )}

        {/* Contacts list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#8B95A3' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...GLASS, padding: '56px', textAlign: 'center', color: '#8B95A3' }}>
            <Users size={36} style={{ margin: '0 auto 12px', color: '#4B5563', display: 'block' }} />
            <p style={{ margin: 0 }}>{search ? 'No contacts match your search' : 'Start building your contact sphere'}</p>
          </div>
        ) : (
          <div className="contact-grid">
            {filtered.map((c) => {
              const relColor = REL_COLORS[c.relationship ?? 'other'] ?? '#6B7280'
              return (
                <div key={c.id} className="contact-card" style={{ ...GLASS, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Top row: avatar + info + edit/delete */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {/* Avatar initials */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0, background: `${relColor}18`, border: `1.5px solid ${relColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-bebas), sans-serif', fontSize: '17px', color: relColor }}>
                      {initials(c.contactName)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                        {c.contactName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {c.relationship && (
                          <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 7px', borderRadius: '20px', background: `${relColor}18`, color: relColor, border: `1px solid ${relColor}30`, textTransform: 'capitalize' }}>
                            {c.relationship}
                          </span>
                        )}
                        {c.category && (
                          <span style={{ fontSize: '10px', color: '#6B7280' }}>{c.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Edit + Delete */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => { setEditingContact(c); setShowModal(true) }}
                        title="Edit"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#6B7280', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280' }}
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.contactName)}
                        title="Delete"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#6B7280', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Contact details */}
                  {(c.business || c.phone || c.email) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {c.business && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF' }}>
                          <Building2 size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.business}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF' }}>
                          <Phone size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} style={{ color: '#9CA3AF', textDecoration: 'none' }}>{c.phone}</a>
                        </div>
                      )}
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF' }}>
                          <Mail size={11} style={{ color: '#4B5563', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                        </div>
                      )}
                      {c.notes && (
                        <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic', marginTop: '2px' }}>{c.notes}</div>
                      )}
                    </div>
                  )}

                  {/* Action buttons: Call / WhatsApp / Share */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <button
                      className="action-btn"
                      disabled={!c.phone}
                      onClick={() => c.phone && (window.location.href = `tel:${c.phone}`)}
                      style={{ background: c.phone ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.phone ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, color: c.phone ? '#10B981' : '#374151' }}
                    >
                      <Phone size={12} /> Call
                    </button>
                    <button
                      className="action-btn"
                      disabled={!c.phone}
                      onClick={() => {
                        if (!c.phone) return
                        const num = c.phone.replace(/\D/g, '')
                        const msg = encodeURIComponent(`Hi ${c.contactName}!`)
                        window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
                      }}
                      style={{ background: c.phone ? 'rgba(37,211,102,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.phone ? 'rgba(37,211,102,0.28)' : 'rgba(255,255,255,0.06)'}`, color: c.phone ? '#25D366' : '#374151' }}
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const text = `${c.contactName}${c.business ? '\n' + c.business : ''}${c.phone ? '\n' + c.phone : ''}`
                        if (navigator.share) navigator.share({ title: c.contactName, text }).catch(() => {})
                        else navigator.clipboard.writeText(text).then(() => toast.success('Copied!'))
                      }}
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6' }}
                    >
                      <Share2 size={12} /> Share
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ContactFormModal
          contact={editingContact}
          onClose={() => { setShowModal(false); setEditingContact(null) }}
          onSuccess={(saved) => {
            if (editingContact) {
              setContacts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
              toast.success('Contact updated')
            } else {
              setContacts((prev) => [...prev, saved])
              toast.success('Contact added')
            }
            setShowModal(false)
            setEditingContact(null)
          }}
        />
      )}
    </>
  )
}

function ContactFormModal({ contact, onClose, onSuccess }: { contact: Contact | null; onClose: () => void; onSuccess: (c: Contact) => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    contactName: contact?.contactName ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    business: contact?.business ?? '',
    relationship: contact?.relationship ?? '',
    category: contact?.category ?? '',
    address: contact?.address ?? '',
    notes: contact?.notes ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contactName.trim()) { toast.error('Name required'); return }
    setLoading(true)
    const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts'
    const res = await fetch(url, { method: contact ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setLoading(false)
    if (res.ok) onSuccess(await res.json())
    else toast.error('Failed to save contact')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(6,10,20,0.7)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '10px', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }} onClick={onClose}>
      <div style={{ background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.09)', padding: '22px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', letterSpacing: '2px', color: '#fff', margin: 0 }}>
            {contact ? 'EDIT CONTACT' : 'ADD CONTACT'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex' }}><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={lbl}>Name *</label>
            <input style={inp} value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} required placeholder="Full name" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={lbl}>Phone</label>
              <input style={inp} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91..." />
            </div>
            <div>
              <label style={lbl}>Relationship</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.relationship} onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value }))}>
                <option value="">Select...</option>
                {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Business / Company</label>
            <input style={inp} value={form.business} onChange={(e) => setForm((p) => ({ ...p, business: e.target.value }))} placeholder="Company name" />
          </div>

          <div>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={lbl}>Category</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option value="">Select...</option>
                {['prospect', 'personal', 'business', 'professional', 'neighbor'].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Area / Locality</label>
              <input style={inp} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Location" />
            </div>
          </div>

          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes..." rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
