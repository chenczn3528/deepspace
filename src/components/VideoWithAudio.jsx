import React, { useEffect, useRef } from 'react';

const VideoWithAudio = ({ isFiveStar, setVideoPlayed, onAnimationEnd }) => {
  const videoRef = useRef(null);  // 用来引用视频元素
  const audioRef = useRef(null);  // 用来引用音频元素

  // 获取视频时长的处理函数
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoPlayed(videoRef.current.duration);  // 设置视频时长
    }
  };

  // 视频播放结束时的处理函数
  const handleVideoEnded = () => {
    onAnimationEnd();  // 播放结束时触发的回调
  };

  // 每次 `isFiveStar` 变化时，播放对应的音频
  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.play();  // 播放视频
      audioRef.current.play();  // 播放音频
    }
  }, [isFiveStar]);  // 依赖于是否是五星卡片

  return (
    <div className="relative">
      {/* 视频播放器 */}
      <video
        ref={videoRef}  // 将 videoRef 绑定到视频元素
        className="rounded-xl shadow-lg h-full w-full fixed top-0 left-0 object-cover"
        onLoadedData={handleVideoLoaded}  // 获取视频时长
        onEnded={handleVideoEnded}  // 视频播放结束时触发
        autoPlay
        playsInline
        muted
        controls={false}
      >
        <source
          src={isFiveStar ? "videos/gold_card.MP4" : "videos/no_gold_card.mov"} // 根据是否五星选择视频
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* 音频播放器 */}
      <audio
        ref={audioRef}  // 将 audioRef 绑定到音频元素
        autoPlay
        loop
        muted={false}  // 可根据需要调整是否静音
      >
        <source
          src={isFiveStar ? "audios/出金音频.mp3" : "audios/出金音频.mp3"}  // 根据是否五星选择音频
          type="audio/mp3"
        />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default VideoWithAudio;
