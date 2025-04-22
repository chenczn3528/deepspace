import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';


const Home = () => {


  // 背景音乐设置
  const audioRef = useRef(null);
const [isMusicPlaying, setIsMusicPlaying] = useState(false);

useEffect(() => {
  document.addEventListener('pointerdown', handleFirstInteraction);
  return () => {
    document.removeEventListener('pointerdown', handleFirstInteraction);
  };
}, []);

const handleFirstInteraction = () => {
  if (audioRef.current && !isMusicPlaying) {
    audioRef.current.play().then(() => {
      setIsMusicPlaying(true);
    }).catch((err) => {
      console.warn('播放失败：', err);
    });
  }
};

useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  const forcePlay = () => {
  setTimeout(() => {
    if (audio.paused) {
      audio.play().catch((err) => {
        console.warn("尝试恢复音频失败", err);
      });
    }
  }, 100); // 等 100ms 后再恢复，规避系统切换时冲突
};
  // 当 audio 被浏览器暂停时，立刻尝试重新播放
  audio.addEventListener('pause', forcePlay);
  return () => {audio.removeEventListener('pause', forcePlay);};
}, []);


  const [selectedRole, setSelectedRole] = useState('随机'); // 当前选择的角色
  const roles = ['随机', ...new Set(cardData.map(card => card.character))]; // 存储可选择的角色列表

  const [includeThreeStar, setIncludeThreeStar] = useState(true); // 设置是否包括三星

  const drawSessionIdRef = useRef(0); // 全局流程控制 ID，抽卡直接出现结果的bug
  const [isDrawing, setIsDrawing] = useState(false);

  const [totalDrawCount, setTotalDrawCount] = useState(0); // 统计总抽卡数
  const [totalFiveStarCount, setTotalFiveStarCount] = useState(0); // 统计总出金数


  const [pityCount, setPityCount] = useState(0); // 保底计数器
  const [softPityFailed, setSoftPityFailed] = useState(false); //小保底是否激活
  const [useSoftGuarantee, setUseSoftGuarantee] = useState(true); // 是否开启小保底
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

  const [showSummary, setShowSummary] = useState(false); // 是否显示结算十抽的卡片
  const [summaryCards, setSummaryCards] = useState([]); // 存储结算十抽的卡片
  const [hasShownSummary, setHasShownSummary] = useState(false); // 是否已经展示过结算页面




// 设置对应卡片的字体阴影颜色
  const characterShadowColors = {
    "沈星回": '4px 4px 8px rgba(179, 153, 129, 1)', // 蓝色阴影
    "黎深": '4px 4px 8px rgba(173, 173, 186, 1)', // 粉红阴影
    "祁煜": '4px 4px 8px rgba(119, 122, 149, 1)', // 紫色阴影
    "秦彻": '4px 4px 8px rgba(189, 114, 112, 1)', // 金色阴影
    "夏以昼": '4px 4px 8px rgba(227, 203, 190, 1)', // 金色阴影
    // 默认值也可以设一个
    default: '2px 2px 4px rgba(0, 0, 0, 0.8)'
  };
  const currentCharacter = drawResultsRef.current[currentCardIndex]?.card?.character;
  const shadowColor = characterShadowColors[currentCharacter] || characterShadowColors.default;


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





  // // ========================================================
  // // 视频播放完毕，更新状态
  // const handleVideoEnded = () => {
  //   setVideoPlayed(true);
  //   handleNextCard();
  // };

  // 保存抽卡总数和总出金数
  useEffect(() => {
  const savedDrawCount = localStorage.getItem('totalDrawCount');
  const savedFiveStarCount = localStorage.getItem('totalFiveStarCount');

  if (savedDrawCount) {
    setTotalDrawCount(parseInt(savedDrawCount, 10));
  }
  if (savedFiveStarCount) {
    setTotalFiveStarCount(parseInt(savedFiveStarCount, 10));
  }
}, []);

