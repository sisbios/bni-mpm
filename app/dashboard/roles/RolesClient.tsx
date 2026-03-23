'use client'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Plus, Edit2, Trash2, X, Shield, Users, UserPlus,
  Search, Lock, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = {
  id: string; slug: string; label: string; color: string
  accessLevel: string; group: string; sortOrder: number
  isSystem: boolean; memberCount: number
}
type MemberSummary = {
  id: string; name: string; business: string | null
  avatar: string | null; role: string
}

// ── Hierarchy config ──────────────────────────────────────────────────────────
const HIERARCHY: { key: string; label: string; abbr: string; color: string }[] = [
  { key: 'superadmin', label: 'Super Admin',          abbr: 'SA', color: '#CC0000' },
  { key: 'headtable',  label: 'Head Table',           abbr: 'HT', color: '#C9A84C' },
  { key: 'committee',  label: 'Membership Committee', abbr: 'MC', color: '#3B82F6' },
  { key: 'member',     label: 'Member',               abbr: 'M',  color: '#6B7280' },
]

const ACCESS_OPTIONS = [
  { value: 'officer', label: 'Officer / Head Table',        color: '#C9A84C' },
  { value: 'mc',      label: 'Membership Committee (MC)',   color: '#3B82F6' },
  { value: 'member',  label: 'Member',                      color: '#6B7280' },
]
const ACCESS_TO_GROUP: Record<string, string> = {
  officer: 'headtable', mc: 'committee', member: 'member', superadmin: 'superadmin',
}
const PRESET_COLORS = ['#CC0000','#C9A84C','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899','#06B6D4','#F97316','#9CA3AF']

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function MemberAvatar({ m, color, size = 28 }: { m: MemberSummary; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}70)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden' }}>
      {m.avatar
        ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : getInitials(m.name)}
    </div>
  )
}

