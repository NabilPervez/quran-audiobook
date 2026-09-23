import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'The Sacred Stream',
        short_name: 'Sacred Stream',
        description: 'The Quran in English, narrated. Listen, read along, and pick up where you left off.',
        theme_color: '#131313',
        background_color: '#131313',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Audio is streamed with Range requests. Only full (200) responses are
            // cacheable, and the range plugin serves slices from them for seeking.
            urlPattern: /\/audio\/.+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 114, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Fonts ship many unicode-range subsets; cache only the ones the browser asks for.
            urlPattern: /\/assets\/.+\.woff2$/,
            handler: 'CacheFirst',
            options: { cacheName: 'font-cache', expiration: { maxEntries: 30 } },
          },
          {
            urlPattern: /\/data\/text\/\d{3}\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'text-cache', expiration: { maxEntries: 120 } },
          },
        ],
      },
    }),
  ],
})