useEffect(() => {
  localStorage.setItem('totalDrawCount', totalDrawCount);
  localStorage.setItem('totalFiveStarCount', totalFiveStarCount);
}, [totalDrawCount, totalFiveStarCount]);




  // ========================================================
  //抽卡动画结束后开始展示卡片
  useEffect(() => {
    if (!showAnimationDrawCards && drawResultsRef.current.length > 0) {
      setCurrentCardIndex(0);
      setShowCardOverlay(true);
      // setFadeClass("opacity-100");
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
  let pool = [];

  if (selectedRole === '随机') {
    pool = cardData.filter(card => parseInt(card.star) === targetStar);
  } else {
    if (targetStar === 5) {
      if (useSoftGuarantee) {
        if (softPityFailed) {
          // 大保底触发
          pool = cardData.filter(card => card.character === selectedRole && parseInt(card.star) === 5);
        } else {
          // 普通抽取，有几率抽到非目标角色
          pool = cardData.filter(card => parseInt(card.star) === 5);
        }
      } else {
        // 不使用保底机制，直接限定为指定角色
        pool = cardData.filter(card => card.character === selectedRole && parseInt(card.star) === 5);
      }
    } else {
      // 3星/4星不考虑角色
      pool = cardData.filter(card => parseInt(card.star) === targetStar);
    }
  }

  if (pool.length === 0) {
    console.warn("没有找到匹配的卡片！", { rarity, selectedRole });
    return { card: null, rarity };
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];

  if (targetStar === 5 && selectedRole !== '随机' && useSoftGuarantee) {
    if (chosen.character === selectedRole) {
      setSoftPityFailed(false);
    } else {
      setSoftPityFailed(true);
    }
  }

  setTotalDrawCount((prevCount) => prevCount + 1); // 统计总抽卡数
  if (rarity === 5) {
    setTotalFiveStarCount((prevCount) => prevCount + 1); // 如果抽到五星卡片，增加出金数
  }
  console.log("当前五星卡片数:", totalFiveStarCount);

  return { card: chosen, rarity };
};


  // ========================================================
  // 处理卡片的切换
const handleNextCard = () => {

  if (currentCardIndex < drawResultsRef.current.length - 1) {
    setCurrentCardIndex(prev => prev + 1);
    setVideoPlayed(false);
  } else {
    setShowCardOverlay(false);
    setSummaryCards(drawnCards);

    if (drawResultsRef.current.length > 1 && !hasShownSummary) {
      setShowSummary(true);
      setHasShownSummary(true); // 防止重复展示
    }
  }
};


  // ========================================================
  // 处理抽卡逻辑，调用 getRandomCard 函数并更新抽卡结果

  const handleDraw = async (count) => {

    if (isDrawing || isAnimatingDrawCards) return;
    // 加锁
    setIsDrawing(true);

    setisAnimatingDrawCards(true);
    setVideoPlayed(true); // 控制不能重复点击

    const currentDrawId = Date.now();
    drawSessionIdRef.current = currentDrawId;

    let drawResults = [];
    let currentPity = pityCount;
    let currentFourStarCounter = currentFourStarRef.current;
    let gotFourStarOrAbove = false;

    for (let i = 0; i < count; i++) {
      let result;

      // 保证不包括三星时不会抽到三星
      do {
        result = getRandomCard(currentPity, currentFourStarCounter);
      } while (!includeThreeStar && result.rarity === '3');

      // 处理保底逻辑
      if (result.rarity === '5') {
        currentPity = 0;
        currentFourStarCounter++;
      } else {
        currentPity++;
        if (result.rarity === '4') {
          currentFourStarCounter = 0;
          gotFourStarOrAbove = true;
        } else {
          currentFourStarCounter++;
        }
      }

      drawResults.push(result);
    }
    setIsDrawing(false);

    // 更新状态
    drawResultsRef.current = drawResults;
    currentPityRef.current = currentPity;
    currentFourStarRef.current = currentFourStarCounter;
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
    // setHistory(prev => [...finalResults.map(r => r.card), ...prev].slice(0, 50));
    setHistory(prev => [...finalResults.map(r => ({...r.card, timestamp: new Date().toISOString(),})), ...prev,].slice(0, 50));

    setShowAnimationDrawCards(false);
    setisAnimatingDrawCards(false);
  };

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


  // 记录时间的格式化
  const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).slice(-2); // 取后两位
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hour}:${minute}`;
};


  // ========================================================
  // 返回数据时显示的页面
  return (
      <div
          className="relative w-screen h-screen cursor-pointer overflow-hidden outline-none focus:outline-none"
          tabIndex={0}
          onClick={() => {
            handleFirstInteraction();
            if (!isDrawing && !isAnimatingDrawCards) {
              handleNextCard();
            }
          }}>

        {/*/!*音频*!/*/}
        <audio
            ref={audioRef}
            loop
            src="audios/时空引力.mp3"
        />

        {/* 视频层（最底层） */}
        <video
            autoPlay
            loop
            playsInline
            muted
            controls={false}
            onEnded={() => {
              const validDrawId = drawSessionIdRef.current;
              if (!validDrawId) return;

              setVideoPlayed(false);     // 播放结束后解锁
              setisAnimatingDrawCards(false);

              drawSessionIdRef.current = 0; // 重置流程 ID，防止后续重复触发

            }}
            className="fixed top-0 left-0 w-full h-full object-cover z-0">
          <source src="videos/开屏动画.mp4" type="video/mp4"/>
        </video>

        {/* 控件层（中间层） */}
        <div className="fixed inset-0 z-10 flex flex-col w-full bottom-[10%] items-center justify-center">
          <div
              className="relative bg-gray-900 bg-opacity-80 p-4 flex flex-col gap-4  ml-[10px] mr-[10px] rounded-xl shadow-lg">

            {/*统计抽数*/}
            <div
                style={{
                  color: 'white',
                  fontSize: '20px',
                  textShadow: shadowColor,
                  fontFamily: '"SimSun", "宋体", serif',
                  fontWeight: '800',
                  marginLeft: '20px',
                  // alignSelf: 'center',
                }}
                className="text-sm mt-2"
            >
              <label>总抽卡数: {totalDrawCount}</label>
              <label className="ml-[20px]">总出金数: {totalFiveStarCount}</label>
            </div>
            <label style={{
                  color: 'white',
                  fontSize: '20px',
                  textShadow: shadowColor,
                  fontFamily: '"SimSun", "宋体", serif',
                  fontWeight: '800',
                  marginLeft: '20px',
                  // alignSelf: 'center',
                }}
                className="text-sm mt-2">
              平均出金数: {totalFiveStarCount === 0 ? '0' : (totalDrawCount / totalFiveStarCount).toFixed(2)}
            </label>


            {/* 角色选择 */}
            <div className="flex items-center gap-2 ml-[20px]" id="role-selector">
              <label style={{
                color: 'white',
                fontSize: '20px',
                textShadow: shadowColor,
                fontFamily: '"SimSun", "宋体", serif',
                fontWeight: '800',
                marginLeft: '2px',
                alignSelf: 'center'
              }}>选择角色：</label>
              <select
                  className="bg-gray-800 text-white p-2 rounded"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}>
                {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                ))}
              </select>
            </div>

            {/*是否排除三星*/}
            <div className="flex items-center gap-2 mb-2 ml-[20px] text-white">
              <label style={{
                color: 'white',
                fontSize: '20px',
                textShadow: shadowColor,
                fontFamily: '"SimSun", "宋体", serif',
                fontWeight: '800',
                marginLeft: '2px',
                alignSelf: 'center'
              }} htmlFor="includeThree" className="text-sm">包括三星卡片</label>
              <input
                  id="includeThree"
                  type="checkbox"
                  checked={includeThreeStar}
                  onChange={(e) => setIncludeThreeStar(e.target.checked)}
                  className="w-[20px] h-[20px]"
              />
              <label
                  style={{
                    color: 'white',
                    fontSize: '20px',
                    textShadow: shadowColor,
                    fontFamily: '"SimSun", "宋体", serif',
                    fontWeight: '800',
                    marginLeft: '20px',
                    alignSelf: 'center'
                  }}
                  htmlFor="softGuarantee"
                  className="text-sm"
              >
                开启大小保底机制
              </label>
              <input
                  id="softGuarantee"
                  type="checkbox"
                  checked={useSoftGuarantee}
                  onChange={(e) => setUseSoftGuarantee(e.target.checked)}
                  className="w-[20px] h-[20px]"
              />

            </div>


            {/* 一抽/十抽按钮 */}
            <div className="flex w-screen h-[40px] justify-between px-4"> {/* 新增这层容器 */}
              <button
                  onClick={() => {
                    setHasShownSummary(false);
                    setShowSummary(false);
                    handleDraw(1);
                  }}
                  className="bg-blue-500 px-8 py-2 rounded flex-1 ml-[20px] h-auto">
                许愿一次
              </button>
              <div className="flex-1 max-w-[20px]"></div>
              {/* 中间间距 */}
              <button
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止冒泡
                    setHasShownSummary(false);
                    setShowSummary(false);
                    handleDraw(10);
                  }}
                  disabled={isDrawing || isAnimatingDrawCards}
                  className="bg-purple-600 px-8 py-2 rounded flex-1 mr-[20px] h-auto">
                {isDrawing ? "抽卡中..." : "许愿十次"}
              </button>
            </div>

            <div className="flex w-screen h-[40px] mt-[16px]">
              {/* 保底显示 */}
              <div
                  className="text-sm mt-2"
                  id="pity-counter"
                  style={{
                    color: 'white',
                    fontSize: '20px',
                    textShadow: shadowColor,
                    fontFamily: '"SimSun", "宋体", serif',
                    fontWeight: '800',
                    marginLeft: '20px',
                    alignSelf: 'center'
                  }}
              >
                {
                  selectedRole === '随机' || !useSoftGuarantee ? (
                      <>还剩 {70 - pityCount} 抽必得五星</>
                  ) : (
                      softPityFailed
                          ? <>还剩 {70 - pityCount} 抽大保底</>
                          : <>还剩 {70 - pityCount} 抽小保底</>
                  )
                }
              </div>

              {/* 抽卡历史记录按钮 */}
              <button
                  className="bg-gray-700 text-white ml-[20px] rounded"
                  onClick={() => setShowHistory(!showHistory)}
                  id="history-toggle-button">
                {showHistory ? "关闭抽卡记录" : "查看抽卡记录"}
              </button>
            </div>
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

              {/* 底部图片（绝对定位） */}
              <img
                src="结算背景.jpg"
                alt="底部装饰"
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full h-full opacity-100 z-0"  // 设置 z-index 为 0
              />

              {isFiveStar && !videoPlayed && (
                  // 只有五星卡片并且视频没有播放完时，先播放视频
                  <video
                    className="fixed inset-0 w-full h-full object-cover z-10"  // 设置 z-index 为 10 确保视频在图片之上
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
                      src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.MOV`}
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
              )}

              {/* 展示卡片内容 */}
              {(isFiveStar && videoPlayed) || !isFiveStar ? (
                  <>
                    <div className="fixed w-full h-full inset-0 z-0">  {/* 设置卡片展示层的 z-index 为 0 */}
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
                                objectFit: 'contain'
                              }}
                              className="object-contain ml-[8px]"
                          />

                        </div>

                        {/* 文字区域 */}
                        <div className="absolute bottom-[13%] left-[10%] w-full h-[12%] flex items-center">
                          <img
                              className="h-[48px] object-contain"
                              src={`signs/${drawResultsRef.current[currentCardIndex]?.card?.character}.png`}
                              alt="角色"/>
                          <h1 style={{
                            color: 'white',
                            fontSize: '30px',
                            textShadow: shadowColor,
                            fontFamily: '"SimSun", "宋体", serif',
                            fontWeight: '1000',
                          }}>·</h1>
                          <h1
                              style={{
                                color: 'white',
                                fontSize: '40px',
                                textShadow: shadowColor,
                                fontFamily: '"SimSun", "宋体", serif',
                                fontWeight: '800',
                                marginLeft: '2px',
                                alignSelf: 'center'
                              }}>
                            {drawResultsRef.current[currentCardIndex]?.card?.name}
                          </h1>

                        </div>
                      </div>
                    </div>

                  </>
              ) : null}
            </div>
        )}

        {/*十抽后结算层*/}
        {showSummary && drawResultsRef.current.length > 1 && (

            <div
                className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center overflow-hidden w-full h-full"
                onClick={() => setShowSummary(false)}
            >
              {/* 卡片网格 */}
              <div className="grid grid-cols-5 gap-4 p-8 w-[80%] h-[70%] relative z-10">
                {drawResultsRef.current.map((item, index) => {
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

              {/*底部图片（绝对定位）*/}
              <img
                  src="结算背景.jpg"
                  alt="底部装饰"
                  className="absolute w-screen h-screen opacity-100"
              />
            </div>
        )}


        {/* 页面 抽卡历史记录内容 */}
        {showHistory && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center w-screen top-[0%] bottom-[30%]"
                onClick={() => setShowHistory(false)}
            >
              <div
                  className="relative flex flex-col w-[80vw] h-[80%] p-4 rounded-lg overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
              >
                <img
                    src="结算背景.jpg"
                    alt="背景"
                    className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-90"
                />


                <div className="relative z-10 flex flex-col h-full" style={{color: 'black'}}>
                  <h2 className="text-xl font-bold mb-4 text-center" style={{color: 'black'}}>
                    历史记录
                  </h2>

                  <div className="flex-1 overflow-y-auto pr-2">
                    {history.map((card, idx) => {
                      const cardHistoryColors = {
                        "3星": {color: "black"},
                        "4星": {color: "#a855f7"},
                        "5星": {color: "#dda516", fontWeight: "bold"}
                      };
                      const historyColor = cardHistoryColors[card.star] || "black";


                      return (
                          <div
                              key={idx}
                              className="text-xs mb-2 flex justify-between"
                          >
                            <div style={historyColor} className="ml-[20px]">{card.star}</div>
                            <div style={historyColor}>{card.character}·{card.name}</div>
                            <div style={historyColor} className="mr-[20px]">{formatDate(card.timestamp)}</div>
                          </div>
                      );
                    })}
                  </div>

                  <div className="pb-[10px]"></div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Home;
