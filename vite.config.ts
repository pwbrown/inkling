import { readFileSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// `base` must match the deploy path (REQUIREMENTS §12). The deploy workflow
// can set INKY_KEYS_BASE (e.g. /inky-keys/ for a GitHub Pages project URL);
// the live site at inkykeys.com and local builds use `/`.
const base = process.env.INKY_KEYS_BASE ?? '/';

// The game shows its version on the About page (src/version.ts).
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
        name: 'Inky Keys',
        short_name: 'Inky Keys',
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
