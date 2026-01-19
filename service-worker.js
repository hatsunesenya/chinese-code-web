const CACHE_NAME = "ctc-pwa-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./logic.js",
  "./manifest.json"
];

// 安装阶段：缓存核心文件
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
});

// 拦截请求：优先缓存
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
