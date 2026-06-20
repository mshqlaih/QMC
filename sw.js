self.__SW_VERSION__='2F5879685442';self.__SW_PRECACHE__=[".last_build_id","favicon.png","flutter.js","flutter_bootstrap.js","flutter_service_worker.js","index.html","main.dart.js","manifest.json","version.json","assets/AssetManifest.bin","assets/AssetManifest.bin.json","assets/FontManifest.json","assets/NOTICES","assets/assets/fonts/Tajawal-Regular.ttf","assets/assets/icon/Icon-1024.png","assets/fonts/MaterialIcons-Regular.otf","assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Brands-Regular-400.otf","assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Free-Regular-400.otf","assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Free-Solid-900.otf","assets/shaders/ink_sparkle.frag","assets/shaders/stretch_effect.frag","canvaskit/canvaskit.js","canvaskit/canvaskit.js.symbols","canvaskit/canvaskit.wasm","canvaskit/skwasm.js","canvaskit/skwasm.js.symbols","canvaskit/skwasm.wasm","canvaskit/skwasm_heavy.js","canvaskit/skwasm_heavy.js.symbols","canvaskit/skwasm_heavy.wasm","canvaskit/wimp.js","canvaskit/wimp.js.symbols","canvaskit/wimp.wasm","canvaskit/chromium/canvaskit.js","canvaskit/chromium/canvaskit.js.symbols","canvaskit/chromium/canvaskit.wasm","canvaskit/experimental_webparagraph/canvaskit.js","canvaskit/experimental_webparagraph/canvaskit.js.symbols","canvaskit/experimental_webparagraph/canvaskit.wasm","icons/Icon-192.png","icons/Icon-512.png","icons/Icon-maskable-192.png","icons/Icon-maskable-512.png"];
// ط®ط¯ظ…ط© ط¹ط§ظ…ظ„ (Service Worker) ظ„طھط´ط؛ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚ ط¯ظˆظ† ط§طھطµط§ظ„ ط¨ط«ط¨ط§طھ.
// ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ظƒط§ظ…ظ„ط© ظ„ظ…ظ„ظپط§طھ ط§ظ„ط¨ظ†ط§ط، + ط¥طµط¯ط§ط± ط§ظ„ظƒط§ط´ ظٹظڈط­ظ‚ظ†ط§ظ† ط¢ظ„ظٹظ‹ط§ ظ…ظ† ط³ظƒط±ط¨طھ ط§ظ„ظ†ط´ط±
// (self.__SW_PRECACHE__ / self.__SW_VERSION__) â€” ط§ظ†ط¸ط± deploy_web.ps1.

const VERSION = (self.__SW_VERSION__ || 'dev');
const CACHE = 'qmc-shell-' + VERSION;
const FILES = (self.__SW_PRECACHE__ && self.__SW_PRECACHE__.length)
  ? self.__SW_PRECACHE__
  : ['./', 'index.html', 'flutter_bootstrap.js', 'flutter.js', 'main.dart.js'];

// طھط®ط²ظٹظ† ظ…ط³ط¨ظ‚ ظ…طھط³ط§ظ…ط­: ظپط´ظ„ ط¹ظ†طµط± ظ„ط§ ظٹظڈظپط´ظ„ ط§ظ„ط¨ط§ظ‚ظٹ (ط¹ظƒط³ cache.addAll ط§ظ„ط°ط±ظ‘ظٹ)
async function precache(cache) {
  await Promise.allSettled(FILES.map(async (url) => {
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (res && res.ok) await cache.put(url, res);
    } catch (e) {}
  }));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(precache));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // ط§ط­ط°ظپ ظƒظ„ ط§ظ„ظƒط§ط´ط§طھ ط§ظ„ظ‚ط¯ظٹظ…ط© (ط¥طµط¯ط§ط±ط§طھ ط³ط§ط¨ظ‚ط©)
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

  // ط·ظ„ط¨ط§طھ API ط§ظ„ط®ط§ط±ط¬ظٹط© طھط°ظ‡ط¨ ظ„ظ„ط´ط¨ظƒط© ظ…ط¨ط§ط´ط±ط© (ظٹط¹ط§ظ„ط¬ ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ†ظ‚ط·ط§ط¹ظ‡ط§ ط¹ط¨ط± Hive)
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    const net = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    // cache-first ظ…ط¹ طھط­ط¯ظٹط« طµط§ظ…طھ ظپظٹ ط§ظ„ط®ظ„ظپظٹط©
    if (cached) { net; return cached; }

    const res = await net;
    if (res) return res;

    // ط£ظˆظپظ„ط§ظٹظ† ظˆط¨ظ„ط§ ظƒط§ط´: ظ„ظ„طھظ†ظ‚ظ‘ظ„ ط£ط¹ظگط¯ ظ‚ط´ط±ط© ط§ظ„طھط·ط¨ظٹظ‚
    if (req.mode === 'navigate') {
      const shell = await cache.match('index.html', { ignoreSearch: true }) ||
                    await cache.match('./', { ignoreSearch: true });
      if (shell) return shell;
    }
    return new Response('', { status: 503, statusText: 'Offline' });
  })());
});

