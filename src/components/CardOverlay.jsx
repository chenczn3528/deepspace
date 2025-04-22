// CardOverlay.jsx
import React, {useEffect, useRef, useState} from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

const CardOverlay = ({
  showCardOverlay,
  isFiveStar,
  videoPlayed,
  currentCardIndex,
  drawResultsRef,
  setVideoPlayed,
  isSkipped,
}) => {

  // ========================================================
  // 设置日卡月卡图标的大小
  const [cardTypeHeight, setCardTypeHeight] = useState(36); // 默认值为 36px
  useEffect(() => {
    const imageUrl = drawResultsRef.current[currentCardIndex]?.card?.card_type;

    if (imageUrl) {
      // 解码 URL
      const decodedUrl = decodeURIComponent(imageUrl);

      // 检查 URL 中是否包含特定的字符串并设置高度
      if (decodedUrl.includes("日冕")) {
        setCardTypeHeight(36); // 包含"日冕"时设置为36px
      } else if (decodedUrl.includes("月晖")) {
        setCardTypeHeight(28); // 包含"月晖"时设置为24px
      }
    }
  }, [currentCardIndex, drawResultsRef.current]);


  // ========================================================
  // 设置对应卡片的字体阴影颜色
  const characterShadowColors = {
    "沈星回": '4px 4px 8px rgba(133,82,161,1)',
    "黎深": '4px 4px 8px rgba(16,43,106,1)',
    "祁煜": '4px 4px 8px rgba(239,91,156,1)',
    "秦彻": '4px 4px 8px rgba(170,33,22,1)',
    "夏以昼": '4px 4px 8px rgba(244,121,32,1)',
    // 默认值也可以设一个
    default: '2px 2px 4px rgba(0, 0, 0, 0.8)'
  };
  const currentCharacter = drawResultsRef.current[currentCardIndex]?.card?.character;
  const shadowColor = characterShadowColors[currentCharacter] || characterShadowColors.default;


  // ========================================================
  // 设置音效
  const cardSoundRef = useRef(null);

  // 每次切换卡片时播放音效
  useEffect(() => {
    if (!showCardOverlay) return;

    const card = drawResultsRef.current[currentCardIndex]?.card;
    if (!card) return;

    cardSoundRef.current = new Audio('audios/切换音效.mp3');
    cardSoundRef.current.volume = 1;
    cardSoundRef.current.currentTime = 0;
    cardSoundRef.current
      .play()
      .catch((err) => console.warn('卡片展示音效播放失败:', err));
  }, [currentCardIndex, showCardOverlay]);

  return (
    showCardOverlay && (
      <div className="fixed inset-0 z-30 bg-black bg-opacity-70">
        {/* 底部图片（绝对定位） */}
        <img
          src="结算背景.jpg"
          alt="底部装饰"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full h-full opacity-100 z-0" // 设置 z-index 为 0
        />

        {isFiveStar && !videoPlayed && (
          // 只有五星卡片并且视频没有播放完时，先播放视频
          <video
            className="fixed inset-0 w-full h-full object-cover z-10" // 设置 z-index 为 10 确保视频在图片之上
            autoPlay
            playsInline
            muted
            controls={false}
            onEnded={() => {
              setVideoPlayed(true); // 设置视频播放完毕
              // handleNextCard(); // 播放完视频后处理下一张卡片
            }}
            onClick={(e) => e.preventDefault()} // 禁用点击事件，防止跳过视频
            style={{ pointerEvents: 'none' }} // 禁用点击交互
          >
            <source
              src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.mp4`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        )}

        {/* 展示卡片内容 */}
        {(isFiveStar && videoPlayed) || !isFiveStar ? (
          <>
            <div className="fixed w-full h-full inset-0 z-0">
              {/* 设置卡片展示层的 z-index 为 0 */}
              <LazyLoadImage
                className="w-screen h-screen object-cover"
                style={{
                  width: '100vw',
                  height: '100vh',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                src={drawResultsRef.current[currentCardIndex]?.card?.image}
                placeholderSrc={drawResultsRef.current[currentCardIndex]?.card?.image_small}
                effect="blur"
                alt="抽到的卡片"
                crossOrigin="anonymous"
                key={currentCardIndex}
              />
            </div>

            <div className="h-screen w-screen pl-8">
              <div className="relative w-full h-full">
                <div className="absolute bottom-[22%] left-[10%] w-full h-[6%] flex items-center">
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
                    alt="星级"
                    className="h-[36px] object-contain"
                  />
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_color}
                    alt="星谱"
                    className="h-[24px] object-contain ml-[12px]"
                  />
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_type}
                    alt="类型（日卡月卡）"
                    style={{
                      height: `${cardTypeHeight}px`,
                      maxHeight: `${cardTypeHeight}px`,
                      objectFit: 'contain',
                    }}
                    className="object-contain ml-[8px]"
                  />
                </div>

                {/* 文字区域 */}
                  <div className="absolute bottom-[13%] left-[10%] w-full h-[12%] flex items-center">
                      <h1
                          style={{
                              color: 'white',
                              fontSize: '30px',
                              textShadow: shadowColor,
                              fontFamily: '"SimSun", "宋体", serif',
                              fontWeight: '800',
                              marginLeft: '2px',
                              alignSelf: 'center',
                          }}
                      >
                          {drawResultsRef.current[currentCardIndex]?.card?.character}·
                      </h1>

                      <h1
                          style={{
                              color: 'white',
                              fontSize: '40px',
                              textShadow: shadowColor,
                              fontFamily: '"SimSun", "宋体", serif',
                              fontWeight: '800',
                              marginLeft: '2px',
                              alignSelf: 'center',
                          }}
                      >
                          {drawResultsRef.current[currentCardIndex]?.card?.name}
                      </h1>
                  </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    )
  );
};

export default CardOverlay;
