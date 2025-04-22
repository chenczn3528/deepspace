import { useEffect, useRef } from 'react';

const VideoPreloader = () => {
  const videoRefs = useRef([]);

  useEffect(() => {
    const videoUrls = [
        'videos/开屏动画.mp4',
        'videos/no_gold_card.mp4',
        'videos/gold_card.MP4',
        'videos/夏以昼金卡.mp4',
        'videos/沈星回金卡.mp4',
        'videos/祁煜金卡.mp4',
        'videos/秦彻金卡.mp4',
        'videos/黎深金卡.mp4',
    ];

    videoUrls.forEach((url, index) => {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      video.style.display = 'none';
      document.body.appendChild(video);
      videoRefs.current.push(video);
    });

    return () => {
      videoRefs.current.forEach(video => {
        document.body.removeChild(video);
      });
      videoRefs.current = [];
    };
  }, []);

  return null; // 不渲染任何东西
};

export default VideoPreloader;
