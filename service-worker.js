const CACHE_NAME = "ctc-pwa-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./logic.js",
  "./TelegraphBook.js",
  "./manifest.json"
];

// 安装阶段：缓存核心文件，并立即接管
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// 激活阶段：清理旧缓存，并立即控制已打开的页面
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 拦截请求：network-first，确保正常刷新能拿到最新资源；离线时回退缓存
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功拿到网络响应：缓存一份副本再返回
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => {
        // 网络失败（离线）：回退到缓存
        return caches.match(event.request);
      })
  );
});
