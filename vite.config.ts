import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// `base` must match the deploy path (REQUIREMENTS §12). The deploy workflow
// sets INKLING_BASE=/<repo>/ for GitHub Pages; locally it's `/`.
const base = process.env.INKLING_BASE ?? '/';

export default defineConfig({
  base,
  build: {
    target: 'es2022',
    sourcemap: true,
    // The bundled word pack is one ~500 kB chunk (~165 kB gzipped), loaded lazily.
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    // Offline play (REQUIREMENTS §7): precache every built asset, including
    // the word pack, so the game works with no connection after first load.
    VitePWA({
      // main.ts registers the service worker itself (src/pwa.ts).
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Inkling',
        short_name: 'Inkling',
        description: 'An offline typing game where you choose which keys to practice.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#2b2622',
        theme_color: '#1f2a44',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg,webmanifest,woff2}'],
        // No runtime caching of other origins: the game never calls them.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
