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
  console.log('[Service Worker] Fetching:', event.request.url); // 打印请求的 URL
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 如果缓存中有该资源，直接返回缓存的资源
        console.log('[Service Worker] Returning cached resource:', event.request.url);
        return cachedResponse;
      }
      // 如果缓存没有，尝试从网络获取资源
      return fetch(event.request).then((response) => {
        // 只缓存图片、视频和音频等静态资源
        if (event.request.url.includes('/videos/') ||
            event.request.url.includes('/audios/') ||
            event.request.url.includes('/images/')) {
          return caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching new resource:', event.request.url);
            cache.put(event.request, response.clone());  // 缓存新请求的资源
            return response;
          }).catch((error) => {
            console.error('[Service Worker] Error caching new resource:', event.request.url, error);
            return response;
          });
        }
        return response;
      }).catch((error) => {
        console.error('[Service Worker] Error fetching resource:', event.request.url, error);
        return error; // 返回错误
      });
    })
  );
});
