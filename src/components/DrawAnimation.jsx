import React, { useEffect, useState } from 'react';

const DrawAnimation = ({ isFiveStar, onAnimationEnd, cards }) => {
  console.log('DrawAnimation props:', { isFiveStar, cards });

  // 用来控制视频播放时长
  const [videoDuration, setVideoDuration] = useState(0);

  const handleVideoLoaded = (e) => {
    // 获取视频的时长
    setVideoDuration(e.target.duration);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, videoDuration * 1000); // 使用视频时长作为动画持续时间

    return () => clearTimeout(timer);
  }, [onAnimationEnd, videoDuration]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center animate-fade-in">
      {isFiveStar ? (
        <video
          className="rounded-xl shadow-lg"
          width="300"
          height="auto"
          onLoadedData={handleVideoLoaded} // 获取视频时长
          onEnded={onAnimationEnd} // 视频播放结束时触发
          autoPlay
          muted
        >
          <source src="gold_card.MP4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <video
          className="rounded-xl shadow-lg"
          width="300"
          height="auto"
          onLoadedData={handleVideoLoaded} // 获取视频时长
          onEnded={onAnimationEnd} // 视频播放结束时触发
          autoPlay
          muted
        >
          <source src="gold_card.MP4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <div className="text-white text-2xl font-bold mb-6 border px-4 py-2 rounded-lg">
        共抽到 {cards?.length || 0} 张卡片
      </div>
    </div>
  );
};

export default DrawAnimation;
