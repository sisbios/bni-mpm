const CACHE_NAME = 'bni-oscar-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/manifest.json']).catch(() => {})
    )
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      ),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET and API requests (always fresh)
  if (request.method !== 'GET') return
  if (request.url.includes('/api/')) return
  if (request.url.includes('/_next/webpack-hmr')) return

  // Cache-first for static assets (_next/static)
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Network-first for pages and other resources
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
