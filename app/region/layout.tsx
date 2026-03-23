'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  ChevronRight,
  UserCog,
  Plus,
} from 'lucide-react'

type NavItem = { href: string; icon: React.ElementType; label: string; exact?: boolean }

const navItems: NavItem[] = [
  { href: '/region',          icon: LayoutDashboard, label: 'Overview',    exact: true },
  { href: '/region/chapters', icon: Building2,       label: 'Chapters' },
  { href: '/region/members',  icon: Users,           label: 'All Members' },
  { href: '/region/analytics',icon: BarChart3,       label: 'Analytics' },
  { href: '/region/settings', icon: Settings,        label: 'Settings' },
]

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href
  return pathname.startsWith(item.href)
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const router = useRouter()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className="glass-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #1E40AF, #C9A84C)', flexShrink: 0 }} />

      {/* Logo */}
      <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #1E40AF, #1E3A8A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-bebas), sans-serif', fontSize: '15px',
          color: '#fff', letterSpacing: '1px', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(30,64,175,0.4)',
        }}>
          BNI
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', color: '#C9A84C', letterSpacing: '2px', lineHeight: 1.1 }}>
            REGION ADMIN
          </div>
          <div style={{ fontSize: '9px', color: '#8B95A3', letterSpacing: '2px', textTransform: 'uppercase' }}>
            South Kerala
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}>
            <X size={17} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '9px', color: '#6B7280', letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
          Region Management
        </div>
        {navItems.map((item) => {
          const active = isActive(item, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '11px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
                textDecoration: 'none',
                color: active ? '#ffffff' : '#9CA3AF',
                background: active ? 'rgba(30,64,175,0.14)' : 'transparent',
                border: active ? '1px solid rgba(30,64,175,0.28)' : '1px solid transparent',
                transition: 'all 0.15s', fontSize: '13.5px', fontWeight: active ? '600' : '400',
              }}
            >
              <item.icon size={17} style={{ color: active ? '#3B82F6' : '#6B7280', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={13} style={{ color: '#3B82F6', opacity: 0.7 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '6px 12px 8px', overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.user?.name ?? 'Region Admin'}
          </div>
          <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '400' }}>regionAdmin</div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
            background: 'transparent', color: '#6B7280', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; e.currentTarget.style.color = '#CC0000' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}

function ProfileMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    setOpen(false)
    await signOut({ redirect: false })
    router.push('/login')
  }

  const initials = session?.user?.name?.charAt(0)?.toUpperCase() ?? 'R'
  const name = session?.user?.name ?? 'Region Admin'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '10px', transition: 'background 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <div className="hidden sm:block" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', lineHeight: '1.2', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: '11px', fontWeight: '400', color: '#3B82F6', lineHeight: '1.2' }}>regionAdmin</div>
        </div>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: open ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.12)',
          border: `2px solid ${open ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.28)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '14px', color: '#3B82F6', transition: 'all 0.15s',
        }}>
          {initials}
        </div>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '200px', zIndex: 200,
          background: 'rgba(8,12,24,0.97)', backdropFilter: 'blur(24px)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '600' }}>Region Admin</div>
          </div>
          <div style={{ padding: '6px' }}>
            <Link
              href="/region/settings"
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', textDecoration: 'none', color: '#9CA3AF', fontSize: '14px', fontWeight: '600' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
            >
              <UserCog size={15} style={{ color: '#6B7280' }} />
              Region Settings
            </Link>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: 'none',
                color: '#9CA3AF', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; e.currentTarget.style.color = '#CC0000' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
            >
              <LogOut size={15} style={{ color: '#CC0000' }} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RegionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div style={{ display: 'flex', height: '100dvh', backgroundColor: '#0A0F1E', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ width: '240px', flexShrink: 0, height: '100%' }} className="hidden lg:block">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex' }}
          onClick={() => setMobileOpen(false)}
        >
          <div style={{ width: '260px', height: '100%' }} onClick={(e) => e.stopPropagation()}>
            <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Desktop topbar */}
        <div className="hidden lg:flex glass-topbar" style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
            <span style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase' }}>Region Admin Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/region/chapters/new" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px', textDecoration: 'none',
              background: 'rgba(30,64,175,0.15)', border: '1px solid rgba(59,130,246,0.25)',
              color: '#3B82F6', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
            }}>
              <Plus size={14} /> New Chapter
            </Link>
            <ProfileMenu />
          </div>
        </div>

        {/* Mobile topbar */}
        <div className="flex lg:hidden glass-topbar" style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '6px' }}>
            <Building2 size={20} />
          </button>
          <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', letterSpacing: '3px', color: '#ffffff' }}>
            BNI <span style={{ color: '#3B82F6' }}>REGION</span>
          </div>
          <ProfileMenu />
        </div>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
