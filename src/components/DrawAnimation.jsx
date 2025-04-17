import React, { useEffect } from 'react';

const DrawAnimation = ({ isFiveStar, onAnimationEnd, cards }) => {
  console.log('DrawAnimation props:', { isFiveStar, cards });

  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 500); // 动画持续时间

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center animate-fade-in">
      {isFiveStar && (
        <div className="text-yellow-300 text-4xl font-extrabold mb-4 animate-bounce border-2 border-yellow-500 p-4 rounded-xl shadow-lg">
          🎉 抽到五星卡！🎉
        </div>
      )}
      <div className="text-white text-2xl font-bold mb-6 border px-4 py-2 rounded-lg">
        共抽到 {cards?.length || 0} 张卡片
      </div>


    </div>
  );
};

export default DrawAnimation;
