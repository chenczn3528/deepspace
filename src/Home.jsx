import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import HistoryModal from './components/HistoryModal';
import CardOverlay from './components/CardOverlay';
import DrawSettings from "./components/DrawSettings.jsx";
import CardSummary from "./components/CardSummary.jsx";
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




// useEffect(() => {
//   localStorage.setItem('totalDrawCount', totalDrawCount);
//   localStorage.setItem('totalFiveStarCount', totalFiveStarCount); // 同步保存五星卡总数
// }, [totalDrawCount, totalFiveStarCount]);

useEffect(() => {
  // 保存抽卡总数、五星卡总数、剩余抽卡次数和是否使用小保底
  localStorage.setItem('totalDrawCount', totalDrawCount);
  localStorage.setItem('totalFiveStarCount', totalFiveStarCount); // 同步保存五星卡总数
  localStorage.setItem('pityCount', pityCount); // 保存剩余抽卡次数
  localStorage.setItem('useSoftGuarantee', useSoftGuarantee); // 保存是否开启小保底
}, [totalDrawCount, totalFiveStarCount, pityCount, useSoftGuarantee]);




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
  if (rarity === '5') {
    setTotalFiveStarCount((prevCount) => prevCount + 1); // 增加五星卡片数
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
          <DrawSettings
          shadowColor={shadowColor}
          totalDrawCount={totalDrawCount}
          totalFiveStarCount={totalFiveStarCount}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          roles={roles}
          includeThreeStar={includeThreeStar}
          setIncludeThreeStar={setIncludeThreeStar}
          useSoftGuarantee={useSoftGuarantee}
          setUseSoftGuarantee={setUseSoftGuarantee}
          pityCount={pityCount}
          softPityFailed={softPityFailed}
          isDrawing={isDrawing}
          isAnimatingDrawCards={isAnimatingDrawCards}
          handleDraw={handleDraw}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          setHasShownSummary={setHasShownSummary}
          setShowSummary={setShowSummary}
        />


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
        <CardOverlay
          showCardOverlay={showCardOverlay}
          isFiveStar={isFiveStar}
          videoPlayed={videoPlayed}
          currentCardIndex={currentCardIndex}
          drawResultsRef={drawResultsRef}
          setVideoPlayed={setVideoPlayed}
          cardTypeHeight={cardTypeHeight}
          shadowColor={shadowColor}
        />


        {/*十抽后结算层*/}
        {showSummary && drawResultsRef.current.length > 1 && (
          <CardSummary
            drawResults={drawResultsRef.current}  // 传递卡片数据
            onClose={() => setShowSummary(false)}  // 关闭总结页面的回调
          />
        )}

        {/* 页面 抽卡历史记录内容 */}
        <HistoryModal
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          history={history}
        />
      </div>
  );
};

export default Home;
