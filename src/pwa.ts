/**
 * Registers the service worker that makes Inkling work offline
 * (REQUIREMENTS §7). Production builds only: in development the dev server
 * should always serve fresh files.
 */
export function registerOffline(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    // New versions activate on the next load; there's nothing to lose mid-game
    // because saves live in IndexedDB.
    registerSW({ immediate: true });
  });
}
