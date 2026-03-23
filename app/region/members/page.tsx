'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  Users, Phone, Mail, Search, X, ChevronDown, Loader2,
} from 'lucide-react'

type Member = {
  id: string
  name: string
  email: string
  role: string
  accessLevel: string
  phone: string | null
  business: string | null
  chapterId: string | null
  chapterName: string
  joinedAt: string | null
  trafficLight: 'green' | 'yellow' | 'red' | 'gray'
}

type Chapter = { id: string; name: string }

const ROLE_LABELS: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Sec/Treasurer',
  growthCoordinator: 'Growth Coord',
  applicationReviewCoord: 'App Review',
  retentionCoordinator: 'Retention',
  attendanceCoordinator: 'Attendance',
  mentorCoordinator: 'Mentor',
  sportsEventCoordinator: 'Sports & Events',
  greenclubCoordinator: 'Greenclub',
  socialMediaCoordinator: 'Social Media',
  rvqcCoordinator: 'RVQC',
  member: 'Member',
}

const HEAD_TABLE_ROLES = ['president', 'vicePresident', 'secretaryTreasurer']
const MC_ROLES = [
  'growthCoordinator',
  'applicationReviewCoord',
  'retentionCoordinator',
  'attendanceCoordinator',
  'mentorCoordinator',
  'sportsEventCoordinator',
  'greenclubCoordinator',
  'socialMediaCoordinator',
  'rvqcCoordinator',
]

type FilterChip = {
  id: string
  label: string
  roles: string[] | null // null = 'all', empty [] = unassigned
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'all', label: 'All', roles: null },
  { id: 'headTable', label: 'Head Table', roles: HEAD_TABLE_ROLES },
  { id: 'president', label: 'Presidents', roles: ['president'] },
  { id: 'vicePresident', label: 'Vice Presidents', roles: ['vicePresident'] },
  { id: 'secretaryTreasurer', label: 'Sec / Treasurer', roles: ['secretaryTreasurer'] },
  { id: 'growthCoordinator', label: 'Growth Coord', roles: ['growthCoordinator'] },
  { id: 'applicationReviewCoord', label: 'App Review', roles: ['applicationReviewCoord'] },
  { id: 'retentionCoordinator', label: 'Retention', roles: ['retentionCoordinator'] },
  { id: 'attendanceCoordinator', label: 'Attendance', roles: ['attendanceCoordinator'] },
  { id: 'mentorCoordinator', label: 'Mentor', roles: ['mentorCoordinator'] },
  { id: 'sportsEventCoordinator', label: 'Sports & Events', roles: ['sportsEventCoordinator'] },
  { id: 'greenclubCoordinator', label: 'Greenclub', roles: ['greenclubCoordinator'] },
  { id: 'socialMediaCoordinator', label: 'Social Media', roles: ['socialMediaCoordinator'] },
  { id: 'rvqcCoordinator', label: 'RVQC', roles: ['rvqcCoordinator'] },
  { id: 'member', label: 'Members', roles: ['member'] },
]

const TRAFFIC_COLORS: Record<string, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  gray: '#4B5563',
}

function getRoleBadgeStyle(role: string): { background: string; color: string } {
  if (HEAD_TABLE_ROLES.includes(role)) {
    return { background: 'rgba(204,0,0,0.15)', color: '#CC0000' }
  }
  if (MC_ROLES.includes(role)) {
    return { background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }
  }
  return { background: 'rgba(107,114,128,0.15)', color: '#6B7280' }
}

