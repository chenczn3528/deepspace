import { useState, useCallback, useEffect } from 'react';
import { useAssetStorage } from './useAssetStorage';

export function useAssetLoader() {
  const { getAsset, getAssetData } = useAssetStorage();
  const [loadedAssets, setLoadedAssets] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 自动获取素材大小并加载
  const loadAsset = useCallback(async (type, fileName) => {
    try {
      // 先尝试从网络获取文件信息来确定大小
      const networkPath = `/${type === 'image' ? 'images' : type + 's'}/${fileName}`;
      const response = await fetch(networkPath, { method: 'HEAD' });
      
      if (response.ok) {
        const size = parseInt(response.headers.get('content-length') || '0');
        const assetId = `${type}_${fileName}_${size}`;
        
        // 尝试从 IndexedDB 获取
        const asset = await getAsset(assetId);
        if (asset && asset.status === 'completed') {
          const assetData = await getAssetData(assetId);
          if (assetData) {
            const url = URL.createObjectURL(assetData);
            setLoadedAssets(prev => new Map(prev).set(assetId, url));
            return url;
          }
        }
      }
      
      // 如果本地没有或获取失败，返回原始路径
      return networkPath;
    } catch (error) {
      console.error(`Failed to load asset ${fileName}:`, error);
      // 返回原始路径作为后备
      return `/${type === 'image' ? 'images' : type + 's'}/${fileName}`;
    }
  }, [getAsset, getAssetData]);

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

  // 清理 URL 对象
  const cleanup = useCallback(() => {
    loadedAssets.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setLoadedAssets(new Map());
  }, [loadedAssets]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    loadAsset,
    loadAssets,
    loadedAssets,
    loading,
    error,
    cleanup
  };
}
