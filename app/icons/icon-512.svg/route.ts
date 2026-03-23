import { NextResponse } from 'next/server'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0F1E"/>
      <stop offset="100%" style="stop-color:#0D1525"/>
    </linearGradient>
    <linearGradient id="red" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#CC0000"/>
      <stop offset="100%" style="stop-color:#990000"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <rect x="72" y="60" width="368" height="248" rx="40" fill="url(#red)"/>
  <text x="256" y="236" font-family="Arial Black, Arial, sans-serif" font-size="120" font-weight="900" fill="white" text-anchor="middle" letter-spacing="4">BNI</text>
  <text x="256" y="420" font-family="Arial Black, Arial, sans-serif" font-size="80" font-weight="900" fill="#C9A84C" text-anchor="middle" letter-spacing="12">OSCAR</text>
</svg>`

export function GET() {
  return new NextResponse(SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