function getAvatarStyle(role: string): { background: string; color: string; border: string } {
  if (HEAD_TABLE_ROLES.includes(role)) {
    return {
      background: 'rgba(204,0,0,0.18)',
      color: '#CC0000',
      border: '1px solid rgba(204,0,0,0.3)',
    }
  }
  if (MC_ROLES.includes(role)) {
    return {
      background: 'rgba(59,130,246,0.15)',
      color: '#3B82F6',
      border: '1px solid rgba(59,130,246,0.25)',
    }
  }
  return {
    background: 'rgba(107,114,128,0.15)',
    color: '#9CA3AF',
    border: '1px solid rgba(107,114,128,0.2)',
  }
}

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function fuzzyMatch(query: string, target: string): boolean {
  const q = normalizeStr(query)
  const t = normalizeStr(target)
  if (t.includes(q)) return true
  // subsequence check
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

function memberMatches(q: string, m: Member): boolean {
  const words = q.trim().split(/\s+/).filter(Boolean)
  const fields = [m.name, m.business ?? '', m.email, m.chapterName]
  for (const word of words) {
    const anyMatch = fields.some((f) => fuzzyMatch(word, f))
    if (!anyMatch) return false
  }
  return true
}

function MemberCard({ m }: { m: Member }) {
  const avatarStyle = getAvatarStyle(m.role)
  const badgeStyle = getRoleBadgeStyle(m.role)
  const trafficColor = TRAFFIC_COLORS[m.trafficLight] ?? TRAFFIC_COLORS.gray
  const initials = m.name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  const joinLabel = m.joinedAt
    ? new Date(m.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null

  const attendanceLabel =
    m.trafficLight === 'green'
      ? 'Good attendance'
      : m.trafficLight === 'yellow'
      ? 'Average'
      : m.trafficLight === 'red'
      ? 'Poor attendance'
      : 'No data'

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '14px',
      }}
    >
      {/* Row 1: avatar + name + role badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            ...avatarStyle,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#ffffff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {m.name}
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: '10px',
            fontWeight: '600',
            padding: '2px 7px',
            borderRadius: '8px',
            ...badgeStyle,
          }}
        >
          {ROLE_LABELS[m.role] ?? m.role}
        </span>
      </div>

      {/* Row 2: chapter + business */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '7px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: '600',
            padding: '2px 7px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)',
            color: '#9CA3AF',
            flexShrink: 0,
          }}
        >
          {m.chapterName}
        </span>
        {m.business && (
          <span
            style={{
              fontSize: '11px',
              color: '#6B7280',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {m.business}
          </span>
        )}
      </div>

      {/* Row 3: phone + email */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#6B7280',
        }}
      >
        {m.phone && (
          <a
            href={`tel:${m.phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6B7280',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Phone size={10} style={{ color: '#4B5563' }} />
            {m.phone}
          </a>
        )}
        {m.email && (
          <a
            href={`mailto:${m.email}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6B7280',
              textDecoration: 'none',
              overflow: 'hidden',
              flex: 1,
              minWidth: 0,
            }}
          >
            <Mail size={10} style={{ color: '#4B5563', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</span>
          </a>
        )}
      </div>

      {/* Row 4: traffic light + join date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: trafficColor,
            flexShrink: 0,
            boxShadow: `0 0 6px ${trafficColor}88`,
          }}
        />
        <span style={{ fontSize: '11px', color: trafficColor }}>{attendanceLabel}</span>
        {joinLabel && (
          <>
            <span style={{ fontSize: '10px', color: '#374151' }}>·</span>
            <span style={{ fontSize: '10px', color: '#4B5563' }}>Since {joinLabel}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function RegionMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeChip, setActiveChip] = useState('all')
  const [chapterFilter, setChapterFilter] = useState('')

  useEffect(() => {
    fetch('/api/region/members-detail')
      .then((r) => r.json())
      .then((data) => {
        setMembers(Array.isArray(data.members) ? data.members : [])
        setChapters(Array.isArray(data.chapters) ? data.chapters : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = members

    // Chapter filter
    if (chapterFilter) {
      list = list.filter((m) => m.chapterId === chapterFilter)
    }

    // Role chip filter
    const chip = FILTER_CHIPS.find((c) => c.id === activeChip)
    if (chip && chip.roles !== null) {
      list = list.filter((m) => chip.roles!.includes(m.role))
    }

    // Search filter
    const q = searchQuery.trim()
    if (q) {
      list = list.filter((m) => memberMatches(q, m))
    }

    return list
  }, [members, chapterFilter, activeChip, searchQuery])

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:.65} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '18px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-bebas), sans-serif',
            fontSize: '32px',
            letterSpacing: '3px',
            color: '#ffffff',
            margin: 0,
          }}
        >
          ALL <span style={{ color: '#CC0000' }}>MEMBERS</span>
        </h1>
        <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '3px', marginBottom: 0 }}>
          {loading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
            </span>
          ) : (
            `${filtered.length} of ${members.length} member${members.length !== 1 ? 's' : ''}`
          )}
        </p>
      </div>

      {/* Search + chapter filter row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#4B5563',
              pointerEvents: 'none',
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, business..."
            style={{
              width: '100%',
              padding: '9px 32px 9px 30px',
              borderRadius: '9px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4B5563',
                padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Chapter dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            style={{
              padding: '9px 32px 9px 12px',
              borderRadius: '9px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: chapterFilter ? '#ffffff' : '#6B7280',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="">All Chapters</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Role filter chips */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '18px',
          scrollbarWidth: 'none',
        }}
      >
        {FILTER_CHIPS.map((chip) => {
          const active = activeChip === chip.id
          return (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              style={{
                flexShrink: 0,
                padding: '6px 13px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: active ? '700' : '500',
                cursor: 'pointer',
                border: `1px solid ${active ? 'rgba(204,0,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: active ? 'rgba(204,0,0,0.2)' : 'rgba(255,255,255,0.05)',
                color: active ? '#CC0000' : '#9CA3AF',
                transition: 'all 0.15s',
              }}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '10px',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                height: '140px',
                animation: 'pulse 1.5s ease infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div
          style={{
            padding: '60px',
            textAlign: 'center',
            color: '#4B5563',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
          }}
        >
          <Users size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#374151' }} />
          <p style={{ margin: 0 }}>No members found.</p>
          {(searchQuery || chapterFilter || activeChip !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setChapterFilter('')
                setActiveChip('all')
              }}
              style={{
                marginTop: '12px',
                background: 'none',
                border: 'none',
                color: '#CC0000',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Clear filters →
            </button>
          )}
        </div>
      )}

      {/* Member cards grid */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '10px',
          }}
        >
          {filtered.map((m) => (
            <MemberCard key={m.id} m={m} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #0A0F1E; color: #ffffff; }
        ::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>
    </div>
  )
}
