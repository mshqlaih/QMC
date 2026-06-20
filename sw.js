// خدمة عامل (Service Worker) لتخزين قشرة التطبيق وتشغيله دون اتصال بثبات.
// تعمل بنمط stale-while-revalidate: تُقدّم من الكاش فورًا ثم تُحدّث في الخلفية.
// لا تتدخّل في طلبات API الخارجية (oraclecloudapps) — يعالجها التطبيق عبر Hive.

const CACHE = 'qmc-shell-v1';
const CORE = [
  './',
  'index.html',
  'flutter_bootstrap.js',
  'flutter.js',
  'main.dart.js',
  'manifest.json',
  'favicon.png',
  'version.json',
  'icons/Icon-192.png',
  'icons/Icon-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // تجاهل الطلبات الخارجية (API) — تذهب للشبكة مباشرة ويعالج التطبيق انقطاعها
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    const fromNetwork = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    // cache-first مع تحديث في الخلفية
    if (cached) {
      fromNetwork; // يحدّث الكاش بصمت دون انتظار
      return cached;
    }

    const res = await fromNetwork;
    if (res) return res;

    // أوفلاين وبلا كاش: للتنقّل أعِد قشرة التطبيق
    if (req.mode === 'navigate') {
      const shell = await cache.match('index.html', { ignoreSearch: true }) ||
                    await cache.match('./', { ignoreSearch: true });
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
