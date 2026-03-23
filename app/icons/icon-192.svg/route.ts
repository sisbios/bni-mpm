import { NextResponse } from 'next/server'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
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
  <rect width="192" height="192" rx="32" fill="url(#bg)"/>
  <rect x="28" y="24" width="136" height="92" rx="16" fill="url(#red)"/>
  <text x="96" y="90" font-family="Arial Black, Arial, sans-serif" font-size="44" font-weight="900" fill="white" text-anchor="middle" letter-spacing="2">BNI</text>
  <text x="96" y="158" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#C9A84C" text-anchor="middle" letter-spacing="5">OSCAR</text>
</svg>`

export function GET() {
  return new NextResponse(SVG, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
