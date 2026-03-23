import { NextRequest, NextResponse } from 'next/server'

/**
 * Multi-tenant middleware
 *
 * BNI_APP_MODE=chapter  → extract chapter slug from subdomain, inject x-chapter-slug
 *                          Block /region routes → redirect to REGION_URL
 * BNI_APP_MODE=region   → never inject chapter slug
 *                          Block /dashboard and /portal routes (chapter-only)
 *
 * Domain config is driven entirely by DOMAIN_BASE env var.
 * REGION_URL env var points to the region admin container URL.
 */

const APP_MODE = process.env.BNI_APP_MODE ?? 'chapter'
const DOMAIN_BASE = (process.env.DOMAIN_BASE ?? 'sisbios.cloud').split(':')[0]
const REGION_URL = (process.env.REGION_URL ?? 'https://bnimpm.sisbios.cloud').replace(/\/$/, '')

// Reserved subdomains that are never chapter slugs
const RESERVED = new Set(['www', 'bni', 'bnimpm', 'region', 'admin', 'api', 'bniapi'])

function getSubdomain(host: string): string | null {
  if (APP_MODE === 'region') return null
  const hostname = host.split(':')[0]
  if (!hostname.endsWith('.' + DOMAIN_BASE)) return null
  const sub = hostname.slice(0, -(DOMAIN_BASE.length + 1))
  if (!sub || RESERVED.has(sub)) return null
  return sub
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') ?? ''

  // CHAPTER CONTAINER: hard-block /region/** — redirect to the region admin URL.
  // This prevents regionAdmin users from accidentally using the region dashboard
  // through a chapter subdomain, regardless of how they got there.
  if (APP_MODE === 'chapter' && pathname.startsWith('/region')) {
    const target = new URL(pathname + request.nextUrl.search, REGION_URL)
    return NextResponse.redirect(target, { status: 302 })
  }

  // REGION CONTAINER: block chapter-only paths
  if (APP_MODE === 'region' && (pathname.startsWith('/dashboard') || pathname.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Inject x-chapter-slug header for chapter container
  const slug = getSubdomain(host)
  if (!slug) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.set('x-chapter-slug', slug)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
