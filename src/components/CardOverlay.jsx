// CardOverlay.jsx
import React, {useEffect, useRef, useState} from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

const CardOverlay = ({
  showCardOverlay,
  currentCardIndex,
  drawResultsRef,
  videoPlayed,
  setVideoPlayed,
  handleNextCard,
}) => {

  const isCurrentFiveStar = drawResultsRef.current[currentCardIndex]?.card?.star === '5星';

  // ========================================================
  // 设置日卡月卡图标的大小
  const [cardTypeHeight, setCardTypeHeight] = useState(6); // 默认值为 6vw
  useEffect(() => {
    const card_type = drawResultsRef.current[currentCardIndex]?.card?.card_type_tag;
    if (card_type === "日冕") {
      setCardTypeHeight(7); // 包含"日冕"时设置为7vw
    } else if (card_type === "月晖") {
      setCardTypeHeight(6); // 包含"月晖"时设置为6vw
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

  useEffect(() => {
    if (!showCardOverlay) return;

    const card = drawResultsRef.current[currentCardIndex]?.card;
    if (!card) return;

    const isCurrentFiveStar = card.star === '5星';

    const soundEffect = isCurrentFiveStar ? 'audios/金卡展示.mp3' : 'audios/切换音效.mp3';

    // 只有当背景音乐已经播放并且卡片音效存在时，才播放卡片音效
    cardSoundRef.current = new Audio(soundEffect);
    cardSoundRef.current.volume = 1;
    cardSoundRef.current.currentTime = 0;

    cardSoundRef.current
      .play()
      .catch((err) => console.warn('卡片展示音效播放失败:', err));

    // 这里的音效播放不会影响背景音乐
  }, [currentCardIndex, showCardOverlay]);





  return (
    showCardOverlay && (
      <div className="fixed inset-0 z-30 bg-black bg-opacity-70"
           onClick={() => {
            // 只有视频播放完了，才能允许切换
            if (!isCurrentFiveStar || videoPlayed) {
              handleNextCard();
            }
          }}
      >
        {/* 底部图片（绝对定位） */}
        <img
          src="images/结算背景.jpg"
          alt="底部装饰"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full h-full opacity-100 z-0" // 设置 z-index 为 0
        />

        {isCurrentFiveStar && !videoPlayed && (
          <>
            {/* 透明遮罩层：防止点击任何内容 */}
            <div
              className="fixed inset-0 z-20"
              style={{ backgroundColor: 'transparent', pointerEvents: 'auto' }}
            />

            {/* 视频播放层 */}
            <video
              className="fixed inset-0 w-full h-full object-cover z-10"
              preload="auto"
              autoPlay
              playsInline
              muted
              controls={false}
              onEnded={() => setVideoPlayed(true)}
              style={{ pointerEvents: 'none' }}
            >
              <source
                src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.mp4`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </>
        )}


        {/* 展示卡片内容 */}
        {(isCurrentFiveStar && videoPlayed) || !isCurrentFiveStar ? (
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
                <div className="absolute bottom-[42vw] left-[8vw] w-full h-[10vw] flex items-center">
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
                    alt="星级"
                    className="h-[6vw] object-contain"
                  />
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_color}
                    alt="星谱"
                    className="h-[5vw] object-contain ml-[12px]"
                  />
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_type}
                    alt="类型（日卡月卡）"
                    style={{
                      height: `${cardTypeHeight}vw`,
                      maxHeight: `${cardTypeHeight}vw`,
                      objectFit: 'contain',
                    }}
                    className="object-contain ml-[8px]"
                  />
                </div>

                {/* 文字区域 */}
                  <div className="absolute bottom-[32vw] left-[8vw] w-full h-[12vw] flex items-center">
                      <h1
                          style={{
                              color: 'white',
                              fontSize: '6vw',
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
                              fontSize: '8vw',
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
