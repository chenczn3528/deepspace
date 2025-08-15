import React, { useState, useEffect } from 'react';
import { useAssetLoader } from '../hooks/useAssetLoader';

export function Asset({ src, type, alt, ...props }) {
  const { loadAsset } = useAssetLoader();
  const [assetSrc, setAssetSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssetData = async () => {
      try {
        setLoading(true);
        const url = await loadAsset(type, src);
        setAssetSrc(url);
      } catch (error) {
        console.error('Failed to load asset:', error);
        // 使用原始路径作为后备
        setAssetSrc(`/${type === 'image' ? 'images' : type + 's'}/${src}`);
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      loadAssetData();
    }
  }, [src, type, loadAsset]);

  if (loading) {
    return <div>加载中...</div>;
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
