import React, { useState, useEffect } from 'react';
import { useAssetLoader } from '../hooks/useAssetLoader';

export function Asset({ src, type, alt, refreshKey, ...props }) {
  const { loadAsset } = useAssetLoader();
  const [assetSrc, setAssetSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssetData = async () => {
      try {
        setLoading(true);
        // 仅使用本地缓存，未命中则不加载网络，避免首屏网络请求
        const cachedUrl = await loadAsset(type, src, { onlyCached: true });
        setAssetSrc(cachedUrl || null);
      } catch (error) {
        console.error('Failed to load asset:', error);
        setAssetSrc(null);
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      loadAssetData();
    }

    // 局部清理：当 assetSrc 是 blob: 时，在此组件卸载或依赖变更时回收
    return () => {
      if (typeof assetSrc === 'string' && assetSrc.startsWith('blob:')) {
        try { URL.revokeObjectURL(assetSrc); } catch {}
      }
    };
  }, [src, type, loadAsset, refreshKey]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!assetSrc) {
    return <div style={{ fontSize: '14px', color: '#9ca3af' }}>未缓存</div>;
  }

  switch (type) {
    case 'video':
      return <video src={assetSrc} {...props} />;
    case 'audio':
      return <audio src={assetSrc} {...props} />;
    case 'image':
      return <img src={assetSrc} alt={alt} {...props} />;
    default:
      return <div>Unsupported asset type: {type}</div>;
  }
}
