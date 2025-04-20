import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';


const Home = () => {

  const [selectedRole, setSelectedRole] = useState('随机'); // 当前选择的角色
  const roles = ['随机', ...new Set(cardData.map(card => card.character))]; // 存储可选择的角色列表

  const [pityCount, setPityCount] = useState(0); // 保底计数器
  const currentPityRef = useRef(0); // 引用存储当前保底计数器的值，在每次抽卡时更新，用于确定保底是否触发
  const currentFourStarRef = useRef(0); // 四星保底计数器的值


  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 当前的卡片索引
  const [cards, setCards] = useState([]); // 存储抽卡后的卡片信息
  const [history, setHistory] = useState([]); // 存储抽卡历史记录
  const [drawnCards, setDrawnCards] = useState([]); // 存储已抽到的卡片的数组
  const drawResultsRef = useRef([]); // 引用存储抽卡结果的数组，避免重新渲染时丢失数据，保存每次抽卡的结果，以便后续处理和展示

  const [showHistory, setShowHistory] = useState(false); // 是否显示抽卡历史
  const [showAnimationDrawCards, setShowAnimationDrawCards] = useState(false); // 是否显示抽卡动画
  const [isAnimatingDrawCards, setisAnimatingDrawCards] = useState(false); // 是否正在进行抽卡动画

  const [isFiveStar, setIsFiveStar] = useState(false); // 判断当前卡片是否五星卡片
  const [hasFiveStarAnimation, setHasFiveStarAnimation] = useState(false); // 一抽或十抽里是否包含五星卡

  const [videoPlayed, setVideoPlayed] = useState(false); // 判断五星卡视频是否播放完成

  const [showCardOverlay, setShowCardOverlay] = useState(false); // 控制是否显示卡片结果的覆盖层，为true时展示抽到的卡片
  const [fadeClass, setFadeClass] = useState("opacity-100"); // 控制卡片淡入淡出


  // 输出当前卡片信息
  useEffect(() => {
    const card = drawResultsRef.current[currentCardIndex]?.card;
    if (card) {
      console.log('当前展示卡片：', {
        名称: card.name,
        角色: card.character,
        星级: card.star,
      });
    }
  }, [currentCardIndex]);

  // ========================================================
  // 判断当前卡片是不是五星
  useEffect(() => {
    const card = drawResultsRef.current[currentCardIndex]?.card;
    if (card?.star === '5星') {
      setIsFiveStar(true); // 是五星卡片
    } else {
      setIsFiveStar(false); // 不是五星卡片，直接展示卡片
    }
  }, [currentCardIndex]);

  // ========================================================
  // 视频播放完毕，更新状态
  const handleVideoEnded = () => {
    setVideoPlayed(true);
  };

  // ========================================================
  // 播放完视频后展示卡片
  const handleAnimationEnd = () => {
    setShowCardOverlay(true);
  };



  // ========================================================
  //抽卡动画结束后开始展示卡片
  useEffect(() => {
    if (!showAnimationDrawCards && drawResultsRef.current.length > 0) {
      setCurrentCardIndex(0);
      setShowCardOverlay(true);
      setFadeClass("opacity-100");
    }
  }, [showAnimationDrawCards]);


  // ========================================================
  // 随机生成一张卡片，并根据保底计数器 (pity) 计算是否触发保底效果
  const getRandomCard = (pity, fourStarCounter) => {
  const fiveStarBase = 0.01;
  const fourStarBase = 0.07;
  const fiveStarPityStart = 60;
  const fiveStarGuaranteed = 70;

  let fiveStarChance = fiveStarBase;

  if (pity >= fiveStarPityStart) {
    fiveStarChance = Math.min(1, fiveStarBase + 0.1 * (pity - fiveStarPityStart + 1));
  }

  const roll = Math.random();
  let rarity = '3';

  if (pity + 1 >= fiveStarGuaranteed || roll < fiveStarChance) {
    rarity = '5';
  } else if ((fourStarCounter + 1) % 10 === 0) {
    rarity = '4';
  } else if (roll < fiveStarChance + fourStarBase) {
    rarity = '4';
  }

  const targetStar = parseInt(rarity, 10);
  const pool = cardData.filter(card => {
    const matchCharacter = selectedRole === '随机' || card.character === selectedRole;
    return matchCharacter && parseInt(card.star) === targetStar;
  });

  if (pool.length === 0) {
    console.warn("没有找到匹配的卡片！", {rarity, selectedRole});
    return {card: null, rarity};
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return {card: chosen, rarity};
};



  // ========================================================
  // 处理卡片的切换
const [scaleClass, setScaleClass] = useState("scale-in");

const handleNextCard = () => {
  setScaleClass("scale-out"); // 先缩小（或做一个淡出缩放动画）
  if (currentCardIndex < drawResultsRef.current.length - 1) {
    setCurrentCardIndex(prev => prev + 1);
    setVideoPlayed(false);
    setScaleClass("scale-in"); // 缩放进入
  } else {
    setShowCardOverlay(false); // 展示完毕
  }
};

  // ========================================================
  // 处理抽卡逻辑，调用 getRandomCard 函数并更新抽卡结果

  const handleDraw = async (count) => {
  if (isAnimatingDrawCards) return;

  setisAnimatingDrawCards(true);

  let drawResults = [];
  let currentPity = pityCount;
  let currentFourStarCounter = currentFourStarRef.current; // 使用 useRef 存储四星保底计数器
  let gotFourStarOrAbove = false;

  for (let i = 0; i < count; i++) {
    let result = getRandomCard(currentPity, currentFourStarCounter);

    if (result.rarity === '5') {
      currentPity = 0;
      currentFourStarCounter++; // 如果抽到五星，四星保底计数器增加
    } else {
      currentPity++;
      if (result.rarity === '4') {
        currentFourStarCounter = 0; // 如果抽到4星，重置四星保底计数器
        gotFourStarOrAbove = true;
      } else {
        currentFourStarCounter++; // 否则继续累加四星保底计数器
      }
    }

    drawResults.push(result);
  }

  // 更新全局状态
  drawResultsRef.current = drawResults;
  currentPityRef.current = currentPity;
  currentFourStarRef.current = currentFourStarCounter; // 使用 useRef 更新四星保底计数器
  setHasFiveStarAnimation(drawResults.some(r => r.rarity === '5'));
  setShowAnimationDrawCards(true);
  setDrawnCards(drawResults.map(r => r.card).filter(Boolean));
};

  // ========================================================
  // 动画结束后处理卡片的展示和历史记录的更新
  const handleDrawCardsAnimationEnd = () => {
    const finalResults = drawResultsRef.current;
    const finalPity = currentPityRef.current;
    setPityCount(finalPity);
    setCards(finalResults.map(r => r.card));
    setHistory(prev => [...finalResults.map(r => r.card), ...prev].slice(0, 50));
    setShowAnimationDrawCards(false);
    setisAnimatingDrawCards(false);
  };

//   // ========================================================
//   // 动态获取图片
// const images = import.meta.glob('./assets/images/*.png', { eager: true });
//
// const getImage = (character, cardName) => {
//   const fileName = `${character}-${cardName}.png`;
//   return images[`src/assets/images/${fileName}`]?.default; // 获取图片路径
// };



  // ========================================================
  // 返回数据时显示的页面
  return (
      <div
          className="relative w-screen h-screen cursor-pointer"
          onClick={handleNextCard}>
        {/* 视频层（最底层） */}
        <video
            autoPlay
            loop
            playsInline
            muted={false}
            controls={false}
            className="fixed top-0 left-0 w-full h-full object-cover z-0">
          <source src="videos/开屏动画.mov" type="video/mp4"/>
        </video>

        {/* 控件层（中间层） */}
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center">
          <div
              className="w-full bg-gray-900 bg-opacity-80 p-4 flex flex-col gap-4 max-w-[600px] mx-auto rounded-xl shadow-lg">
            {/* 控件内容保持不变... */}
            {/* 角色选择 */}
            <div className="flex items-center gap-2" id="role-selector">
              <label className="text-sm">选择角色：</label>
              <select
                  className="w-40 bg-gray-800 text-white p-2 rounded"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}>
                {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                ))}
              </select>
            </div>

            {/* 一抽/十抽按钮 */}
            <div className="flex justify-between mt-2 px-[10%]" id="draw-buttons">
              <button
                  onClick={() => handleDraw(1)}
                  className="bg-blue-500 px-4 py-2 rounded w-[35%]">许愿一次
              </button>
              <button
                  onClick={() => handleDraw(10)}
                  className="bg-purple-600 px-4 py-2 rounded w-[35%]">许愿十次
              </button>
            </div>

            {/* 保底显示 */}
            <div className="text-sm mt-2" id="pity-counter">
              {70 - pityCount} 抽内必得5星
            </div>

            {/* 抽卡记录按钮 */}
            <button
                className="bg-gray-700 text-white px-3 py-2 mt-4 rounded"
                onClick={() => setShowHistory(!showHistory)}
                id="history-toggle-button">
              {showHistory ? "关闭抽卡记录" : "查看抽卡记录"}
            </button>

            {/* 抽卡记录内容 */}
            {showHistory && (
                <div
                    className="h-48 overflow-y-hidden border border-gray-700 p-2 bg-gray-800 rounded mt-2"
                    id="history-container"
                >
                  {history.map((card, idx) => (
                      <div key={idx} className="text-xs text-gray-200">
                        [{card.star}★] {card.name} - {card.character} -{" "}
                        {card.card_color} - {card.card_type}
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>

        {/* 抽卡动画层 */}
        {showAnimationDrawCards && (
            <DrawAnimationCards
                isFiveStar={hasFiveStarAnimation}
                onAnimationEnd={handleDrawCardsAnimationEnd}
                cards={drawResultsRef.current.map((r) => r.card)}
                className="fixed inset-0 z-20"
            />
        )}

        {/* 卡片结果层（最顶层） */}
        {showCardOverlay && (
            <div className="fixed inset-0 z-30 bg-black bg-opacity-70">
            {isFiveStar && !videoPlayed && (
              // 只有五星卡片并且视频没有播放完时，先播放视频
              <video
                className="fixed inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted={false}
                controls={false}
                onEnded={handleVideoEnded}>
                <source src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.MOV`} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {/* 展示卡片内容 */}
            {(isFiveStar && videoPlayed) || !isFiveStar ? (
              <>
                <LazyLoadImage
                    className="fixed top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover block"
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
                />
                {/* 文字层 - 底部20%高度全屏宽度 */}
                <div className="h-screen w-screen pl-8">
                  <div className="relative w-full h-full">
                    <img
                        src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
                        alt="星级"
                        className="absolute bottom-[20%] left-[10%] h-[4%] object-contain"
                    />

                    {/* 文字区域 */}
                    <div className="absolute bottom-[10%] left-[10%] w-full h-[12%] flex text-shadow-white">
                      <img
                        className="absolute object-contain h-[45%] bottom-[35%]"
                        src={`signs/${drawResultsRef.current[currentCardIndex]?.card?.character}.png`}
                        alt={drawResultsRef.current[currentCardIndex]?.card?.character}/>

                      <h1 className="absolute bottom-[0%] left-[25%] object-contain text-shadow-white">
                        {drawResultsRef.current[currentCardIndex]?.card?.name}
                      </h1>
                    </div>
                  </div>
                </div>

              </>
            ) : null}
            </div>
        )}
      </div>
  );
};

export default Home;
