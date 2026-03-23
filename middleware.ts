import { NextRequest, NextResponse } from 'next/server'

/**
 * Multi-tenant middleware — Phase 3
 *
 * Edge Runtime compatible — no Node.js modules, no DB calls, no auth().
 *
 * Sole responsibility: extract chapter slug from subdomain and inject it
 * as x-chapter-slug request header so all downstream handlers (API routes,
 * server components) can read the chapter context.
 *
 * Auth guard is handled at the layout level (Node.js runtime) — not here.
 *
 * Domain config is driven entirely by DOMAIN_BASE env var.
 * Future domain change → update env only, zero code changes.
 */

const DOMAIN_BASE = (process.env.DOMAIN_BASE ?? 'bni.sisbios.cloud').split(':')[0]

function getSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]
  if (!hostname.endsWith('.' + DOMAIN_BASE)) return null
  const sub = hostname.slice(0, -(DOMAIN_BASE.length + 1))
  // Reserved subdomains — no chapter context
  const RESERVED = new Set(['www', 'bni', 'region', 'admin', 'api'])
  if (!sub || RESERVED.has(sub)) return null
  return sub
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const slug = getSubdomain(host)

  if (!slug) return NextResponse.next()

  const headers = new Headers(request.headers)
  headers.set('x-chapter-slug', slug)

  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
