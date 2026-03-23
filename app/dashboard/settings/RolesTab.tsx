'use client'
import { useState, useMemo } from 'react'
import {
  Shield, Plus, Edit2, Trash2, X, AlertTriangle, Users,
  ChevronDown, ChevronUp, Search, UserPlus, Check, Lock,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────
export type FullRole = {
  id: string; slug: string; label: string; color: string
  accessLevel: string; group: string; sortOrder: number
  isSystem: boolean; memberCount: number
}

export type MemberSummary = {
  id: string; name: string; business: string | null
  avatar: string | null; role: string
}

type Props = { roles: FullRole[]; members: MemberSummary[] }

// ── Group config ──────────────────────────────────────────────────────────────
const GROUPS: Record<string, { label: string; abbr: string; color: string }> = {
  superadmin: { label: 'Super Admin',           abbr: 'SA', color: '#CC0000' },
  headtable:  { label: 'Head Table',            abbr: 'HT', color: '#C9A84C' },
  committee:  { label: 'Membership Committee',  abbr: 'MC', color: '#3B82F6' },
  member:     { label: 'Member',                abbr: 'M',  color: '#6B7280' },
}

const ACCESS_LEVELS = [
  { value: 'officer', label: 'Officer / Head Table',         color: '#C9A84C' },
  { value: 'mc',      label: 'Membership Committee (MC)',    color: '#3B82F6' },
  { value: 'member',  label: 'Member',                       color: '#6B7280' },
]

const PRESET_COLORS = [
  '#CC0000','#C9A84C','#3B82F6','#10B981','#8B5CF6',
  '#F59E0B','#EC4899','#06B6D4','#F97316','#9CA3AF',
]

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function AccessBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    superadmin: { label: 'Super Admin', color: '#CC0000', bg: 'rgba(204,0,0,0.12)' },
    officer:    { label: 'Officer · HT', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
    mc:         { label: 'MC',           color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    member:     { label: 'Member',       color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  }
  const s = map[level] ?? map.member
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
      padding: '2px 7px', borderRadius: '10px',
      color: s.color, background: s.bg, border: `1px solid ${s.color}30`,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RolesTab({ roles: initialRoles, members: initialMembers }: Props) {
  const [roles, setRoles] = useState<FullRole[]>(initialRoles)
  const [members, setMembers] = useState<MemberSummary[]>(initialMembers)

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // Collapsed groups (mobile)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // Add/Edit role form
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<FullRole | null>(null)
  const [roleForm, setRoleForm] = useState({
    slug: '', label: '', color: '#9CA3AF', accessLevel: 'member', group: 'member',
  })
  const [roleSaving, setRoleSaving] = useState(false)

  // Dealloc modal
  const [deallocState, setDeallocState] = useState<{
    role: FullRole
    blockers: { id: string; name: string; business: string | null }[]
    reassignTo: string
  } | null>(null)
  const [deallocSaving, setDeallocSaving] = useState(false)

  // Member assignment
  const [assignSearch, setAssignSearch] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null) // memberId being assigned

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedRole = roles.find((r) => r.id === selectedId) ?? null

  const roleMembers = useMemo(
    () => (selectedRole ? members.filter((m) => m.role === selectedRole.slug) : []),
    [members, selectedRole]
  )

  const unassignedFiltered = useMemo(() => {
    if (!selectedRole) return []
    const q = assignSearch.toLowerCase()
    return members.filter(
      (m) =>
        m.role !== selectedRole.slug &&
        (m.name.toLowerCase().includes(q) || (m.business ?? '').toLowerCase().includes(q))
    )
  }, [members, selectedRole, assignSearch])

  const groupedRoles = useMemo(
    () =>
      Object.entries(GROUPS).map(([key, g]) => ({
        key, ...g,
        roles: roles.filter((r) => (r.group || 'member') === key)
          .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.label.localeCompare(b.label)),
        totalMembers: roles
          .filter((r) => (r.group || 'member') === key)
          .reduce((s, r) => s + members.filter((m) => m.role === r.slug).length, 0),
      })),
    [roles, members]
  )

  // ── Helpers ───────────────────────────────────────────────────────────────
  function selectRole(id: string) {
    setSelectedId(id)
    setShowAssign(false)
    setAssignSearch('')
    setMobileDetailOpen(true)
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ── Role CRUD ─────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingRole(null)
    setRoleForm({ slug: '', label: '', color: '#9CA3AF', accessLevel: 'member', group: 'member' })
    setShowForm(true)
  }

  function openEdit(role: FullRole) {
    setEditingRole(role)
    setRoleForm({ slug: role.slug, label: role.label, color: role.color, accessLevel: role.accessLevel, group: role.group || 'member' })
    setShowForm(true)
  }

  async function saveRole() {
    if (!roleForm.label.trim()) return toast.error('Label required')
    if (!editingRole && !roleForm.slug.trim()) return toast.error('Slug required')
    setRoleSaving(true)

    if (editingRole) {
      const res = await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: roleForm.label, color: roleForm.color, accessLevel: roleForm.accessLevel, group: roleForm.group }),
      })
      setRoleSaving(false)
      if (res.ok) {
        const updated = await res.json()
        setRoles((prev) => prev.map((r) => r.id === editingRole.id ? { ...r, ...updated } : r))
        setShowForm(false)
        toast.success('Role updated')
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed')
      }
    } else {
      const slug = roleForm.slug.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, label: roleForm.label, color: roleForm.color, accessLevel: roleForm.accessLevel, group: roleForm.group, sortOrder: 95 }),
      })
      setRoleSaving(false)
      if (res.ok) {
        const created = await res.json()
        setRoles((prev) => [...prev, { ...created, memberCount: 0 }])
        setShowForm(false)
        toast.success('Role created')
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed')
      }
    }
  }

  async function deleteRole(role: FullRole) {
    const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRoles((prev) => prev.filter((r) => r.id !== role.id))
      if (selectedId === role.id) { setSelectedId(null); setMobileDetailOpen(false) }
      toast.success('Role deleted')
    } else {
      const data = await res.json()
      if (res.status === 409 && data.members) {
        setDeallocState({ role, blockers: data.members, reassignTo: '' })
      } else {
        toast.error(data.error ?? 'Cannot delete')
      }
    }
  }

  async function deallocAndDelete() {
    if (!deallocState || !deallocState.reassignTo) return toast.error('Select a role to reassign to')
    setDeallocSaving(true)
    const results = await Promise.all(
      deallocState.blockers.map((m) =>
        fetch(`/api/members/${m.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: deallocState.reassignTo }),
        })
      )
    )
    if (results.some((r) => !r.ok)) { setDeallocSaving(false); return toast.error('Some reassignments failed') }

    const delRes = await fetch(`/api/roles/${deallocState.role.id}`, { method: 'DELETE' })
    setDeallocSaving(false)
    if (delRes.ok) {
      const newSlug = deallocState.reassignTo
      setMembers((prev) => prev.map((m) =>
        deallocState.blockers.find((b) => b.id === m.id) ? { ...m, role: newSlug } : m
      ))
      setRoles((prev) => prev.filter((r) => r.id !== deallocState.role.id))
      setDeallocState(null)
      if (selectedId === deallocState.role.id) { setSelectedId(null); setMobileDetailOpen(false) }
      toast.success('Reassigned and deleted')
    } else toast.error('Delete failed after reassignment')
  }

  // ── Member assign / remove ────────────────────────────────────────────────
  async function assignMember(memberId: string) {
    if (!selectedRole || assigning) return
    setAssigning(memberId)
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selectedRole.slug }),
    })
    setAssigning(null)
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: selectedRole.slug } : m))
      setAssignSearch('')
      setShowAssign(false)
      toast.success('Member assigned')
    } else toast.error('Failed to assign')
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member from the role? They will be set back to "Member".')) return
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'member' }),
    })
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: 'member' } : m))
      toast.success('Removed from role')
    } else toast.error('Failed to remove')
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputSm: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#ffffff', fontSize: '13px', fontFamily: 'var(--font-montserrat), sans-serif',
    outline: 'none', colorScheme: 'dark',
  }
  const labelSm: React.CSSProperties = {
    display: 'block', fontSize: '10px', fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px',
  }

  // ── Role Detail Panel (shared between side panel + mobile modal) ──────────
  function RoleDetail({ onClose }: { onClose?: () => void }) {
    if (!selectedRole) return null
    const grp = GROUPS[selectedRole.group] ?? GROUPS.member
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Detail header */}
        <div style={{
          padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: `linear-gradient(135deg, ${selectedRole.color}15, transparent)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: selectedRole.color, flexShrink: 0, boxShadow: `0 0 8px ${selectedRole.color}80` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', lineHeight: '1.2' }}>{selectedRole.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: grp.color, background: `${grp.color}18`, border: `1px solid ${grp.color}30`, padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>
                    {grp.abbr} · {grp.label}
                  </span>
                  <AccessBadge level={selectedRole.accessLevel} />
                  {selectedRole.isSystem && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#4B5563' }}>
                      <Lock size={9} /> system
                    </span>
                  )}
                </div>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Members section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {roleMembers.length} Member{roleMembers.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setShowAssign((v) => !v); setAssignSearch('') }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${selectedRole.color}40`, background: `${selectedRole.color}10`, color: selectedRole.color, cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'inherit' }}
            >
              <UserPlus size={11} /> Assign Member
            </button>
          </div>

          {/* Assign search panel */}
          {showAssign && (
            <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Search size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
                <input
                  autoFocus
                  style={{ ...inputSm, padding: '4px 0', border: 'none', background: 'transparent', fontSize: '12px' }}
                  placeholder="Search by name or business..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {unassignedFiltered.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#4B5563' }}>
                    {assignSearch ? 'No members match' : 'All members already assigned'}
                  </div>
                ) : (
                  unassignedFiltered.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => assignMember(m.id)}
                      disabled={assigning === m.id}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left', fontFamily: 'inherit', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#000', flexShrink: 0 }}>
                        {getInitials(m.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb', lineHeight: '1.2' }}>{m.name}</div>
                        {m.business && <div style={{ fontSize: '10px', color: '#6B7280' }}>{m.business}</div>}
                      </div>
                      {assigning === m.id ? (
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${selectedRole.color}`, borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                      ) : (
                        <Check size={12} style={{ color: selectedRole.color, opacity: 0.6 }} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Current members */}
          {roleMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#374151', fontSize: '12px' }}>
              <Users size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
              No members assigned yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {roleMembers.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}70)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000', flexShrink: 0, overflow: 'hidden' }}>
                    {m.avatar
                      ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(m.name)
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', lineHeight: '1.2' }}>{m.name}</div>
                    {m.business && <div style={{ fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.business}</div>}
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    title="Remove from role"
                    style={{ width: '26px', height: '26px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CC0000'; e.currentTarget.style.color = '#CC0000' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6B7280' }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions (non-system only) */}
        {!selectedRole.isSystem && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => openEdit(selectedRole)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '7px', border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)', color: '#C9A84C', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}
            >
              <Edit2 size={12} /> Edit Role
            </button>
            <button
              onClick={() => deleteRole(selectedRole)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '7px', border: '1px solid rgba(204,0,0,0.3)', background: 'rgba(204,0,0,0.06)', color: '#CC0000', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Role list ─────────────────────────────────────────────────────────────
  function RoleList() {
    return (
      <div>
        {groupedRoles.map(({ key, label, color, abbr, roles: grpRoles, totalMembers }) => {
          if (grpRoles.length === 0) return null
          const collapsed = collapsedGroups[key]
          return (
            <div key={key} style={{ marginBottom: '4px' }}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '6px', transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.8px', flex: 1 }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', color: '#4B5563', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1px 6px' }}>
                  {totalMembers}
                </span>
                {collapsed ? <ChevronDown size={12} style={{ color: '#4B5563' }} /> : <ChevronUp size={12} style={{ color: '#4B5563' }} />}
              </button>

              {/* Roles in group */}
              {!collapsed && (
                <div style={{ marginBottom: '4px' }}>
                  {grpRoles.map((role) => {
                    const count = members.filter((m) => m.role === role.slug).length
                    const isSelected = selectedId === role.id
                    return (
                      <button
                        key={role.id}
                        onClick={() => selectRole(role.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px 9px 20px', background: isSelected ? `${role.color}14` : 'none',
                          border: 'none', borderLeft: isSelected ? `3px solid ${role.color}` : '3px solid transparent',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', borderRadius: '0 6px 6px 0',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#ffffff' : '#d1d5db', lineHeight: '1.3', textAlign: 'left', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {role.label}
                        </span>
                        <span style={{ fontSize: '11px', color: count > 0 ? color : '#374151', background: count > 0 ? `${color}18` : 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '1px 6px', flexShrink: 0 }}>
                          {count}
                        </span>
                      </button>
                    )
                  })}

                  {/* Add custom role in member group */}
                  {key === 'member' && (
                    <button
                      onClick={openAdd}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px 8px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#C9A84C', fontSize: '12px', fontFamily: 'inherit', textAlign: 'left', borderRadius: '0 6px 6px 0', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <Plus size={11} /> Add Custom Role
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .roles-wrapper { display: flex; flex-direction: column; gap: 0; }
        .roles-list-panel { background: rgba(13,19,36,0.60); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
        .roles-detail-panel { display: none; }
        @media (min-width: 768px) {
          .roles-wrapper { flex-direction: row; align-items: flex-start; gap: 12px; }
          .roles-list-panel { width: 260px; flex-shrink: 0; }
          .roles-detail-panel { display: flex; flex-direction: column; flex: 1; min-height: 480px; background: rgba(13,19,36,0.60); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
        }
      `}</style>

      <div className="roles-wrapper">
        {/* ── LEFT: role list ── */}
        <div className="roles-list-panel">
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', flex: 1 }}>Chapter Roles</span>
            <span style={{ fontSize: '11px', color: '#4B5563', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px 7px' }}>{roles.length}</span>
          </div>
          <div style={{ padding: '6px 4px 10px' }}>
            <RoleList />
          </div>
        </div>

        {/* ── RIGHT: role detail (desktop only) ── */}
        <div className="roles-detail-panel">
          {selectedRole ? (
            <RoleDetail />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center', color: '#374151' }}>
              <Shield size={36} style={{ marginBottom: '12px', opacity: 0.2 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#4B5563' }}>Select a role</div>
              <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
                Click any role on the left to view members and manage assignments
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE: role detail modal ── */}
      {mobileDetailOpen && selectedRole && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={(e) => e.target === e.currentTarget && setMobileDetailOpen(false)}
        >
          <div style={{ background: 'rgba(10,15,30,0.99)', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <RoleDetail onClose={() => setMobileDetailOpen(false)} />
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ROLE MODAL ── */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '16px' }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={{ width: '100%', maxWidth: '440px', background: 'rgba(12,18,34,0.99)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(201,168,76,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: '#C9A84C' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{editingRole ? 'Edit Role' : 'New Custom Role'}</span>
              </div>
              <button onClick={() => setShowForm(false)} style={{ width: '26px', height: '26px', borderRadius: '5px', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} />
              </button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {/* Label */}
              <div>
                <label style={labelSm}>Role Label</label>
                <input
                  style={inputSm}
                  value={roleForm.label}
                  onChange={(e) => {
                    const label = e.target.value
                    setRoleForm((f) => ({
                      ...f, label,
                      ...(editingRole ? {} : { slug: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }),
                    }))
                  }}
                  placeholder="e.g. Social Media Coordinator"
                />
              </div>

              {/* Slug (create only) */}
              {!editingRole && (
                <div>
                  <label style={labelSm}>Slug <span style={{ color: '#374151', textTransform: 'none', letterSpacing: 0 }}>(unique identifier)</span></label>
                  <input
                    style={{ ...inputSm, fontFamily: 'monospace', color: '#C9A84C' }}
                    value={roleForm.slug}
                    onChange={(e) => setRoleForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="social_media_coordinator"
                  />
                </div>
              )}

              {/* Group + Access Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelSm}>Group</label>
                  <select style={{ ...inputSm, cursor: 'pointer' }} value={roleForm.group} onChange={(e) => setRoleForm((f) => ({ ...f, group: e.target.value }))}>
                    {Object.entries(GROUPS).map(([k, g]) => (
                      <option key={k} value={k}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelSm}>Access Level</label>
                  <select style={{ ...inputSm, cursor: 'pointer' }} value={roleForm.accessLevel} onChange={(e) => setRoleForm((f) => ({ ...f, accessLevel: e.target.value }))}>
                    {ACCESS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div>
                <label style={labelSm}>Role Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setRoleForm((f) => ({ ...f, color: c }))}
                      style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: roleForm.color === c ? '3px solid #fff' : '3px solid transparent', outlineOffset: '2px' }} />
                  ))}
                  <label style={{ cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                    <input type="color" value={roleForm.color} onChange={(e) => setRoleForm((f) => ({ ...f, color: e.target.value }))} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                  </label>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: roleForm.color, border: '2px solid rgba(255,255,255,0.3)' }} />
                </div>
              </div>

              {/* Preview */}
              <div style={{ padding: '9px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: roleForm.color }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{roleForm.label || 'Role Label'}</span>
                <AccessBadge level={roleForm.accessLevel} />
              </div>
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={saveRole} disabled={roleSaving} style={{ padding: '8px 18px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg, #C9A84C, #a0803a)', color: '#000', fontWeight: 700, cursor: roleSaving ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'inherit', opacity: roleSaving ? 0.7 : 1 }}>
                {roleSaving ? 'Saving…' : editingRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEALLOCATION MODAL ── */}
      {deallocState && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', padding: '16px' }}
          onClick={(e) => e.target === e.currentTarget && !deallocSaving && setDeallocState(null)}
        >
          <div style={{ width: '100%', maxWidth: '440px', background: 'rgba(12,18,34,0.99)', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '9px', background: 'rgba(245,158,11,0.06)' }}>
              <AlertTriangle size={17} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Role Has Members</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
                  Reassign before deleting <span style={{ color: deallocState.role.color }}>&ldquo;{deallocState.role.label}&rdquo;</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {deallocState.blockers.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `linear-gradient(135deg, ${deallocState.role.color}, ${deallocState.role.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#000', flexShrink: 0 }}>
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb' }}>{m.name}</div>
                      {m.business && <div style={{ fontSize: '10px', color: '#6B7280' }}>{m.business}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ ...labelSm, color: '#F59E0B' }}>Reassign all to</label>
                <select
                  style={{ ...inputSm, borderColor: deallocState.reassignTo ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  value={deallocState.reassignTo}
                  onChange={(e) => setDeallocState((s) => s ? { ...s, reassignTo: e.target.value } : null)}
                >
                  <option value="">— Select a role —</option>
                  {roles.filter((r) => r.id !== deallocState.role.id).map((r) => (
                    <option key={r.id} value={r.slug}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeallocState(null)} disabled={deallocSaving} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button
                onClick={deallocAndDelete}
                disabled={deallocSaving || !deallocState.reassignTo}
                style={{ padding: '8px 18px', borderRadius: '7px', border: 'none', background: deallocState.reassignTo ? 'linear-gradient(135deg, #CC0000, #880000)' : 'rgba(255,255,255,0.06)', color: deallocState.reassignTo ? '#fff' : '#4B5563', fontWeight: 700, cursor: (deallocSaving || !deallocState.reassignTo) ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Trash2 size={11} />
                {deallocSaving ? 'Processing…' : 'Reassign & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
