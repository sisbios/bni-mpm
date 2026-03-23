import { NextRequest, NextResponse } from 'next/server'

/**
 * Multi-tenant middleware
 *
 * PRIMARY DOMAIN: bnimalappuram.com
 *   www.bnimalappuram.com          → port 3006  (region admin)
 *   api.bnimalappuram.com          → port 3006  (BNI API)
 *   <chapter>.bnimalappuram.com    → port 3005  (chapter dashboard)
 *
 * BNI_APP_MODE=chapter  (port 3005)
 *   - Extracts chapter slug from subdomain → injects x-chapter-slug header
 *   - Hard-blocks /region/** → redirects to REGION_URL
 *
 * BNI_APP_MODE=region   (port 3006)
 *   - Never injects chapter slug
 *   - Hard-blocks /dashboard and /portal (chapter-only routes)
 *
 * All config is driven by env vars — no hardcoded domains in code.
 */

const APP_MODE = process.env.BNI_APP_MODE ?? 'chapter'
const DOMAIN_BASE = (process.env.DOMAIN_BASE ?? 'bnimalappuram.com').split(':')[0]
const REGION_URL = (process.env.REGION_URL ?? 'https://www.bnimalappuram.com').replace(/\/$/, '')

// These subdomains are never chapter slugs — they route to non-chapter services
const RESERVED = new Set([
  'www', 'api', 'admin', 'region', 'mail', 'smtp', 'ftp',
  // legacy sisbios.cloud reserved names (kept for safety)
  'bni', 'bnimpm', 'bniapi',
])

function getChapterSlug(host: string): string | null {
  if (APP_MODE === 'region') return null   // region container never injects slug
  const hostname = host.split(':')[0]
  if (!hostname.endsWith('.' + DOMAIN_BASE)) return null
  const sub = hostname.slice(0, -(DOMAIN_BASE.length + 1))
  if (!sub || RESERVED.has(sub)) return null
  return sub
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // ── CHAPTER CONTAINER: block /region/** ─────────────────────────────────────
  // If someone (e.g. a regionAdmin) lands on a chapter subdomain and gets
  // redirected to /region by page.tsx, this middleware catches it and sends
  // them to the real region admin URL before any page renders.
  if (APP_MODE === 'chapter' && pathname.startsWith('/region')) {
    const target = new URL(pathname + request.nextUrl.search, REGION_URL)
    return NextResponse.redirect(target, { status: 302 })
  }

  // ── REGION CONTAINER: block chapter-only paths ──────────────────────────────
  if (APP_MODE === 'region' && (pathname.startsWith('/dashboard') || pathname.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Inject chapter slug for multi-tenant routing ────────────────────────────
  const slug = getChapterSlug(host)
  if (!slug) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.set('x-chapter-slug', slug)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
