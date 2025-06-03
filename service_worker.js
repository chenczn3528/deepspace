const CACHE_NAME = 'deepspace-cache-v5';
const FILES_TO_CACHE = [
  '/deepspace/videos/gold_card.MP4',
  '/deepspace/videos/no_gold_card.mp4',
  '/deepspace/videos/夏以昼金卡.mp4',
  '/deepspace/videos/开屏动画.mp4',
  '/deepspace/videos/沈星回金卡.mp4',
  '/deepspace/videos/祁煜金卡.mp4',
  '/deepspace/videos/秦彻金卡.mp4',
  '/deepspace/videos/黎深金卡.mp4',
  '/deepspace/audios/不出金.mp3',
  '/deepspace/audios/出金.mp3',
  '/deepspace/audios/切换音效.mp3',
  '/deepspace/audios/展示结算.mp3',
  '/deepspace/audios/时空引力.mp3',
  '/deepspace/images/结算背景.jpg'
];

// 安装阶段：缓存资源，跳过等待
// self.addEventListener('install', (event) => {
//   self.skipWaiting();
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => {
//         console.log('[SW] Caching files:', FILES_TO_CACHE);
//         return cache.addAll(FILES_TO_CACHE);
//       })
//       .catch(err => console.error('[SW] Cache failed:', err))
//   );
// });
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const file of FILES_TO_CACHE) {
        try {
          const response = await fetch(file);
          if (!response.ok) throw new Error(`HTTP status ${response.status}`);
          await cache.put(file, response.clone());
          console.log('[SW] ✅ Cached:', file);
        } catch (err) {
          console.error('[SW] ❌ Failed to cache:', file, err);
        }
      }
    })()
  );
});

// 激活阶段：清除旧缓存，立即接管控制权
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keyList = await caches.keys();
      await Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// 拦截 fetch 请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 跳过来自 patchwiki 或其他外部源的请求
  if (url.origin !== self.location.origin) {
    return fetch(event.request); // 外部请求直接返回
  }

  // 处理缓存和其他逻辑
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 如果缓存中有，直接返回
        return cachedResponse;
      }

      // 否则从网络获取资源并缓存
      return fetch(event.request).then((response) => {
        // 确保只缓存完整的响应（状态码 200）
        if (response.status === 200) {
          // 只缓存静态资源
          if (event.request.url.includes('/images/') || event.request.url.includes('/videos/') || event.request.url.includes('/audios/')) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          }
        }
        return response; // 如果是部分响应或其他响应，直接返回，不缓存
      });
    })
  );
});