import { useState, useCallback, useEffect } from 'react';
import { useAssetStorage } from './useAssetStorage';

export function useAssetLoader() {
  const { getAsset, getAssetData, getAssetByUrl } = useAssetStorage();
  const [loadedAssets, setLoadedAssets] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 自动获取素材大小并加载
  const loadAsset = useCallback(async (type, fileName, options = {}) => {
    const { onlyCached = false } = options;
    try {
      const networkPath = `/${type === 'image' ? 'images' : type + 's'}/${fileName}`;

      // 1) 先用 URL 索引尝试命中本地缓存
      const byUrl = await getAssetByUrl(networkPath);
      if (byUrl && byUrl.status === 'completed') {
        const blob = await getAssetData(byUrl.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setLoadedAssets(prev => new Map(prev).set(byUrl.id, url));
          return url;
        }
      }

      // 仅缓存模式：未命中则不走网络，直接返回 null
      if (onlyCached) {
        return null;
      }

      // 2) 再尝试 HEAD 拿 content-length，按 “名称+大小” 的 id 命中
      let size = 0;
      try {
        const headResp = await fetch(networkPath, { method: 'HEAD' });
        if (headResp.ok) {
          size = parseInt(headResp.headers.get('content-length') || '0', 10) || 0;
        }
      } catch {}

      if (size > 0) {
        const assetId = `${type}_${fileName}_${size}`;
        const byId = await getAsset(assetId);
        if (byId && byId.status === 'completed') {
          const blob = await getAssetData(assetId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            setLoadedAssets(prev => new Map(prev).set(assetId, url));
            return url;
          }
        }
      }

      // 3) 全部未命中则回退网络
      return networkPath;
    } catch (error) {
      console.error(`Failed to load asset ${fileName}:`, error);
      return `/${type === 'image' ? 'images' : type + 's'}/${fileName}`;
    }
  }, [getAsset, getAssetData, getAssetByUrl]);

  // 批量加载素材
  const loadAssets = useCallback(async (assetsList) => {
    setLoading(true);
    setError(null);
    
    try {
      const assetPromises = assetsList.map(({ type, fileName }) => 
        loadAsset(type, fileName)
      );
      
      const urls = await Promise.all(assetPromises);
      console.log('Assets loaded:', urls);
      
      return urls;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadAsset]);

  // 清理 URL 对象（改为仅手动调用，避免开发环境 StrictMode 二次卸载导致正在使用的 blob URL 被提前释放）
  const cleanup = useCallback(() => {
    loadedAssets.forEach(url => {
      if (typeof url === 'string' && url.startsWith('blob:')) {
        try { URL.revokeObjectURL(url); } catch {}
      }
    });
    setLoadedAssets(new Map());
  }, [loadedAssets]);

  return {
    loadAsset,
    loadAssets,
    loadedAssets,
    loading,
    error,
    cleanup
  };
}
