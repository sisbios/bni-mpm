'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Trophy,
  X,
  ChevronRight,
  Mic2,
  UserCheck,
  Menu,
} from 'lucide-react'
import ProfileDropdown from './ProfileDropdown'
import ProfileCompleteness from './ProfileCompleteness'

// All nav items (sidebar shows all; bottom nav shows first 5)
const navItems = [
  { href: '/portal', icon: LayoutDashboard, label: 'My Dashboard', short: 'Home', exact: true },
  { href: '/portal/calendar', icon: Calendar, label: 'Chapter Calendar', short: 'Calendar' },
  { href: '/portal/members', icon: Users, label: 'Chapter Members', short: 'Members' },
  { href: '/portal/presentations', icon: Mic2, label: 'Presentations', short: 'Talks' },
  { href: '/portal/achievements', icon: Trophy, label: 'My Achievements', short: 'Awards' },
  { href: '/portal/tasks', icon: ClipboardList, label: 'My Tasks', short: 'Tasks' },
  { href: '/portal/contacts', icon: UserCheck, label: 'My Contacts', short: 'Contacts' },
]

// Bottom nav: first 5 items only
const bottomNavItems = navItems.slice(0, 5)

function isActive(item: { href: string; exact?: boolean }, pathname: string) {
  if (item.exact) return pathname === item.href
  return pathname.startsWith(item.href)
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <div className="glass-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #C9A84C, #CC0000)', flexShrink: 0 }} />

      {/* Logo */}
      <div
        style={{
          padding: '22px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #CC0000, #880000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-bebas), sans-serif',
            fontSize: '17px',
            color: '#fff',
            letterSpacing: '1px',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(204,0,0,0.35)',
          }}
        >
          BNI
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-bebas), sans-serif',
              fontSize: '20px',
              color: '#C9A84C',
              letterSpacing: '3px',
              lineHeight: 1.1,
            }}
          >
            OSCAR
          </div>
          <div style={{ fontSize: '9px', color: '#8B95A3', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Member Portal
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              color: '#6B7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = isActive(item, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: active ? '#ffffff' : '#9CA3AF',
                background: active ? 'rgba(201,168,76,0.11)' : 'transparent',
                border: active ? '1px solid rgba(201,168,76,0.22)' : '1px solid transparent',
                backdropFilter: active ? 'blur(8px)' : 'none',
                transition: 'all 0.15s',
                fontSize: '13.5px',
                fontWeight: active ? '600' : '400',
              }}
            >
              <item.icon size={17} style={{ color: active ? '#C9A84C' : '#6B7280', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={13} style={{ color: '#C9A84C', opacity: 0.7 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Profile completeness */}
      <ProfileCompleteness />
      <div style={{ height: '4px' }} />
    </div>
  )
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="lg:hidden glass-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {bottomNavItems.map((item) => {
        const active = isActive(item, pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 2px 12px',
              textDecoration: 'none',
              color: active ? '#C9A84C' : '#6B7280',
              transition: 'color 0.18s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              className="bottom-nav-pill"
              style={{
                background: active ? 'rgba(201,168,76,0.14)' : 'transparent',
                borderColor: active ? 'rgba(201,168,76,0.25)' : 'transparent',
                boxShadow: active ? '0 0 14px rgba(201,168,76,0.25)' : 'none',
              }}
            >
              <item.icon size={21} strokeWidth={active ? 2.2 : 1.8} />
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: active ? '700' : '400',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                opacity: active ? 1 : 0.55,
                transition: 'all 0.18s',
              }}
            >
              {item.short}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        backgroundColor: '#0A0F1E',
        overflow: 'hidden',
      }}
    >
      {/* Desktop sidebar */}
      <div style={{ width: '240px', flexShrink: 0, height: '100%' }} className="hidden lg:block">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{ width: '260px', height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Universal top bar — mobile: shows logo + profile; desktop: shows profile only */}
        <div
          className="glass-topbar"
          style={{
            height: '52px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0,
            position: 'relative',
            gap: '10px',
          }}
        >
          {/* Gradient line */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), rgba(204,0,0,0.5), transparent)',
            }}
          />

          {/* Left: hamburger (mobile) + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
                color: '#9CA3AF', cursor: 'pointer',
              }}
            >
              <Menu size={17} />
            </button>

            {/* Logo text — mobile only */}
            <div
              className="lg:hidden"
              style={{ fontFamily: 'var(--font-bebas), sans-serif', fontSize: '20px', letterSpacing: '3px', color: '#fff' }}
            >
              BNI <span style={{ color: '#C9A84C' }}>OSCAR</span>
            </div>
          </div>

          {/* Right: profile dropdown — always visible */}
          <ProfileDropdown />
        </div>

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px' }}
        >
          {children}
          {/* Bottom nav spacer — mobile only */}
          <div className="lg:hidden" style={{ height: '72px' }} />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav pathname={pathname} />
    </div>
  )
}
