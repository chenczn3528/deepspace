import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';  // 确保你有安装这个库

const CardSummary = ({ drawResults, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center overflow-hidden w-full h-full"
      onClick={onClose}
    >
      {/* 卡片网格 */}
      <div className="grid grid-cols-5 gap-4 p-8 w-[80%] h-[70%] relative z-10">
        {drawResults.map((item, index) => {
          let glowStyle = {};

          if (item.card.star === '5星') {
            glowStyle = {
              boxShadow: '0 -10px 20px rgba(255, 215, 0, 0.6), 0 10px 20px rgba(255, 215, 0, 0.6)', // 上下金光
            };
          } else if (item.card.star === '4星') {
            glowStyle = {
              boxShadow: '0 -10px 20px rgba(168, 85, 247, 0.6), 0 10px 20px rgba(168, 85, 247, 0.6)', // 上下紫光
            };
          }

          return (
            <LazyLoadImage
              key={index}
              src={item.card.image}
              placeholderSrc={item.card.image_small}
              effect="blur"
              alt={`Card ${index}`}
              className="w-[90%] h-[90%] object-cover rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
              style={glowStyle}
            />
          );
        })}
      </div>

      {/* 底部图片（绝对定位） */}
      <img
        src="结算背景.jpg"
        alt="底部装饰"
        className="absolute w-screen h-screen opacity-100"
      />
    </div>
  );
};

export default CardSummary;
