// مُعطّل: SW مخصّص أُلغي (تجربة iOS 17 أثبتت عدم موثوقية offline للـ PWA).
// هذا الملف الآن يُلغي نفسه ويُنظّف أي كاش قديم خزّناه، لإعادة الأجهزة لوضع سليم.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => { if (c.navigate) c.navigate(c.url); });
    } catch (e) {}
  })());
});
