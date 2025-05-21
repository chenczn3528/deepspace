import React, {useEffect, useState} from 'react';
import LeftIcon from "./LeftIcon.jsx";
import RightIcon from "./RightIcon.jsx";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export const FullImageViewer = ({ cards, currentIndex, setCurrentIndex, onClose }) => {
  const card = cards[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };



  // ========================================================
  // 设置日卡月卡图标的大小
  const [cardTypeHeight, setCardTypeHeight] = useState(6); // 默认值为 36px
  useEffect(() => {
    const card_type = card.card_type_tag;
    if (card_type === "日冕") {
      setCardTypeHeight(7); // 包含"日冕"时设置为36px
    } else if (card_type === "月晖") {
      setCardTypeHeight(6); // 包含"月晖"时设置为24px
    }
  }, [card]);


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
  const currentCharacter = card.character;
  const shadowColor = characterShadowColors[currentCharacter] || characterShadowColors.default;

  return (
      <div className="fixed inset-0 z-30 bg-black bg-opacity-70"
      >

          {/* 渐变灰色覆盖层 */}
          <div
            className="absolute top-0 left-0 w-full z-10"
            style={{
              height: '56px',
              background: 'linear-gradient(to top, transparent, rgba(0, 0, 0, 0.6))',
              pointerEvents: 'none', // 保证点击透传到下方
            }}
          />


          {/*返回按钮*/}
          <button
              onClick={onClose}
              style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  position: 'fixed', // 使按钮脱离flex布局
                  top: '20px',  // 靠近顶部
                  left: '20px', // 靠近右侧
                  width: 'auto',
                  height: 'auto',
                  zIndex: '10'
              }}
          >
              <LeftIcon size={24} color="white"/>
          </button>

          {/*上一个*/}
          <button
              onClick={handlePrev}
              style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  position: 'fixed', // 使按钮脱离flex布局
                  top: '50%',  // 靠近顶部
                  left: '10px', // 靠近右侧
                  width: 'auto',
                  height: 'auto',
                  zIndex: '10',
              }}
          >
              <LeftIcon size={36} color="white"/>
          </button>


          {/*下一个*/}
          <button
              onClick={handleNext}
              style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  position: 'fixed', // 使按钮脱离flex布局
                  top: '50%',  // 靠近顶部
                  right: '10px', // 靠近右侧
                  width: 'auto',
                  height: 'auto',
                  zIndex: '10',
              }}
          >
              <RightIcon size={36} color="white"/>
          </button>


          {/* 底部图片（绝对定位） */}
          <img
              src="https://cdn.chenczn3528.dpdns.org/deepspace/images/结算背景.jpg"
              alt="底部装饰"
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full h-full opacity-100 z-0" // 设置 z-index 为 0
          />


          {/* 展示卡片内容 */}
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
                  src={card.image}
                  placeholderSrc={card.image_small}
                  effect="blur"
                  alt="抽到的卡片"
                  crossOrigin="anonymous"
              />
          </div>

          <div className="h-screen w-screen pl-8">
              <div className="relative w-full h-full">
                  <div className="absolute bottom-[42vw] left-[8vw] w-full h-[10vw] flex items-center">
                      <img
                          src={card.card_star_icon}
                          alt="星级"
                          className="h-[6vw] object-contain"
                      />
                      <img
                          src={card.card_color}
                          alt="星谱"
                          className="h-[5vw] object-contain ml-[12px]"
                      />
                      <img
                          src={card.card_type}
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
                          {card.character}·
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
                          {card.name}
                      </h1>
                  </div>
              </div>
          </div>
      </div>
  );
};
