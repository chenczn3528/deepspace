import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import DrawAnimation from './components/DrawAnimation';

const Home = () => {
  const [selectedRole, setSelectedRole] = useState('随机');
  const [pityCount, setPityCount] = useState(0);
  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isFiveStarAnimation, setIsFiveStarAnimation] = useState(false);

  const videoRef = useRef();
  const drawResultsRef = useRef([]);
  const currentPityRef = useRef(0);

  const [drawnCards, setDrawnCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showCardOverlay, setShowCardOverlay] = useState(false);
  const [fadeClass, setFadeClass] = useState("opacity-100");


  const roles = ['随机', ...new Set(cardData.map(card => card.character))];


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
  // 判断背景色来决定字体颜色
  const [isDarkText, setIsDarkText] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const imgElement = imgRef.current;

    if (imgElement) {
      imgElement.onload = () => {
        // 创建canvas元素并设置大小与图片一样
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = imgElement.naturalWidth;
          canvas.height = imgElement.naturalHeight;

          // 将图片绘制到canvas中
          ctx.drawImage(imgElement, 0, 0);

          // 确认图像是否正确绘制
          console.log('Image drawn on canvas');

          // 获取底部 8% 区域的像素数据
          const height = canvas.height;
          const bottom8PercentHeight = Math.floor(height * 0.08); // 底部8%的高度
          const imageData = ctx.getImageData(0, height - bottom8PercentHeight, canvas.width, bottom8PercentHeight);
          const data = imageData.data;

          // 确认是否获取到像素数据
          console.log('Image data retrieved:', data);

          // 计算底部区域的平均亮度
          let r = 0, g = 0, b = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]; // 红色通道
            g += data[i + 1]; // 绿色通道
            b += data[i + 2]; // 蓝色通道
          }

          // 计算平均亮度（使用加权平均公式）
          const brightness = 0.2126 * (r / (data.length / 4)) + 0.7152 * (g / (data.length / 4)) + 0.0722 * (b / (data.length / 4));

          // 在控制台输出亮度值
          console.log('底部8%区域的平均亮度：', brightness);

          // 根据亮度判断字体颜色
          setIsDarkText(brightness < 128); // 亮度小于128则使用白色文字
        }
      };

      // 如果图片已经加载（缓存），则立即执行onload
      if (imgElement.complete) {
        imgElement.onload();
      }
    }
  }, []);


  // ========================================================
  //动画结束后开始展示卡片
  useEffect(() => {
    if (!showAnimation && drawResultsRef.current.length > 0) {
      setCurrentCardIndex(0);
      setShowCardOverlay(true);
      setFadeClass("opacity-100");
    }
  }, [showAnimation]);

  // ========================================================
  //播放音频的设置
  useEffect(() => {
    const playOnInteraction = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {
        });
      }
    };
    document.addEventListener('click', playOnInteraction, {once: true});
    return () => {
      document.removeEventListener('click', playOnInteraction);
    };
  }, []);

  // ========================================================
  //随机生成卡
  const getRandomCard = (pity) => {
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

    if (roll < fiveStarChance) rarity = '5';
    else if (roll < 0.12) rarity = '4';

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
  // 点击下一张卡片（带淡出/淡入）
  // const [canClick, setCanClick] = useState(true);
  const handleNextCard = () => {
    setFadeClass("opacity-40"); // 先淡出

    if (currentCardIndex < drawResultsRef.current.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setFadeClass("opacity-100"); // 淡入新卡
      } else {
        setShowCardOverlay(false); // 展示完毕
      }

    // setTimeout(() => {
    //   if (currentCardIndex < drawResultsRef.current.length - 1) {
    //     setCurrentCardIndex(prev => prev + 1);
    //     setFadeClass("opacity-100"); // 淡入新卡
    //   } else {
    //     setShowCardOverlay(false); // 展示完毕
    //   }
    // }, 100); // 动画持续 300ms
  };

  // ========================================================
  // 设置动画效果展示卡
  const handleDraw = async (count) => {
    if (isAnimating) return;

    setIsAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    let drawResults = [];
    let currentPity = pityCount;
    let guaranteedFourStarGiven = false;

    for (let i = 0; i < count; i++) {
      let result = getRandomCard(currentPity);

      if (result.rarity === '5') currentPity = 0;
      else currentPity++;

      if (i === count - 1 && !guaranteedFourStarGiven && !['4', '5'].includes(result.rarity)) {
        const fallback = getRandomCard(currentPity);
        if (['4', '5'].includes(fallback.rarity)) {
          result = fallback;
          if (result.rarity === '5') currentPity = 0;
          else currentPity++;
        }
      }

      if (['4', '5'].includes(result.rarity)) guaranteedFourStarGiven = true;
      drawResults.push(result);
    }

    drawResultsRef.current = drawResults;
    currentPityRef.current = currentPity;
    setIsFiveStarAnimation(drawResults.some(r => r.rarity === '5'));
    setShowAnimation(true);

    // ✅ 添加这一句以显示卡片
    setDrawnCards(drawResults.map(r => r.card).filter(Boolean));
  };

  // ========================================================
  //动画效果结束
  const handleAnimationEnd = () => {
    const finalResults = drawResultsRef.current;
    const finalPity = currentPityRef.current;
    setPityCount(finalPity);
    setCards(finalResults.map(r => r.card));
    setHistory(prev => [...finalResults.map(r => r.card), ...prev].slice(0, 50));
    setShowAnimation(false);
    setIsAnimating(false);
  };


  // ========================================================
  // 返回数据时显示的页面


  return (
      <div
          className="relative w-screen h-screen cursor-pointer"
          onClick={handleNextCard}
      >
        {/* 视频层（最底层） */}
        <video
            ref={videoRef}
            autoPlay
            loop
            playsInline
            muted={false}
            controls={false}
            className="fixed top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/home_video.mp4" type="video/mp4"/>
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
                  onChange={(e) => setSelectedRole(e.target.value)}
              >
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
        {showAnimation && (
            <DrawAnimation
                isFiveStar={isFiveStarAnimation}
                onAnimationEnd={handleAnimationEnd}
                cards={drawResultsRef.current.map((r) => r.card)}
                className="fixed inset-0 z-20"
            />
        )}

        {/* 卡片结果层（最顶层） */}
        {showCardOverlay && (
            <div className="fixed inset-0 z-30 bg-black bg-opacity-70">
              <img className="fixed top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover"
                   style={{
                     // 终极保险：确保图片无论如何都撑满屏幕
                     width: '100vw',
                     height: '100vh',
                     objectFit: 'cover',
                     objectPosition: 'center',
                   }}
                   src={`images/${drawResultsRef.current[currentCardIndex]?.card?.character}-${drawResultsRef.current[currentCardIndex]?.card?.name}.png`}
                   alt="抽到的卡片"
                   crossOrigin="anonymous"/>

              {/* 文字层 - 底部20%高度全屏宽度 */}
              <div className="h-screen w-screen pl-8">
                <div className="relative w-full h-full">
                  <img
                      src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
                      alt="星级"
                      className="absolute bottom-[12%] left-[10%] h-[4%] object-contain"
                  />

                  {/* 文字区域 */}
                  <div className="absolute bottom-[2%] left-[10%] w-full h-[12%] flex text-shadow-white">
                    <h2 className="absolute object-contain">
                      {drawResultsRef.current[currentCardIndex]?.card?.character}
                    </h2>

                    <h1 className="absolute bottom-[0%] left-[20%] object-contain text-shadow-white">
                      {drawResultsRef.current[currentCardIndex]?.card?.name}
                    </h1>
                  </div>


                  {/*<div className="h-1/2 flex items-center justify-between space-x-4">*/}
                  {/*  /!* 文字部分 角色 *!/*/}
                  {/*  <div className="text-white text-left flex-shrink-0 pr-4">*/}
                  {/*    <h3>{drawResultsRef.current[currentCardIndex]?.card?.character}</h3>*/}
                  {/*  </div>*/}

                  {/*  /!* 文字部分 卡名 *!/*/}
                  {/*  <div className="text-white text-left flex-shrink-0 pr-4">*/}
                  {/*    <h2>{drawResultsRef.current[currentCardIndex]?.card?.name}</h2>*/}
                  {/*  </div>*/}

                  {/*  /!* 图片部分 星谱 *!/*/}
                  {/*  <div className="flex-shrink-0">*/}
                  {/*    <img*/}
                  {/*        src={drawResultsRef.current[currentCardIndex]?.card?.card_color} // 在这里放置第二个图片的路径*/}
                  {/*        alt="星谱"*/}
                  {/*        className="h-1/4 object-cover"*/}
                  {/*    />*/}
                  {/*  </div>*/}

                  {/*  /!* 图片部分 日卡/月卡 *!/*/}
                  {/*  <div className="flex-shrink-0">*/}
                  {/*    <img*/}
                  {/*        src={drawResultsRef.current[currentCardIndex]?.card?.card_type} // 在这里放置第三个图片的路径*/}
                  {/*        alt="日卡/月卡"*/}
                  {/*        className="h-1/4 object-cover"*/}
                  {/*    />*/}
                  {/*  </div>*/}


                  {/*</div>*/}


                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Home;


// <div className="h-screen pl-8">
//   <div className="h-full w-full flex flex-col pl-8">
//     {/* 上部分：图片区域 + 底部星星 */}
//     <div className="h-full flex flex-col">
//       <div className="h-[85%] w-full border-2 border-red-500 relative">上部分</div>
//       <div className="h-[15%] w-full border-2 border-red-500 relative">
//         <img
//             src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
//             alt="星级图片"
//             className="absolute left-5 bottom-0 object-cover"
//         />
//       </div>
//     </div>
//   </div>
//
//
//   <div className="h-[85%] w-full border-2 border-red-500"/>
//   <div className="h-[15%] w-full border-2 border-red-500">
//     <img
//         src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
//         alt="星级图片"
//         className="absolute left-5 bottom-0 object-cover"
//     />
//   </div>
//
//   {/* 下部分：横向排列文本和图片 */}
//   <div className="h-1/2 flex items-center justify-between space-x-4">
//     {/* 文字部分 角色 */}
//     <div className="text-white text-left flex-shrink-0 pr-4">
//       <h3>{drawResultsRef.current[currentCardIndex]?.card?.character}</h3>
//     </div>
//
//     {/* 文字部分 卡名 */}
//     <div className="text-white text-left flex-shrink-0 pr-4">
//       <h2>{drawResultsRef.current[currentCardIndex]?.card?.name}</h2>
//     </div>
//
//     {/* 图片部分 星谱 */}
//     <div className="flex-shrink-0">
//       <img
//           src={drawResultsRef.current[currentCardIndex]?.card?.card_color} // 在这里放置第二个图片的路径
//           alt="星谱"
//           className="h-1/4 object-cover"
//       />
//     </div>
//
//     {/* 图片部分 日卡/月卡 */}
//     <div className="flex-shrink-0">
//       <img
//           src={drawResultsRef.current[currentCardIndex]?.card?.card_type} // 在这里放置第三个图片的路径
//           alt="日卡/月卡"
//           className="h-1/4 object-cover"
//       />
//     </div>
//   </div>