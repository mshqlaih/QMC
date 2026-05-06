'use strict';

const CACHE_NAME = 'qmc-app-cache-v2.2';

const CORE_ASSETS = [
  './',
  './index.html',
  './main.dart.js',
  './flutter.js',
  './flutter_bootstrap.js',
  './favicon.png',
  './manifest.json',
  './version.json',
  './assets/AssetManifest.bin.json',
  './assets/FontManifest.json',
  './assets/fonts/MaterialIcons-Regular.otf',
  './icons/Icon-192.png',
  './icons/Icon-512.png',
  './icons/Icon-maskable-192.png',
  './icons/Icon-maskable-512.png',
  './assets/assets/fonts/Tajawal-Regular.ttf',
];

function supportsCanvasKit() {
  try {
    const wasm = (typeof WebAssembly === "object");
    const canvas = new OffscreenCanvas(1,1);
    const webgl = !!window.WebGLRenderingContext &&
                  (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    return wasm && webgl;
  } catch (e) {
    return false;
  }
}

function isOldDevice() {
  return true; 
  const ua = navigator.userAgent.toLowerCase();
  
  // فحص الذاكرة العشوائية (RAM) - إذا كانت أقل من 4 جيجا يعتبر الجهاز ضعيفاً
  const isLowRam = navigator.deviceMemory && navigator.deviceMemory < 4;
  
  // فحص إصدارات الأندرويد القديمة (كروم أقل من 70)
  const oldAndroid = ua.includes("android") && ua.match(/chrome\/([0-9]+)/)?.[1] < 70;
  
  // فحص إصدارات الـ iOS القديمة (أقل من إصدار 12)
  const oldIos = ua.includes("iphone os") && ua.match(/os ([0-9]+)/)?.[1] < 12;
  
  return oldAndroid || oldIos || isLowRam;
}

// إضافة CanvasKit فقط إذا الجهاز حديث
if (supportsCanvasKit() && !isOldDevice()) {
  CORE_ASSETS.push(
    './canvaskit/canvaskit.js',
    './canvaskit/canvaskit.wasm',
    './canvaskit/chromium/canvaskit.js',
    './canvaskit/chromium/canvaskit.wasm'
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (isOldDevice() && requestUrl.pathname.includes('canvaskit')) {
    return; // سيؤدي هذا لفشل الطلب ومنع التحميل
  }
  if (requestUrl.pathname.startsWith('/qmc/')) {
    // network-first للـ API
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // cache-first للملفات الثابتة
    event.respondWith(
      caches.match(event.request).then((response) =>
        response ||
        fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
      )
    );
  }
});
