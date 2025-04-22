import React, { useEffect, useState } from 'react';
import VideoWithAudio from './VideoWithAudio.jsx';

const DrawAnimationCards = ({ isFiveStar, onAnimationEnd, cards }) => {
  console.log('DrawAnimationCards props:', { isFiveStar, cards });

  // 用来控制视频播放时长
  const [videoDuration, setVideoDuration] = useState(0);

  // 获取视频时长的处理函数
  const handleVideoLoaded = (e) => {
    setVideoDuration(e.target.duration);
    console.log('视频时长：', e.target.duration);
  };

  // 视频播放完毕时的处理函数
  const handleAnimationEnd = () => {
    onAnimationEnd(); // 调用父组件传递的结束回调
  };

  useEffect(() => {
    if (videoDuration > 0) {
      const timer = setTimeout(() => {
        handleAnimationEnd(); // 使用视频时长作为动画持续时间
      }, videoDuration * 1000); // 乘以1000转换为毫秒

      return () => clearTimeout(timer); // 清理定时器
    }
  }, [videoDuration, handleAnimationEnd]);


  return (
    <div className="fixed inset-0 z-50 w-screen h-screen items-center justify-center animate-fade-in">
      <VideoWithAudio
        isFiveStar={isFiveStar} // 直接传递是否是五星卡片的标志
        setVideoPlayed={setVideoDuration} // 设置视频时长状态
        onAnimationEnd={handleAnimationEnd} // 播放结束时的回调
      />


    </div>
  );
};

export default DrawAnimationCards;