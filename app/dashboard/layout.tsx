'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { APP_VERSION } from '@/lib/version'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  ClipboardList,
  Trophy,
  Settings,
  LogOut,
  X,
  ChevronRight,
  BookUser,
  ShieldCheck,
  UserCircle,
  UserCog,
  Mic2,
  BarChart2,
  TrendingUp,
  UserCheck,
  Menu,
} from 'lucide-react'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  exact?: boolean
  access?: 'all' | 'officer' | 'superadmin'
  roles?: string[]
}

const sidebarNavItems: NavItem[] = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard',    exact: true, access: 'all' },
  { href: '/dashboard/members',      icon: Users,           label: 'Members',                   access: 'officer' },
  { href: '/dashboard/calendar',     icon: Calendar,        label: 'Calendar',                  access: 'all' },
  { href: '/dashboard/events',       icon: CalendarCheck,   label: 'Events',                    access: 'all' },
  { href: '/dashboard/tasks',        icon: ClipboardList,   label: 'Weekly Tasks',              access: 'officer' },
  { href: '/dashboard/achievements', icon: Trophy,          label: 'Achievements',              access: 'all' },
  { href: '/dashboard/contacts',     icon: BookUser,        label: 'Contact Pool',              access: 'officer' },
  { href: '/dashboard/presentations',icon: Mic2,            label: 'Presentations',             access: 'officer' },
  { href: '/dashboard/palms',        icon: BarChart2,       label: 'PALMS Report',              access: 'officer' },
  { href: '/dashboard/visitors',     icon: UserCheck,       label: 'Visitors Pool',             access: 'officer' },
  { href: '/dashboard/traffic-light',icon: TrendingUp,      label: 'Traffic Light',             access: 'officer' },
  { href: '/dashboard/roles',        icon: ShieldCheck,     label: 'Roles',                     access: 'superadmin', roles: ['president', 'vicePresident'] },
  { href: '/dashboard/profile',      icon: UserCircle,      label: 'My Contacts',               access: 'all' },
]

const bottomNavItems: NavItem[] = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Home',    exact: true, access: 'all' },
  { href: '/dashboard/events',       icon: CalendarCheck,   label: 'Events',               access: 'all' },
  { href: '/dashboard/tasks',        icon: ClipboardList,   label: 'Tasks',                access: 'officer' },
  { href: '/dashboard/achievements', icon: Trophy,          label: 'Awards',               access: 'all' },
  { href: '/dashboard/members',      icon: Users,           label: 'Members',              access: 'officer' },
]

function canSeeItem(item: NavItem, accessLevel: string, role: string): boolean {
  if (accessLevel === 'superadmin' || accessLevel === 'platform') return true
  if (item.roles?.includes(role)) return true
  if (item.access === 'superadmin') return false
  if (item.access === 'officer') return accessLevel === 'officer'
  return true
}

function isActive(item: { href: string; exact?: boolean }, pathname: string) {
  if (item.exact) return pathname === item.href
  return pathname.startsWith(item.href)
}

