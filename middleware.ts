import { NextRequest, NextResponse } from 'next/server'

/**
 * Multi-tenant middleware — Phase 3+
 *
 * Edge Runtime compatible — no Node.js modules, no DB calls, no auth().
 *
 * BNI_APP_MODE=chapter  → extract chapter slug from subdomain, inject x-chapter-slug
 * BNI_APP_MODE=region   → never inject chapter slug (regional admin container)
 *
 * Domain config is driven entirely by DOMAIN_BASE env var.
 */

const APP_MODE = process.env.BNI_APP_MODE ?? 'chapter'
const DOMAIN_BASE = (process.env.DOMAIN_BASE ?? 'sisbios.cloud').split(':')[0]

// Reserved subdomains that are never chapter slugs
const RESERVED = new Set(['www', 'bni', 'bnimpm', 'region', 'admin', 'api'])

function getSubdomain(host: string): string | null {
  if (APP_MODE === 'region') return null
  const hostname = host.split(':')[0]
  if (!hostname.endsWith('.' + DOMAIN_BASE)) return null
  const sub = hostname.slice(0, -(DOMAIN_BASE.length + 1))
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
