import React, { useState, useEffect, useRef } from 'react';
import { useAssetLoader } from '../hooks/useAssetLoader';

export function Asset({ src, type, alt, refreshKey, volume, gain, ...props }) {
  const { loadAsset } = useAssetLoader();
  const [assetSrc, setAssetSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const mediaRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

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

  // 在媒体元素就绪后应用音量（针对 audio/video）
  useEffect(() => {
    if (!mediaRef.current) return;
    if (typeof volume === 'number' && volume >= 0.5 && volume <= 10) {
      try { mediaRef.current.volume = Math.min(volume, 1); } catch {}
    }
  }, [volume, assetSrc]);

  // 可选：通过 WebAudio 提升增益（允许 >1，实现“120%”等）
  useEffect(() => {
    const mediaEl = mediaRef.current;
    if (!mediaEl || (type !== 'audio' && type !== 'video')) return;

    // 如果volume > 1，则使用volume作为gain
    const effectiveGain = (typeof volume === 'number' && volume > 1) ? volume : gain;
    
    // 若未指定增益或增益<=1，则不走音频管线
    if (!(typeof effectiveGain === 'number') || effectiveGain <= 1) {
      return;
    }

    // iOS 等需要在用户交互后 resume，这里在 play 时确保 resume
    const ensureContext = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      } catch {}
    };

    const setupPipeline = () => {
      try {
        ensureContext();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        // MediaElementSource 只能绑定一次，重复绑定会抛错
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = ctx.createMediaElementSource(mediaEl);
        }
        if (!gainNodeRef.current) {
          gainNodeRef.current = ctx.createGain();
        }
        gainNodeRef.current.gain.value = effectiveGain;

        // 连接：source -> gain -> destination
        try { sourceNodeRef.current.disconnect(); } catch {}
        try { gainNodeRef.current.disconnect(); } catch {}
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);
      } catch (e) {
        // 忽略管线错误，保底仍可直接播放
      }
    };

    // 初次尝试建立管线
    setupPipeline();

    // 播放时再确保一次（处理自动暂停/延迟 resume）
    const onPlay = () => {
      ensureContext();
      setupPipeline();
    };
    mediaEl.addEventListener('play', onPlay);

    return () => {
      mediaEl.removeEventListener('play', onPlay);
      // 不在这里关闭全局 AudioContext，以复用；只断开节点
      try { sourceNodeRef.current && sourceNodeRef.current.disconnect(); } catch {}
      try { gainNodeRef.current && gainNodeRef.current.disconnect(); } catch {}
    };
  }, [gain, volume, type, assetSrc]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!assetSrc) {
    return <div style={{ fontSize: '14px', color: '#9ca3af' }}>未缓存</div>;
  }

  switch (type) {
    case 'video':
      return <video ref={mediaRef} src={assetSrc} {...props} />;
    case 'audio':
      return <audio ref={mediaRef} src={assetSrc} {...props} />;
    case 'image':
      return <img src={assetSrc} alt={alt} {...props} />;
    default:
      return <div>Unsupported asset type: {type}</div>;
  }
}
