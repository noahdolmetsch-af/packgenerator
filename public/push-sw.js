/*
 * Erinnerungen aufs Handy (Web-Push, Noah 15.10.2026 «1a 2b 3a 4b 5a»): the service worker part,
 * loaded into the generated worker with importScripts (vite.config.js workbox.importScripts).
 * The server (api/push.js) sends { title, body, url, tag } encrypted for this phone; here it is shown,
 * and a tap opens the app at url (an address inside the app, «#/…»).
 */
self.addEventListener('push', (event) => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch {
    msg = { body: event.data ? event.data.text() : '' };
  }
  const base = self.registration.scope;
  event.waitUntil(
    self.registration.showNotification(msg.title || 'Pack Generator', {
      body: msg.body || '',
      tag: msg.tag || undefined,
      icon: `${base}icons/app-192.png`,
      badge: `${base}icons/app-192.png`,
      data: { url: typeof msg.url === 'string' && msg.url.startsWith('#/') ? msg.url : '#/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = `${self.registration.scope}${event.notification.data?.url ?? '#/'}`;
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const app = wins.find((w) => w.url.startsWith(self.registration.scope));
      if (app) {
        await app.focus();
        return app.navigate ? app.navigate(target) : null;
      }
      return self.clients.openWindow(target);
    })(),
  );
});
