import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: Number(process.env['PORT'] ?? 5173),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
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
