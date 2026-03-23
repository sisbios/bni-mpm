import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Multi-tenant middleware — Phase 3
 *
 * Combines:
 *  1. Auth guard (redirect to /login if unauthenticated)
 *  2. Role-based routing (members → /portal, others → /dashboard)
 *  3. Chapter slug injection via x-chapter-slug header (Edge-safe, no DB call)
 *
 * Domain config driven by DOMAIN_BASE env var — zero code changes needed
 * when the domain changes in future.
 */

const DOMAIN_BASE = (process.env.DOMAIN_BASE ?? 'bni.sisbios.cloud').split(':')[0]

function getSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]
  if (!hostname.endsWith('.' + DOMAIN_BASE)) return null
  const sub = hostname.slice(0, -(DOMAIN_BASE.length + 1))
  if (!sub || sub === 'www') return null
  return sub
}

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/manifest.json',
  '/sw.js',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)) ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webmanifest')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // ── 1. Inject chapter slug (Edge-safe, no DB) ──────────────────────────────
  const slug = getSubdomain(host)
  const requestHeaders = new Headers(request.headers)
  if (slug) requestHeaders.set('x-chapter-slug', slug)

  // ── 2. Allow public paths through ─────────────────────────────────────────
  if (isPublic(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── 3. Auth guard ──────────────────────────────────────────────────────────
  const session = await auth()

  if (pathname === '/') {
    if (!session) return NextResponse.redirect(new URL('/login', request.url))
    if (session.user.role === 'member') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Members cannot access /dashboard
  if (pathname.startsWith('/dashboard') && session.user.role === 'member') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|manifest\\.json|sw\\.js|icons\\/).*)',
  ],
}
