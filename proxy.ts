import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes (auth-free)
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webmanifest')
  ) {
    return NextResponse.next()
  }

  // Redirect root
  if (pathname === '/') {
    if (!session) return NextResponse.redirect(new URL('/login', request.url))
    if (session.user.role === 'member') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Require auth for everything else
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Members cannot access /dashboard
  if (pathname.startsWith('/dashboard') && session.user.role === 'member') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|manifest\\.json|sw\\.js|icons\\/).*)',
  ],
}