// ── Role Card ─────────────────────────────────────────────────────────────────
function RoleCard({
  role, assignedMembers, canManage,
  onAssign, onEdit, onDelete, onRemove,
}: {
  role: Role
  assignedMembers: MemberSummary[]
  canManage: boolean
  onAssign: () => void
  onEdit: () => void
  onDelete: () => void
  onRemove: (memberId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const SHOW_LIMIT = 4
  const visible = expanded ? assignedMembers : assignedMembers.slice(0, SHOW_LIMIT)
  const overflow = assignedMembers.length - SHOW_LIMIT

  return (
    <div style={{
      background: 'rgba(13,19,36,0.65)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '12px',
      border: `1px solid ${role.color}22`,
      borderLeft: `4px solid ${role.color}`,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${role.color}18`}
      onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}
    >
      {/* ── Header row ── */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        {/* Left: dot + name + slug */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color, flexShrink: 0, boxShadow: `0 0 5px ${role.color}80` }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', lineHeight: '1.2' }}>{role.label}</span>
            {role.isSystem && <Lock size={10} style={{ color: '#374151', flexShrink: 0 }} />}
          </div>
          <div style={{ fontSize: '10px', color: '#374151', marginTop: '2px', fontFamily: 'monospace', paddingLeft: '14px' }}>
            {role.slug}
          </div>
        </div>

        {/* Right: count + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Member count */}
          <span style={{
            fontSize: '11px', fontWeight: 700,
            color: assignedMembers.length > 0 ? role.color : '#374151',
            background: assignedMembers.length > 0 ? `${role.color}18` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${assignedMembers.length > 0 ? role.color + '30' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '10px', padding: '2px 7px',
          }}>
            {assignedMembers.length}
          </span>

          {canManage && (
            <>
              {/* Assign */}
              <button
                onClick={onAssign}
                title="Assign member"
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '4px 8px', borderRadius: '6px', border: `1px solid ${role.color}50`,
                  background: `${role.color}12`, color: role.color,
                  cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'inherit',
                  transition: 'all 0.12s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${role.color}28`; e.currentTarget.style.borderColor = role.color }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${role.color}12`; e.currentTarget.style.borderColor = `${role.color}50` }}
              >
                <UserPlus size={11} /> Assign
              </button>

              {/* Edit */}
              {!role.isSystem && (
                <button onClick={onEdit} title="Edit"
                  style={{ width: '26px', height: '26px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', background: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280' }}
                >
                  <Edit2 size={11} />
                </button>
              )}
              {/* Delete */}
              {!role.isSystem && (
                <button onClick={onDelete} title="Delete"
                  style={{ width: '26px', height: '26px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.07)', background: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280' }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: `${role.color}15`, margin: '0 14px' }} />

      {/* ── Assigned members section ── */}
      <div style={{ padding: '8px 14px 12px' }}>
        {assignedMembers.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
            <Users size={13} style={{ color: '#2D3748', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#374151', fontStyle: 'italic' }}>No members assigned</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {visible.map((m) => (
                <div
                  key={m.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  <MemberAvatar m={m} color={role.color} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    {m.business && (
                      <div style={{ fontSize: '10px', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.business}</div>
                    )}
                  </div>
                  {canManage && (
                    <button
                      onClick={() => onRemove(m.id)}
                      title="Remove from role"
                      style={{ width: '20px', height: '20px', borderRadius: '4px', border: 'none', background: 'none', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'color 0.12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#CC0000')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Show more / less toggle */}
            {assignedMembers.length > SHOW_LIMIT && (
              <button
                onClick={() => setExpanded((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', background: 'none', border: 'none', color: role.color, cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit', padding: '2px 0' }}
              >
                {expanded
                  ? <><ChevronUp size={11} /> Show less</>
                  : <><ChevronDown size={11} /> +{overflow} more</>
                }
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({
  role, members, onAssign, onClose,
}: {
  role: Role
  members: MemberSummary[]
  onAssign: (memberId: string) => Promise<void>
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [assigned, setAssigned] = useState<string[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter(
      (m) => !assigned.includes(m.id) &&
        (m.name.toLowerCase().includes(q) || (m.business ?? '').toLowerCase().includes(q))
    )
  }, [members, search, assigned])

  async function handleAssign(id: string) {
    setAssigning(id)
    await onAssign(id)
    setAssigning(null)
    setAssigned((p) => [...p, id])
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(10,15,30,0.99)', borderRadius: '18px', border: `1px solid ${role.color}30`, boxShadow: `0 32px 80px rgba(0,0,0,0.7)`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: `linear-gradient(135deg, ${role.color}10, transparent)`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: role.color, boxShadow: `0 0 7px ${role.color}90` }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Assign to {role.label}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>
                  {members.length - assigned.length} available · {assigned.length} assigned this session
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} />
            </button>
          </div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={13} style={{ color: '#6B7280', flexShrink: 0 }} />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…"
              style={{ background: 'none', border: 'none', outline: 'none', color: '#ffffff', fontSize: '13px', flex: 1, fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#374151' }}>
              <Users size={26} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
              <div style={{ fontSize: '12px' }}>{search ? 'No matches' : 'No unassigned members available'}</div>
            </div>
          ) : (
            filtered.map((m, i) => (
              <button
                key={m.id}
                onClick={() => handleAssign(m.id)}
                disabled={!!assigning}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', background: 'none', border: 'none', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: assigning ? 'wait' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${role.color}0d`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <MemberAvatar m={m} color={role.color} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>{m.name}</div>
                  {m.business && <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.business}</div>}
                </div>
                {assigning === m.id
                  ? <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${role.color}`, borderTopColor: 'transparent', flexShrink: 0, animation: 'spin 0.5s linear infinite' }} />
                  : <UserPlus size={13} style={{ color: role.color, opacity: 0.5, flexShrink: 0 }} />
                }
              </button>
            ))
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Role Form Modal ───────────────────────────────────────────────────────────
function RoleFormModal({ role, onClose, onSave }: { role: Role | null; onClose: () => void; onSave: (r: Role) => void }) {
  const [form, setForm] = useState({
    slug: role?.slug ?? '',
    label: role?.label ?? '',
    color: role?.color ?? '#9CA3AF',
    accessLevel: (['officer','mc','member'].includes(role?.accessLevel ?? '')) ? (role!.accessLevel) : 'member',
  })
  const [saving, setSaving] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '10px', fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) return toast.error('Label required')
    if (!role && !form.slug.trim()) return toast.error('Slug required')
    setSaving(true)
    const url = role ? `/api/roles/${role.id}` : '/api/roles'
    const method = role ? 'PATCH' : 'POST'
    const body = role
      ? { label: form.label, color: form.color, accessLevel: form.accessLevel, group: ACCESS_TO_GROUP[form.accessLevel] ?? 'member' }
      : { slug: form.slug, label: form.label, color: form.color, accessLevel: form.accessLevel, group: ACCESS_TO_GROUP[form.accessLevel] ?? 'member', sortOrder: 95 }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) onSave(await res.json())
    else { const err = await res.json(); toast.error(err.error ?? 'Failed') }
  }

  const selectedAccess = ACCESS_OPTIONS.find(o => o.value === form.accessLevel)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '420px', background: 'rgba(10,15,30,0.99)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(201,168,76,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{role ? 'Edit Role' : 'New Custom Role'}</span>
          </div>
          <button type="button" onClick={onClose} style={{ width: '26px', height: '26px', borderRadius: '5px', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Role Label</label>
            <input style={inputStyle} value={form.label} onChange={(e) => { const label = e.target.value; setForm((f) => ({ ...f, label, ...(role ? {} : { slug: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }) })) }} placeholder="e.g. Social Media Coordinator" required />
          </div>
          {!role && (
            <div>
              <label style={labelStyle}>Slug</label>
              <input style={{ ...inputStyle, fontFamily: 'monospace', color: '#C9A84C' }} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} required />
            </div>
          )}
          <div>
            <label style={labelStyle}>Access Level</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.accessLevel} onChange={(e) => setForm((f) => ({ ...f, accessLevel: e.target.value }))}>
              {ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#374151' }}>
              {form.accessLevel === 'officer' && 'Full dashboard + management access (Head Table only)'}
              {form.accessLevel === 'mc' && 'Dashboard access, no management privileges'}
              {form.accessLevel === 'member' && 'Portal access only'}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: form.color === c ? '3px solid #fff' : '3px solid transparent', outlineOffset: '2px' }} />
              ))}
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border: '2px solid rgba(255,255,255,0.2)' }} />
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              </label>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: form.color, border: '2px solid rgba(255,255,255,0.3)' }} />
            </div>
          </div>
          {/* Preview */}
          <div style={{ padding: '9px 12px', borderRadius: '7px', background: `${form.color}0e`, border: `1px solid ${form.color}25`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.color }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', flex: 1 }}>{form.label || 'Role Label'}</span>
            {selectedAccess && (
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', color: selectedAccess.color, background: `${selectedAccess.color}18`, border: `1px solid ${selectedAccess.color}30` }}>
                {selectedAccess.label.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : role ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RolesClient({
  initialRoles, allMembers, canManage,
}: {
  initialRoles: Role[]
  allMembers: MemberSummary[]
  canManage: boolean
}) {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [members, setMembers] = useState<MemberSummary[]>(allMembers)
  const [assigningRole, setAssigningRole] = useState<Role | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deallocRole, setDeallocRole] = useState<{ role: Role; blockers: MemberSummary[]; reassignTo: string } | null>(null)
  const [deallocSaving, setDeallocSaving] = useState(false)

  // Members available to assign (only those with role='member', i.e. no specific role yet)
  const availableMembers = useMemo(
    () => (assigningRole ? members.filter((m) => m.role === 'member') : []),
    [members, assigningRole]
  )

  // Map role slug → assigned members
  const membersByRole = useMemo(() => {
    const map: Record<string, MemberSummary[]> = {}
    for (const m of members) {
      if (!map[m.role]) map[m.role] = []
      map[m.role].push(m)
    }
    return map
  }, [members])

  // ── Assign ─────────────────────────────────────────────────────────────────
  async function handleAssign(memberId: string) {
    if (!assigningRole) return
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: assigningRole.slug }),
    })
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: assigningRole.slug } : m))
      toast.success(`Assigned to ${assigningRole.label}`)
    } else {
      toast.error('Failed to assign')
      throw new Error()
    }
  }

  // ── Remove from role ───────────────────────────────────────────────────────
  async function handleRemove(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    if (!confirm(`Remove ${member?.name ?? 'this member'} from their role?`)) return
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'member' }),
    })
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: 'member' } : m))
      toast.success('Removed from role')
    } else toast.error('Failed')
  }

  // ── Delete role ────────────────────────────────────────────────────────────
  async function handleDelete(role: Role) {
    if (role.isSystem) return toast.error('Cannot delete system roles')
    if (!confirm(`Delete role "${role.label}"?`)) return
    const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRoles((prev) => prev.filter((r) => r.id !== role.id))
      toast.success('Deleted')
    } else {
      const data = await res.json()
      if (res.status === 409 && data.members) {
        setDeallocRole({ role, blockers: data.members, reassignTo: '' })
      } else toast.error(data.error ?? 'Cannot delete')
    }
  }

  async function deallocAndDelete() {
    if (!deallocRole?.reassignTo) return toast.error('Select a role to reassign to')
    setDeallocSaving(true)
    await Promise.all(deallocRole.blockers.map((m) =>
      fetch(`/api/members/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: deallocRole.reassignTo }) })
    ))
    const delRes = await fetch(`/api/roles/${deallocRole.role.id}`, { method: 'DELETE' })
    setDeallocSaving(false)
    if (delRes.ok) {
      const newSlug = deallocRole.reassignTo
      setMembers((prev) => prev.map((m) => deallocRole.blockers.find((b) => b.id === m.id) ? { ...m, role: newSlug } : m))
      setRoles((prev) => prev.filter((r) => r.id !== deallocRole.role.id))
      setDeallocRole(null)
      toast.success('Reassigned and deleted')
    }
  }

  // ── Group ──────────────────────────────────────────────────────────────────
  const grouped = useMemo(
    () => HIERARCHY.map((h) => ({
      ...h,
      roles: roles.filter((r) => (r.group || 'member') === h.key)
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.label.localeCompare(b.label)),
    })).filter((g) => g.roles.length > 0),
    [roles]
  )

  const totalAssigned = members.filter((m) => m.role !== 'member').length

  const inputSm: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto', fontFamily: 'var(--font-montserrat), sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '40px', background: 'linear-gradient(180deg, #CC0000, #C9A84C)', borderRadius: '2px' }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '30px', letterSpacing: '2px', color: '#ffffff', lineHeight: '1', margin: 0 }}>CHAPTER ROLES</h1>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
                {roles.length} roles · {totalAssigned} members assigned
              </p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => { setEditingRole(null); setShowForm(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={14} /> Add Custom Role
            </button>
          )}
        </div>

        {/* Hierarchy sections */}
        {grouped.map(({ key, label, abbr, color, roles: grpRoles }) => {
          const grpTotal = grpRoles.reduce((s, r) => s + (membersByRole[r.slug]?.length ?? 0), 0)
          return (
            <div key={key} style={{ marginBottom: '32px' }}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '3px', height: '18px', background: color, borderRadius: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>{label}</span>
                {abbr !== 'SA' && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`, padding: '2px 7px', borderRadius: '10px', flexShrink: 0 }}>{abbr}</span>
                )}
                <div style={{ flex: 1, height: '1px', background: `${color}18` }} />
                <span style={{ fontSize: '11px', color: '#4B5563', flexShrink: 0 }}>{grpTotal} assigned</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {grpRoles.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    assignedMembers={membersByRole[role.slug] ?? []}
                    canManage={canManage}
                    onAssign={() => setAssigningRole(role)}
                    onEdit={() => { setEditingRole(role); setShowForm(true) }}
                    onDelete={() => handleDelete(role)}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ASSIGN MODAL */}
      {assigningRole && (
        <AssignModal
          role={assigningRole}
          members={availableMembers}
          onAssign={handleAssign}
          onClose={() => setAssigningRole(null)}
        />
      )}

      {/* FORM MODAL */}
      {showForm && (
        <RoleFormModal
          role={editingRole}
          onClose={() => { setShowForm(false); setEditingRole(null) }}
          onSave={(saved) => {
            if (editingRole) setRoles((prev) => prev.map((r) => r.id === saved.id ? { ...r, ...saved } : r))
            else setRoles((prev) => [...prev, { ...saved, group: (saved as any).group ?? 'member', sortOrder: (saved as any).sortOrder ?? 95, memberCount: 0 }])
            toast.success(editingRole ? 'Role updated' : 'Role created')
            setShowForm(false); setEditingRole(null)
          }}
        />
      )}

      {/* DEALLOC MODAL */}
      {deallocRole && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(10,15,30,0.99)', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '9px', background: 'rgba(245,158,11,0.06)' }}>
              <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Role Has Members</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Reassign before deleting "{deallocRole.role.label}"</div>
              </div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {deallocRole.blockers.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${deallocRole.role.color}, ${deallocRole.role.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#000', flexShrink: 0 }}>
                      {getInitials(m.name)}
                    </div>
                    <span style={{ fontSize: '12px', color: '#e5e7eb' }}>{m.name}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Reassign all to</div>
                <select style={{ ...inputSm, cursor: 'pointer' }} value={deallocRole.reassignTo} onChange={(e) => setDeallocRole((s) => s ? { ...s, reassignTo: e.target.value } : null)}>
                  <option value="">— Select role —</option>
                  {roles.filter((r) => r.id !== deallocRole.role.id).map((r) => <option key={r.id} value={r.slug}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeallocRole(null)} style={{ padding: '8px 14px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={deallocAndDelete} disabled={deallocSaving || !deallocRole.reassignTo}
                style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', background: deallocRole.reassignTo ? 'linear-gradient(135deg, #CC0000, #880000)' : 'rgba(255,255,255,0.06)', color: deallocRole.reassignTo ? '#fff' : '#4B5563', fontWeight: 700, cursor: (deallocSaving || !deallocRole.reassignTo) ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Trash2 size={11} /> {deallocSaving ? 'Processing…' : 'Reassign & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
