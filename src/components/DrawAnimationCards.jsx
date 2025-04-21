import React, { useEffect, useState } from 'react';

const DrawAnimationCards = ({ isFiveStar, onAnimationEnd, cards }) => {
  console.log('DrawAnimationCards props:', { isFiveStar, cards });


  // 用来控制视频播放时长
  const [videoDuration, setVideoDuration] = useState(0);

  const handleVideoLoaded = (e) => {
    // 获取视频的时长
    setVideoDuration(e.target.duration);
    console.log('视频时长：', e.target.duration);
  };

  useEffect(() => {
    if (videoDuration > 0) {
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, videoDuration * 1000); // 使用视频时长作为动画持续时间

      return () => clearTimeout(timer); // 清理定时器
    }
  }, [onAnimationEnd, videoDuration]); // 依赖于视频时长



  return (
    <div className="fixed inset-0 z-50 w-screen h-screen items-center justify-center animate-fade-in">
      {isFiveStar ? (
          <video
              className="absolute top-0 left-0 w-full h-full object-cover"
          // className="rounded-xl shadow-lg h-full w-full fixed top-0 left-0 object-cover"
          onLoadedData={handleVideoLoaded} // 获取视频时长
          onEnded={onAnimationEnd} // 视频播放结束时触发
          autoPlay
          playsInline
          muted
          controls={false}>
          <source src="videos/gold_card.MP4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <video
            className="absolute top-0 left-0 w-full h-full object-cover"
          // className="rounded-xl shadow-lg h-full w-full fixed top-0 left-0 object-cover"
          onLoadedData={handleVideoLoaded} // 获取视频时长
          onEnded={onAnimationEnd} // 视频播放结束时触发
          autoPlay
          playsInline
          muted
          controls={false}>
          <source src="videos/no_gold_card.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        )}


    </div>
  );
};

export default DrawAnimationCards;