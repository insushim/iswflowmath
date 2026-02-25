// Service Worker for 셈마루 PWA
const STATIC_CACHE = "semmaru-static-v1";
const API_CACHE = "semmaru-api-v1";
const EXPECTED_CACHES = [STATIC_CACHE, API_CACHE];

// 핵심 정적 에셋 프리캐시 목록
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];

// ── Install: 핵심 에셋 프리캐시 ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Precache failed for some assets:", err);
      });
    }),
  );
});

// ── Activate: 이전 버전 캐시 삭제 ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !EXPECTED_CACHES.includes(name))
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: 요청 유형별 캐시 전략 ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 같은 origin이 아니면 무시 (CDN 등 외부 리소스)
  if (url.origin !== self.location.origin) return;

  // API 요청: network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 페이지 내비게이션: network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // 정적 에셋 (js, css, images, fonts): cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 그 외: network-first
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// ── Message: SKIP_WAITING 처리 ──
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── 캐시 전략 함수들 ──

/**
 * Cache-first: 캐시에 있으면 캐시 반환, 없으면 네트워크 요청 후 캐시 저장
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Network-first: 네트워크 요청 시도, 실패 시 캐시 fallback
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // 내비게이션 요청이면 오프라인 폴백 페이지 시도
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * 정적 에셋 판별
 */
function isStaticAsset(pathname) {
  return (
    /\.(js|css|png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)$/i.test(
      pathname,
    ) || pathname.startsWith("/_next/static/")
  );
}
