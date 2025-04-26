const CACHE_NAME = 'deepspace-cache-v1';

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

// 安装 Service Worker，缓存需要的资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching files:', FILES_TO_CACHE);
      return cache.addAll(FILES_TO_CACHE); // 缓存文件
    }).catch((error) => {
      console.error('[Service Worker] Caching failed:', error);
    })
  );
});

// 激活 Service Worker，删除旧的缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (!cacheWhitelist.includes(key)) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key); // 删除不需要的缓存
          }
        })
      )
    ).catch((error) => {
      console.error('[Service Worker] Error during activation:', error);
    })
  );

  self.clients.claim();  // 让 Service Worker 控制所有页面
});

// 处理 fetch 请求，优先从缓存中加载
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 跳过来自 patchwiki 或其他外部源的请求
  if (url.origin !== self.location.origin) {
    // 只要是外部请求，直接返回，不处理缓存
    return fetch(event.request);
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
        // 只缓存静态资源
        if (event.request.url.includes('/images/') || event.request.url.includes('/videos/') || event.request.url.includes('/audios/')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        }
        return response;
      });
    })
  );
});