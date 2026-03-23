import { NextResponse } from 'next/server'

export function GET() {
  const manifest = {
    name: 'BNI Oscar Chapter',
    short_name: 'BNI Oscar',
    description: 'Chapter Management System for BNI Oscar Chapter, Malappuram Region',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0F1E',
    theme_color: '#CC0000',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Admin Dashboard',
        url: '/dashboard',
        description: 'Chapter Admin Dashboard',
      },
      {
        name: 'Member Portal',
        url: '/portal',
        description: 'Member Portal',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
