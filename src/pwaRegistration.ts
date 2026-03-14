export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      if (!import.meta.env.PROD) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }

        console.log('[PWA] Development mode: service workers and caches cleared');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered');

      // Check for updates immediately
      registration.update();

      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
        console.log('[PWA] Checking for updates...');
      }, 60 * 1000);

      // When a new SW is found and installed
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        console.log('[PWA] New version detected, installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New version available - tell it to activate immediately
              console.log('[PWA] New version ready, activating...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            } else {
              console.log('[PWA] App cached for offline use');
            }
          }
        });
      });

      // When the new SW takes control, reload to get latest version
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('[PWA] New version activated, reloading...');
        window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Registration failed:', error);
    }
  });
}
