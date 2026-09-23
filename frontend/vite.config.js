import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Keep this if you want to control updates manually
      injectRegister: null,   // We will register it manually in main.jsx
      devOptions: { 
        enabled: false // Keep false. We will use `npm run build && npm run preview` to test SW
      },
      includeAssets: [
        'offline.html',
        'icon-192.png',
        'icon-512.png',
      ],
      manifest: {
        name: 'ORCA - Marine Intelligence Platform',
        short_name: 'ORCA',
        description: 'Marine intelligence, weather, ocean, PFZ, routing and alerts for coastal operators.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0a192f',
        background_color: '#020617',
        lang: 'en',
        dir: 'ltr',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Ensure sw.js and the workbox runtime files are generated
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'orca-fonts-stylesheets-v1',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'orca-fonts-webfonts-v1',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/(map\/layers|geospatial\/zones|risk\/thresholds|agents\/architecture|routes\/waypoints|sources)/,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'orca-public-api-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  cacheWillUpdate: async ({ request }) => {
                    if (request.headers.get('Authorization')) return null;
                    return undefined;
                  },
                },
              ],
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});