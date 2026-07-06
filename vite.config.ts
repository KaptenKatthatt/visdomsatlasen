import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: Number(process.env['PORT'] ?? 5173),
    // I utvecklingsläge proxas API:t till Node-servern (npm run dev:api).
    proxy: {
      '/api': {
        target: process.env['API_TARGET'] ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Låt navigeringsfallbacken (index.html) aldrig svara på API-anrop.
        navigateFallbackDenylist: [/^\/api\//],
        // Cacha bibliotekets API så hämtade texter kan läsas offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/library'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'library-api',
              expiration: { maxEntries: 8000, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Visdomsatlasen',
        short_name: 'Visdomsatlasen',
        description:
          'En stilla atlas över mänsklighetens visdom – texter, personer och traditioner att vandra fritt bland.',
        lang: 'sv',
        start_url: '/',
        display: 'standalone',
        background_color: '#ece4d2',
        theme_color: '#faf6ed',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
