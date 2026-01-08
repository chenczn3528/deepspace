/**
 * 缓存管理工具
 * 处理域名变更、缓存清理等操作
 */

const DOMAIN_KEY = 'ds_last_domain';

export function checkDomainChange() {
  const currentDomain = window.location.hostname;
  const lastDomain = localStorage.getItem(DOMAIN_KEY);

  if (lastDomain && lastDomain !== currentDomain) {
    console.log(`🔄 检测到域名变更: ${lastDomain} -> ${currentDomain}`);
    return true;
  }

  localStorage.setItem(DOMAIN_KEY, currentDomain);
  return false;
}

export async function clearAllCaches() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log(`🗑️ 清理缓存: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => {
          console.log(`🗑️ 注销 Service Worker: ${registration.scope}`);
          return registration.unregister();
        })
      );
    }

    console.log('✅ 所有缓存已清理');
    return true;
  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
    return false;
  }
}

export async function clearDomainCache(domain) {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const domainCaches = cacheNames.filter((name) => name.includes(domain));
      await Promise.all(domainCaches.map((name) => caches.delete(name)));
    }
    console.log(`✅ 已清理域名 ${domain} 的缓存`);
    return true;
  } catch (error) {
    console.error('❌ 清理域名缓存失败:', error);
    return false;
  }
}

export async function initCacheManager() {
  const domainChanged = checkDomainChange();

  if (domainChanged) {
    console.log('🔄 检测到域名变更，清理旧缓存...');
    await clearAllCaches();

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register(`service_worker.js?t=${Date.now()}`);
        console.log('✅ Service Worker 已重新注册');
      } catch (error) {
        console.error('❌ Service Worker 重新注册失败:', error);
      }
    }
  }
}

export async function forceRefresh() {
  await clearAllCaches();
  window.location.href = `${window.location.href.split('?')[0]}?t=${Date.now()}`;
}
