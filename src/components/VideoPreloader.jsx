import { useEffect, useRef } from 'react';

const VideoPreloader = () => {
  const videoRefs = useRef([]);

  useEffect(() => {
    const videoUrls = [
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/gold_card.MP4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/no_gold_card.mp4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E5%BC%80%E5%B1%8F%E5%8A%A8%E7%94%BB.mp4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E6%B2%88%E6%98%9F%E5%9B%9E%E9%87%91%E5%8D%A1.mp4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E9%BB%8E%E6%B7%B1%E9%87%91%E5%8D%A1.mp4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E7%A5%81%E7%85%9C%E9%87%91%E5%8D%A1.mp4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E7%A7%A6%E5%BD%BB%E9%87%91%E5%8D%A1.mp4',
        'https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E5%A4%8F%E4%BB%A5%E6%98%BC%E9%87%91%E5%8D%A1.mp4',
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
