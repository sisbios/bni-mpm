'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Building2, Pencil, MapPin, Clock, Users, Leaf,
  UserCheck, TrendingUp, Phone, IndianRupee, LayoutDashboard,
} from 'lucide-react'

type HTMember = { id: string; name: string; role: string; phone: string | null }
type ChapterStat = {
  id: string
  name: string
  slug: string
  city: string | null
  meetingDay: string | null
  meetingTime: string | null
  meetingLocation: string | null
  meetingFee: number | null
  visitorFee: number | null
  isActive: boolean
  totalMembers: number
  totalGreenMembers: number
  totalVisitorsLastMonth: number
  totalRevenue: number
  headTable: HTMember[]
}

const ROLE_LABEL: Record<string, string> = {
  president: 'President',
  vicePresident: 'VP',
  secretaryTreasurer: 'Sec/Treas',
}

const HT_ROLE_COLORS: Record<string, string> = {
  president: '#CC0000',
  vicePresident: '#C9A84C',
  secretaryTreasurer: '#8B5CF6',
}

function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType
  value: string | number
  label: string
  color: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 8px',
        borderRadius: '7px',
        background: `${color}10`,
        border: `1px solid ${color}20`,
        flexShrink: 0,
      }}
    >
      <Icon size={12} style={{ color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '1px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{label}</div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        height: '170px',
        animation: 'pulse 1.5s ease infinite',
      }}
    />
  )
}

export default function ChaptersListPage() {
  const [chapters, setChapters] = useState<ChapterStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/region/chapter-stats')
      .then((r) => r.json())
      .then((data) => {
        setChapters(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:.65} }`}</style>

      {/* Header */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-bebas), sans-serif',
              fontSize: '32px',
              letterSpacing: '3px',
              color: '#ffffff',
              margin: 0,
            }}
          >
            CHAPTERS
          </h1>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '3px', marginBottom: 0 }}>
            {loading ? 'Loading...' : `${chapters.length} chapter${chapters.length !== 1 ? 's' : ''} in your region`}
          </p>
        </div>
        <Link
          href="/region/chapters/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '10px',
            textDecoration: 'none',
            background: 'rgba(139,0,0,0.2)',
            border: '1px solid rgba(204,0,0,0.35)',
            color: '#CC0000',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          <Plus size={15} /> New Chapter
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '12px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && chapters.length === 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
          }}
        >
          <Building2 size={48} style={{ color: '#374151', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ color: '#4B5563', margin: 0, fontSize: '16px' }}>No chapters yet.</p>
          <Link
            href="/region/chapters/new"
            style={{
              display: 'inline-block',
              marginTop: '16px',
              color: '#CC0000',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Create your first chapter →
          </Link>
        </div>
      )}

      {/* Chapter cards grid */}
      {!loading && chapters.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '12px',
          }}
        >
          {chapters.map((ch) => (
            <div
              key={ch.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `4px solid ${ch.isActive ? 'rgba(204,0,0,0.5)' : 'rgba(107,114,128,0.3)'}`,
                borderRadius: '14px',
                padding: '14px',
                opacity: ch.isActive ? 1 : 0.7,
              }}
            >
              {/* Top strip: avatar + name + status + edit */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {/* Initial avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: ch.isActive ? 'rgba(204,0,0,0.15)' : 'rgba(107,114,128,0.12)',
                    border: `1px solid ${ch.isActive ? 'rgba(204,0,0,0.3)' : 'rgba(107,114,128,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-bebas), sans-serif',
                    fontSize: '17px',
                    color: ch.isActive ? '#CC0000' : '#6B7280',
                  }}
                >
                  {ch.name.charAt(0)}
                </div>
                {/* Name + city */}
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
                    {ch.name}
                    {ch.city ? <span style={{ fontWeight: '400', color: '#6B7280', marginLeft: '5px' }}>· {ch.city}</span> : null}
                  </div>
                  {/* Status dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: ch.isActive ? '#10B981' : '#6B7280',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: ch.isActive ? '#10B981' : '#6B7280',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: ch.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                      }}
                    >
                      {ch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {/* Admin Access link */}
                <a
                  href={`https://${ch.slug}.${typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '') : 'bnimalappuram.com'}/dashboard`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${ch.name} admin dashboard`}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(204,0,0,0.1)',
                    border: '1px solid rgba(204,0,0,0.25)',
                    color: '#CC0000',
                    textDecoration: 'none',
                  }}
                >
                  <LayoutDashboard size={12} />
                </a>
                {/* Edit link */}
                <Link
                  href={`/region/chapters/${ch.id}`}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#6B7280',
                    textDecoration: 'none',
                  }}
                >
                  <Pencil size={12} />
                </Link>
              </div>

              {/* Info row: clock + location + fee */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '10px',
                  fontSize: '11px',
                  color: '#6B7280',
                }}
              >
                {ch.meetingDay && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} style={{ color: '#4B5563' }} />
                    {ch.meetingDay}
                    {ch.meetingTime ? ` ${ch.meetingTime}` : ''}
                  </span>
                )}
                {(ch.meetingLocation || ch.city) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={10} style={{ color: '#4B5563' }} />
                    {ch.meetingLocation ?? ch.city}
                  </span>
                )}
                {(ch.meetingFee != null || ch.visitorFee != null) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <IndianRupee size={10} style={{ color: '#4B5563' }} />
                    {ch.meetingFee != null ? `₹${ch.meetingFee}` : ''}
                    {ch.meetingFee != null && ch.visitorFee != null ? ' · ' : ''}
                    {ch.visitorFee != null ? `V₹${ch.visitorFee}` : ''}
                  </span>
                )}
              </div>

              {/* Stats pills row */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <StatPill icon={Users} value={ch.totalMembers} label="Members" color="#3B82F6" />
                <StatPill icon={Leaf} value={ch.totalGreenMembers} label="Green" color="#10B981" />
                <StatPill icon={UserCheck} value={ch.totalVisitorsLastMonth} label="Visitors" color="#F59E0B" />
                <StatPill
                  icon={TrendingUp}
                  value={ch.totalRevenue > 0 ? `₹${(ch.totalRevenue / 100000).toFixed(1)}L` : '—'}
                  label="Revenue"
                  color="#8B5CF6"
                />
              </div>

              {/* HT row */}
              {ch.headTable.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.8px', marginRight: '2px' }}>HT:</span>
                  {ch.headTable.map((m) => {
                    const roleColor = HT_ROLE_COLORS[m.role] ?? '#CC0000'
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: `${roleColor}0f`,
                          border: `1px solid ${roleColor}22`,
                        }}
                      >
                        {/* Initials circle */}
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: `${roleColor}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: '700',
                            color: roleColor,
                            flexShrink: 0,
                          }}
                        >
                          {m.name.charAt(0)}
                        </div>
                        <div style={{ maxWidth: '80px' }}>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#ffffff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {m.name.split(' ')[0]}
                          </div>
                          <div style={{ fontSize: '9px', color: roleColor }}>{ROLE_LABEL[m.role] ?? m.role}</div>
                        </div>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} style={{ color: '#4B5563', marginLeft: '1px', flexShrink: 0 }}>
                            <Phone size={10} />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: '#374151' }}>
                  No HT assigned ·{' '}
                  <Link href="/region/roles" style={{ color: '#CC0000', textDecoration: 'none' }}>
                    Assign →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
