import React, { useEffect, useRef, useState } from 'react';
import { Asset } from './Asset.jsx';
import { useAssetLoader } from '../hooks/useAssetLoader';

const DrawAnimationCards = ({ isFiveStar, onAnimationEnd, onSkip, isSingleDraw, fontsize, globalVolume }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);
  const { loadAsset } = useAssetLoader();

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    onAnimationEnd();
  };

  const handleSkip = () => {
    setIsSkipped(true);
    onSkip?.(true);
    setVideoDuration(0.1);
    onAnimationEnd();
  };

  useEffect(() => {
    const playMedia = async () => {
      try {
        // 加载视频
        const videoFileName = isFiveStar ? 'gold_card.mp4' : 'no_gold_card.mp4';
        const videoUrl = await loadAsset('video', videoFileName);
        
        // 加载音频
        const audioFileName = isFiveStar ? '出金.mp3' : '不出金.mp3';
        const audioUrl = await loadAsset('audio', audioFileName);
        
        if (videoRef.current && audioRef.current) {
          // 设置视频源
          if (videoRef.current.src !== videoUrl) {
            videoRef.current.src = videoUrl;
          }
          
          // 设置音频源
          if (audioRef.current.src !== audioUrl) {
            audioRef.current.src = audioUrl;
          }
          
          // 为音频应用增益
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
              try { await ctx.resume(); } catch {}
            }
            
            // 获取增益设置
            let sfxGain = 1;
            try {
              const saved = localStorage.getItem('sfxGain');
              if (saved) {
                const parsed = parseFloat(saved);
                if (!Number.isNaN(parsed) && parsed > 0) sfxGain = parsed;
              }
            } catch {}
            
            const source = ctx.createMediaElementSource(audioRef.current);
            const gainNode = ctx.createGain();
            gainNode.gain.value = sfxGain;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
          } catch (e) {
            // 忽略增益管线错误，保底直接播放
          }
          
          // 播放媒体
          await videoRef.current.play();
          await audioRef.current.play();
        }
      } catch (error) {
        console.warn('媒体播放失败:', error);
      }
    };

    playMedia();
  }, [isFiveStar, loadAsset]);

  useEffect(() => {
    if (videoDuration > 0) {
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, videoDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [videoDuration, onAnimationEnd]);

  return (
    <div className="absolute z-50 w-full h-full flex items-center justify-center animate-fade-in">
      <div className="relative w-full h-full" style={{ overflow: 'hidden' }}>
        {!isSingleDraw && (
            <button
                className="absolute z-50"
                onClick={handleSkip}
                style={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  fontSize: `${fontsize * 1.2}px`,
                  bottom: `${fontsize * 1.2}px`,
                  right: `${fontsize * 1.2}px`,
                }}
            >
              跳过
            </button>
        )}

        {/* 视频元素 */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={handleVideoLoaded}
          onEnded={handleVideoEnded}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
        />

        {/* 音频元素 */}
        <audio
          ref={audioRef}
          autoPlay
          loop
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default DrawAnimationCards;