// ─── Full sidebar (desktop) ────────────────────────────────────────────────
function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const router = useRouter()
  const { data: session } = useSession()
  const accessLevel = session?.user?.accessLevel ?? 'officer'
  const role = session?.user?.role ?? ''
  const visibleItems = sidebarNavItems.filter((item) => canSeeItem(item, accessLevel, role))

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className="glass-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #CC0000, #C9A84C)', flexShrink: 0 }} />
      <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
          background: 'linear-gradient(135deg, #CC0000, #880000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-bebas), sans-serif', fontSize: '15px', color: '#fff',
          letterSpacing: '1px', boxShadow: '0 4px 12px rgba(204,0,0,0.35)',
        }}>BNI</div>
        <div>
          <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '18px', color: '#C9A84C', letterSpacing: '3px', lineHeight: 1.1 }}>{session?.user?.chapterName?.toUpperCase() ?? 'CHAPTER'}</div>
          <div style={{ fontSize: '9px', color: '#8B95A3', letterSpacing: '2px', textTransform: 'uppercase' }}>Chapter Admin</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: '9px', color: '#4B5563', letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px 8px' }}>Navigation</div>
        {visibleItems.map((item) => {
          const active = isActive(item, pathname)
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
              borderRadius: '9px', marginBottom: '1px', textDecoration: 'none',
              color: active ? '#ffffff' : '#9CA3AF',
              background: active ? 'rgba(204,0,0,0.14)' : 'transparent',
              border: active ? '1px solid rgba(204,0,0,0.22)' : '1px solid transparent',
              transition: 'all 0.15s', fontSize: '13px', fontWeight: active ? '600' : '400',
            }}>
              <item.icon size={16} style={{ color: active ? '#CC0000' : '#6B7280', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={12} style={{ color: '#CC0000', opacity: 0.7 }} />}
            </Link>
          )
        })}
        <div style={{ marginTop: '12px', fontSize: '9px', color: '#4B5563', letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 8px 8px' }}>System</div>
        <Link href="/dashboard/settings" onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
          borderRadius: '9px', textDecoration: 'none',
          color: pathname.startsWith('/dashboard/settings') ? '#ffffff' : '#9CA3AF',
          background: pathname.startsWith('/dashboard/settings') ? 'rgba(204,0,0,0.14)' : 'transparent',
          border: pathname.startsWith('/dashboard/settings') ? '1px solid rgba(204,0,0,0.22)' : '1px solid transparent',
          transition: 'all 0.15s', fontSize: '13px', fontWeight: pathname.startsWith('/dashboard/settings') ? '600' : '400',
        }}>
          <Settings size={16} style={{ color: '#6B7280', flexShrink: 0 }} />
          <span>Settings</span>
        </Link>
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleSignOut} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
          borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
          color: '#6B7280', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; e.currentTarget.style.color = '#CC0000'; e.currentTarget.style.borderColor = 'rgba(204,0,0,0.22)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        >
          <LogOut size={13} /><span>Sign out</span>
        </button>
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '10px', color: '#374151', letterSpacing: '1px' }}>{APP_VERSION}</div>
      </div>
    </div>
  )
}

