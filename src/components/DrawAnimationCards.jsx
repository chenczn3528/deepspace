import React, { useEffect, useRef, useState } from 'react';

const DrawAnimationCards = ({ isFiveStar, onAnimationEnd, onSkip, isSingleDraw, fontsize }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);

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
    onSkip?.(true); // ✅ 通知父组件跳过了
    setVideoDuration(0.1); // 立即结束动画
    onAnimationEnd();
  };

  useEffect(() => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.play();
      audioRef.current.play();
    }
  }, [isFiveStar]);

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
      <div className="relative w-full h-full">
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

        <video
            preload="auto"
            ref={videoRef}
            className="absolute w-full h-full object-cover"
            onLoadedData={handleVideoLoaded}
            onEnded={handleVideoEnded}
            autoPlay
            playsInline
            muted
            controls={false}
        >
          <source
              src={isFiveStar ? 'videos/gold_card.mp4' : 'videos/no_gold_card.mp4'}
              type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        <audio
            ref={audioRef}
            preload="auto"
            autoPlay
            loop
            muted={false}
        >
          <source
              src={isFiveStar ? 'audios/出金.mp3' : 'audios/不出金.mp3'}
              type="audio/mp3"
          />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};

export default DrawAnimationCards;