// ─── Icon-only sidebar (mobile drawer) ────────────────────────────────────
function MobileSideDrawer({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const router = useRouter()
  const { data: session } = useSession()
  const accessLevel = session?.user?.accessLevel ?? 'officer'
  const role = session?.user?.role ?? ''
  const visibleItems = sidebarNavItems.filter((item) => canSeeItem(item, accessLevel, role))

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className="glass-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '64px' }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #CC0000, #C9A84C)', flexShrink: 0 }} />
      {/* Logo + close */}
      <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #CC0000, #880000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-bebas), sans-serif', fontSize: '13px', color: '#fff', letterSpacing: '1px',
        }}>BNI</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '2px' }}>
          <X size={14} />
        </button>
      </div>

      {/* Nav icons */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        {visibleItems.map((item) => {
          const active = isActive(item, pathname)
          return (
            <Link key={item.href} href={item.href} onClick={onClose} title={item.label} style={{
              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
              background: active ? 'rgba(204,0,0,0.18)' : 'transparent',
              border: active ? '1px solid rgba(204,0,0,0.28)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}>
              <item.icon size={19} style={{ color: active ? '#CC0000' : '#6B7280' }} />
            </Link>
          )
        })}
        <Link href="/dashboard/settings" onClick={onClose} title="Settings" style={{
          width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', marginTop: '4px',
          background: pathname.startsWith('/dashboard/settings') ? 'rgba(204,0,0,0.18)' : 'transparent',
          border: pathname.startsWith('/dashboard/settings') ? '1px solid rgba(204,0,0,0.28)' : '1px solid transparent',
          transition: 'all 0.15s',
        }}>
          <Settings size={19} style={{ color: pathname.startsWith('/dashboard/settings') ? '#CC0000' : '#6B7280' }} />
        </Link>
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
        <button onClick={handleSignOut} title="Sign out" style={{
          width: '44px', height: '44px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.12)'; e.currentTarget.style.borderColor = 'rgba(204,0,0,0.22)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
        >
          <LogOut size={17} style={{ color: '#CC0000' }} />
        </button>
      </div>
    </div>
  )
}

// ─── Profile menu (dropdown uses position:fixed to escape overflow:hidden) ──
function ProfileMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  async function handleSignOut() {
    setOpen(false)
    await signOut({ redirect: false })
    router.push('/login')
  }

  const initials = session?.user?.name?.charAt(0)?.toUpperCase() ?? 'A'
  const name = session?.user?.name ?? 'Admin'
  const role = session?.user?.role ?? 'admin'

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={handleToggle} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px',
        borderRadius: '10px', transition: 'background 0.15s',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <div className="hidden sm:block" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', lineHeight: '1.2', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: '10px', color: '#C9A84C', textTransform: 'capitalize', lineHeight: '1.2' }}>{role}</div>
        </div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: open ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.12)',
          border: `2px solid ${open ? 'rgba(201,168,76,0.6)' : 'rgba(201,168,76,0.28)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '700', fontSize: '13px', color: '#C9A84C', transition: 'all 0.15s',
        }}>{initials}</div>
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: dropPos.top, right: dropPos.right,
          width: '210px', zIndex: 9999,
          background: 'rgba(8,12,24,0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(201,168,76,0.12)', border: '2px solid rgba(201,168,76,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '15px', color: '#C9A84C',
              }}>{initials}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                <div style={{ fontSize: '11px', color: '#C9A84C', textTransform: 'capitalize', fontWeight: '600' }}>{role}</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '4px' }}>
            {[
              { href: '/dashboard/settings', icon: UserCog, label: 'Edit Profile' },
              { href: '/dashboard/profile',  icon: UserCircle, label: 'My Contacts' },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', textDecoration: 'none',
                color: '#9CA3AF', fontSize: '13px', fontWeight: '600', transition: 'all 0.12s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                <Icon size={14} style={{ color: '#6B7280' }} />{label}
              </Link>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '3px 0' }} />
            <button onClick={handleSignOut} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px', background: 'transparent', border: 'none',
              color: '#9CA3AF', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.12s', textAlign: 'left',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,0,0,0.1)'; e.currentTarget.style.color = '#CC0000' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
            >
              <LogOut size={14} style={{ color: '#CC0000' }} />Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mobile bottom nav ─────────────────────────────────────────────────────
function MobileBottomNav({ pathname, accessLevel, role }: { pathname: string; accessLevel: string; role: string }) {
  const visibleItems = bottomNavItems.filter((item) => canSeeItem(item, accessLevel, role))
  return (
    <nav className="flex lg:hidden glass-nav" style={{
      flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)',
      alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {visibleItems.map((item) => {
        const active = isActive(item, pathname)
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '3px', padding: '9px 2px 10px',
            textDecoration: 'none', color: active ? '#CC0000' : '#6B7280',
            transition: 'color 0.18s', WebkitTapHighlightColor: 'transparent',
          }}>
            <div className="bottom-nav-pill" style={{
              background: active ? 'rgba(204,0,0,0.15)' : 'transparent',
              borderColor: active ? 'rgba(204,0,0,0.22)' : 'transparent',
              boxShadow: active ? '0 0 14px rgba(204,0,0,0.28)' : 'none',
            }}>
              <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: active ? '700' : '400', letterSpacing: '0.4px', textTransform: 'uppercase', opacity: active ? 1 : 0.5 }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Layout ────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const accessLevel = session?.user?.accessLevel ?? 'officer'
  const role = session?.user?.role ?? ''

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div style={{ display: 'flex', height: '100dvh', backgroundColor: '#0A0F1E', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ width: '232px', flexShrink: 0, height: '100%' }} className="hidden lg:block">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Mobile icon drawer overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex',
        }} onClick={() => setMobileOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <MobileSideDrawer pathname={pathname} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Desktop topbar */}
        <div className="hidden lg:flex glass-topbar" style={{
          height: '50px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 18px', flexShrink: 0, gap: '12px',
        }}>
          <ProfileMenu />
        </div>

        {/* Mobile topbar */}
        <div className="flex lg:hidden glass-topbar" style={{
          height: '50px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', flexShrink: 0, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(204,0,0,0.5), rgba(201,168,76,0.5), transparent)',
          }} />
          {/* Hamburger */}
          <button onClick={() => setMobileOpen(true)} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', color: '#9CA3AF', padding: '7px', borderRadius: '8px',
          }}>
            <Menu size={18} />
          </button>
          <div style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', letterSpacing: '3px', color: '#ffffff' }}>
            BNI <span style={{ color: '#C9A84C' }}>{session?.user?.chapterName?.toUpperCase() ?? 'CHAPTER'}</span>
          </div>
          <ProfileMenu />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px' }}>
          {children}
        </main>

        {/* Mobile bottom nav — flex child, never overlaps */}
        <MobileBottomNav pathname={pathname} accessLevel={accessLevel} role={role} />
      </div>
    </div>
  )
}
