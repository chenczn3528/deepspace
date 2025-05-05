import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import HistoryModal from './components/HistoryModal';
import CardOverlay from './components/CardOverlay';
import SettingsLayer from "./components/SettingsLayer.jsx";
import CardSummary from "./components/CardSummary.jsx";
import useLocalStorageState from './hooks/useLocalStorageState'
import {GalleryPage} from "./components/GalleryPage.jsx";
import 'react-lazy-load-image-component/src/effects/blur.css';

const Home = () => {

  // 加载serviceWorker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('service_worker.js')
        .then((reg) => console.log('SW registered:', reg))
        .catch((err) => console.error('SW registration failed:', err));
    });
  }


  // ========================================================
  // 数据存储与恢复

  // 总抽卡数
  const [totalDrawCount, setTotalDrawCount] = useLocalStorageState('totalDrawCount', 0);
  // 选择的角色
  const [selectedRole, setSelectedRole] = useLocalStorageState('selectedRole', '随机');
  // 总出金数
  const [totalFiveStarCount, setTotalFiveStarCount] = useLocalStorageState('totalFiveStarCount', 0);
  // 下次出金还需要多少
  const [pityCount, setPityCount] = useLocalStorageState('pityCount', 0);
  // 是否开启大小保底机制
  const [useSoftGuarantee, setUseSoftGuarantee] = useLocalStorageState('useSoftGuarantee', true);
  // 目前是小保底还是大保底
  const [softPityFailed, setSoftPityFailed] = useLocalStorageState('softPityFailed', false);
  // 是否包括三星
  const [includeThreeStar, setIncludeThreeStar] = useLocalStorageState('includeThreeStar', true);
  // 是否只抽当前角色的卡
  const [onlySelectedRoleCard, setOnlySelectedRoleCard] = useLocalStorageState('onlySelectedRoleCard', false);
  // 历史记录
  const [history, setHistory] = useLocalStorageState('history', []);


  // 清除缓存数据
  const keysToClear = [
    'totalDrawCount',
    'totalFiveStarCount',
    'pityCount',
    'useSoftGuarantee',
    'softPityFailed',
    'selectedRole',
    'includeThreeStar',
    'onlySelectedRoleCard',
    'history'
  ];

  const clearLocalData = () => {
    keysToClear.forEach(key => localStorage.removeItem(key));
    location.reload();
  };



  // ========================================================
  // 其余变量
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 当前的卡片索引
  const [cards, setCards] = useState([]); // 存储抽卡后的卡片信息
  const [drawnCards, setDrawnCards] = useState([]); // 存储已抽到的卡片的数组
  const drawResultsRef = useRef([]); // 引用存储抽卡结果的数组，避免重新渲染时丢失数据，保存每次抽卡的结果，以便后续处理和展示

  const roles = ['随机', ...new Set(cardData.map(card => card.character))]; // 存储可选择的角色列表

  const drawSessionIdRef = useRef(0); // 全局流程控制 ID，抽卡直接出现结果的bug
  const [isDrawing, setIsDrawing] = useState(false); // 防止重复抽卡

  const [videoSkipped, setVideoSkipped] = useState(false); // 设置跳过视频的状态
  const isSingleDraw = drawnCards.length === 1; //是否是一抽，一抽的话不要显示跳过按钮

  const currentPityRef = useRef(0); // 引用存储当前保底计数器的值，在每次抽卡时更新，用于确定保底是否触发
  const currentFourStarRef = useRef(0); // 四星保底计数器的值

  const [showHistory, setShowHistory] = useState(false); // 是否显示抽卡历史
  const [showAnimationDrawCards, setShowAnimationDrawCards] = useState(false); // 是否显示抽卡动画
  const [isAnimatingDrawCards, setisAnimatingDrawCards] = useState(false); // 是否正在进行抽卡动画

  const [isFiveStar, setIsFiveStar] = useState(false); // 判断当前卡片是否五星卡片
  const [hasFiveStarAnimation, setHasFiveStarAnimation] = useState(false); // 一抽或十抽里是否包含五星卡

  const displayResultsRef = useRef([]); // 跳过时展示的卡片

  const [videoPlayed, setVideoPlayed] = useState(false);  // 出金动画播放状态
  const [lastFiveStarWasTarget, setLastFiveStarWasTarget] = useState(true); // 上一次五星是否是定向角色


  const [showCardOverlay, setShowCardOverlay] = useState(false); // 控制是否显示卡片结果的覆盖层，为true时展示抽到的卡片

  const [showSummary, setShowSummary] = useState(false); // 是否显示结算十抽的卡片
  const [summaryCards, setSummaryCards] = useState([]); // 存储结算十抽的卡片
  const [hasShownSummary, setHasShownSummary] = useState(false); // 是否已经展示过结算页面
  const [showGallery, setShowGallery] = useState(false); // 是否展示图鉴

  const [galleryHistory, setGalleryHistory] = useState([]);  // 图鉴历史



  // ========================================================
  // 图鉴相关

  // 去重逻辑
  const removeDuplicates = (arr) => {
    const seen = new Set();
    return arr.filter((item) => {
      const duplicate = seen.has(item.name);  // 假设每个卡片都有一个唯一的 id
      seen.add(item.name);
      return !duplicate;
    });
  };

  // 初始化 galleryHistory
  useEffect(() => {
    if (galleryHistory.length === 0 && history.length > 0) {
      const uniqueHistory = removeDuplicates(history);
      setGalleryHistory(uniqueHistory);
    }
  }, [history, galleryHistory.length]);

  console.log("galleryHistory:",galleryHistory)

  // 合并新的抽卡记录
  useEffect(() => {
  if (drawResultsRef.current && drawResultsRef.current.length > 0) {
    const newCards = drawResultsRef.current.map(item => item.card).filter(Boolean); // 提取所有有效 card

    if (newCards.length > 0) {
      setGalleryHistory(prevGalleryHistory => {
        const combined = [...prevGalleryHistory, ...newCards];
        return removeDuplicates(combined);
      });
    }
  }
}, [history.length]);






  // ========================================================
  // 背景音乐设置
  const audioRef = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true); // 默认播放

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.3;

      // 尝试自动播放音乐，只会在组件挂载时自动播放一次
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .catch((err) => {
            console.warn("自动播放失败：", err);
          })
          .then(() => {
            console.log("音频自动播放成功");
          });
      }
    }

    // 清理：组件卸载时不需要做额外处理
    return () => {};
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 如果音频正在播放，点击暂停；如果音频暂停，点击播放
    if (isMusicPlaying) {
      audio.pause();  // 暂停音频
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("音频播放成功");
          })
          .catch((err) => {
            console.warn("播放失败：", err);
          });
      }
    }

    // 更新播放状态
    setIsMusicPlaying(!isMusicPlaying);
  };

  useEffect(() => {
    // 如果其他音频或视频播放器引起了音频暂停，我们尝试恢复播放
    const audio = audioRef.current;
    if (!audio) return;

    const forcePlay = () => {
      setTimeout(() => {
        if (audio.paused && isMusicPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .catch((err) => {
                console.warn("尝试恢复音频失败", err);
              })
              .then(() => {
                console.log("音频恢复播放");
              });
          }
        }
      }, 100); // 等待 100ms 后再恢复，避免系统冲突
    };

    audio.addEventListener("pause", forcePlay);

    // 清理：移除事件监听器
    return () => {
      audio.removeEventListener("pause", forcePlay);
    };
  }, [isMusicPlaying]);




  // ========================================================
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
  //抽卡动画结束后开始展示卡片
  // 处理跳过视频的逻辑
// ==============================
// ✅ useEffect：控制卡片展示或结算页展示
  useEffect(() => {
    const allResults = drawResultsRef.current || [];
    const onlyFiveStars = allResults.filter(item => item.card?.star === '5星');

    if (
      allResults.length > 0 &&
      !hasShownSummary &&
      !isDrawing &&
      !isAnimatingDrawCards &&
      !showAnimationDrawCards
    ) {
      if (videoSkipped) {
        if (onlyFiveStars.length === 0) {
          // 跳过且没有五星卡，直接展示结算
          setShowCardOverlay(false);
          setShowSummary(true);
          setHasShownSummary(true);
        } else {
          // 跳过但有五星卡，只展示五星卡片
          displayResultsRef.current = onlyFiveStars;
          setShowCardOverlay(true);
          setShowSummary(false);
        }
      } else {
        // 正常播放流程，展示全部卡片
        displayResultsRef.current = allResults;
        setCurrentCardIndex(0);
        setShowCardOverlay(true);
        setShowSummary(false);
      }
    }
  }, [
    videoSkipped,
    showAnimationDrawCards,
    isDrawing,
    isAnimatingDrawCards,
    hasShownSummary,
  ]);

  const handleNextCard = () => {
    // 每次点下一张卡时都先重置视频播放状态
    setVideoPlayed(false);

    if (showSummary) return;

    if (currentCardIndex < displayResultsRef.current.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
    } else {
      setShowCardOverlay(false);
      setSummaryCards(drawnCards);
      if (!hasShownSummary) {
        setShowSummary(true);
        setHasShownSummary(true);
      }
    }
  };



const handleDraw = async (count) => {
  if (isDrawing || isAnimatingDrawCards) return;

  setIsDrawing(true);
  setisAnimatingDrawCards(true);

  const currentDrawId = Date.now();
  drawSessionIdRef.current = currentDrawId;

  setShowSummary(false);
  setShowCardOverlay(false);
  setHasShownSummary(false);
  setCurrentCardIndex(0);
  setVideoSkipped(false);
  displayResultsRef.current = [];
  drawResultsRef.current = [];

  let drawResults = [];
  let currentPity = pityCount;
  let currentFourStarCounter = currentFourStarRef.current;

  let localSoftPityFailed = softPityFailed;

  for (let i = 0; i < count; i++) {
    let result;

    if (onlySelectedRoleCard && selectedRole !== '随机') {
      // 只抽当前角色卡，关闭大小保底
      do {
        result = getRandomCard(currentPity, currentFourStarCounter, false);
      } while (!includeThreeStar && result.rarity === '3');

      if (result.rarity === '5') {
        currentPity = 0;
        currentFourStarCounter = 0;
      } else {
        currentPity++;
        currentFourStarCounter = result.rarity === '4' ? 0 : currentFourStarCounter + 1;
      }
    } else {
      // 启用或关闭大小保底逻辑
      const mustBeTarget = useSoftGuarantee && selectedRole !== '随机' && localSoftPityFailed;

      do {
        result = getRandomCard(currentPity, currentFourStarCounter, mustBeTarget);
      } while (!includeThreeStar && result.rarity === '3');

      if (result.rarity === '5') {
        currentPity = 0;
        currentFourStarCounter = 0;

        if (useSoftGuarantee && selectedRole !== '随机') {
          if (result.card?.character === selectedRole) {
            localSoftPityFailed = false; // 命中选定角色
          } else {
            localSoftPityFailed = true;  // 小保底失败，开启大保底
          }
        }
      } else {
        currentPity++;
        currentFourStarCounter = result.rarity === '4' ? 0 : currentFourStarCounter + 1;
      }
    }

    drawResults.push(result);
    setTotalDrawCount(prev => prev + 1);
    if (result.rarity === '5') setTotalFiveStarCount(prev => prev + 1);
  }

  // 更新状态
  setIsDrawing(false);
  drawResultsRef.current = drawResults;
  currentPityRef.current = currentPity;
  currentFourStarRef.current = currentFourStarCounter;
  setSoftPityFailed(localSoftPityFailed);
  setHasFiveStarAnimation(drawResults.some(r => r.rarity === '5'));
  setShowAnimationDrawCards(true);
  setDrawnCards(drawResults.map(r => r.card).filter(Boolean));
};







  // ========================================================
  // 随机生成一张卡片，并根据保底计数器 (pity) 计算是否触发保底效果
const getRandomCard = (
  pity,
  fourStarCounter,
  mustBeTargetFiveStar = false,
  selectedRole = '随机',
  onlySelectedRoleCard = false,
  includeThreeStar = true
) => {
  let rarity;
  let pool = [];

  const roll = Math.random() * 100;

  // ⭐⭐⭐⭐ 五星概率计算 ⭐⭐⭐⭐
  let dynamicFiveStarRate = 1;
  if (pity >= 60) {
    dynamicFiveStarRate = 1 + (pity - 59) * 10;
  }


  // ⭐⭐⭐⭐ 四星概率固定 ⭐⭐⭐⭐
  const fourStarRate = 7;

  // ⭐⭐⭐⭐ 保底判断 ⭐⭐⭐⭐
  if (fourStarCounter >= 9) {
    rarity = roll < dynamicFiveStarRate ? '5' : '4';
  } else if (roll < dynamicFiveStarRate) {
    rarity = '5';
  } else if (roll < dynamicFiveStarRate + fourStarRate) {
    rarity = '4';
  } else {
    rarity = '3';
  }

  const targetStar = parseInt(rarity);

  // ⭐⭐⭐⭐ 筛选卡池 ⭐⭐⭐⭐
  if (targetStar === 5) {
    if (onlySelectedRoleCard && selectedRole !== '随机') {
      pool = cardData.filter(card => card.character === selectedRole && parseInt(card.star) === 5);
    } else if (mustBeTargetFiveStar && selectedRole !== '随机') {
      pool = cardData.filter(card => card.character === selectedRole && parseInt(card.star) === 5);
    } else {
      pool = cardData.filter(card => parseInt(card.star) === 5);
    }
  } else {
    if (onlySelectedRoleCard && selectedRole !== '随机') {
      pool = cardData.filter(card =>
        card.character === selectedRole &&
        parseInt(card.star) === targetStar &&
        (includeThreeStar || targetStar !== 3)
      );
    } else {
      pool = cardData.filter(card =>
        parseInt(card.star) === targetStar &&
        (includeThreeStar || targetStar !== 3)
      );
    }
  }

  if (pool.length === 0) return { card: null, rarity };
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return { card: chosen, rarity };
};



window.testDraws = (numDraws = 100000) => {
  let pity = 0;
  let fourStarCounter = 0;
  let fiveStarCount = 0;
  let fourStarCount = 0;
  let threeStarCount = 0;

  for (let i = 0; i < numDraws; i++) {
    const result = getRandomCard(pity, fourStarCounter, false, '随机', false, true);
    const rarity = result.rarity;

    if (rarity === '5') {
      fiveStarCount++;
      pity = 0;  // Reset pity after 5-star draw
      fourStarCounter++;
    } else {
      pity++;
      if (rarity === '4') {
        fourStarCount++;
        fourStarCounter = 0; // Reset counter after 4-star draw
      } else {
        threeStarCount++;
        fourStarCounter++;
      }
    }
  }

  const total = fiveStarCount + fourStarCount + threeStarCount;

  console.log(`⭐ 抽卡总次数：${total}`);
  console.log(`⭐ 五星数量：${fiveStarCount}（${(fiveStarCount / total * 100).toFixed(2)}%）`);
  console.log(`⭐ 四星数量：${fourStarCount}（${(fourStarCount / total * 100).toFixed(2)}%）`);
  console.log(`⭐ 三星数量：${threeStarCount}（${(threeStarCount / total * 100).toFixed(2)}%）`);
  console.log(`⭐ 平均出金：${(total / fiveStarCount).toFixed(2)}`);
};










  // ========================================================
  // 动画结束后处理卡片的展示和历史记录的更新
  const handleDrawCardsAnimationEnd = () => {
    const finalResults = drawResultsRef.current;
    const finalPity = currentPityRef.current;
    setPityCount(finalPity);
    setCards(finalResults.map(r => r.card));

    setHistory(prev => {
    const updated = [
      ...prev, // 保留旧的记录
      ...finalResults.map(r => ({
        ...r.card,
        timestamp: new Date().toISOString(),
      })), // 追加新的记录
    ];
    return updated.slice(-10000); // 保留最新的10000条
  });

    setShowAnimationDrawCards(false);
    setisAnimatingDrawCards(false);
  };




  // ========================================================
  // 返回数据时显示的页面
  return (
      <div
          className="relative w-screen h-screen cursor-pointer overflow-hidden outline-none focus:outline-none"
          tabIndex={0}
      >

        {/*/!*音频*!/*/}
        <audio
            ref={audioRef}
            loop
            src="audios/时空引力.mp3"
        />

        {/* 视频层（最底层） */}
        <video
            preload="auto"
            autoPlay
            loop
            playsInline
            muted
            controls={false}
            onEnded={() => {
              const validDrawId = drawSessionIdRef.current;
              if (!validDrawId) return;
              setisAnimatingDrawCards(false);

              drawSessionIdRef.current = 0; // 重置流程 ID，防止后续重复触发

            }}
            className="fixed top-0 left-0 w-full h-full object-cover z-0">
          <source src="videos/开屏动画.mp4" type="video/mp4"/>
        </video>

        {/* 控件层（中间层） */}
        <SettingsLayer
            totalDrawCount={totalDrawCount}
            totalFiveStarCount={totalFiveStarCount}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onlySelectedRoleCard={onlySelectedRoleCard}
            setonlySelectedRoleCard={setOnlySelectedRoleCard}
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
            clearLocalData={clearLocalData}
            toggleMusic={toggleMusic}
            isMusicPlaying={isMusicPlaying}
            setShowGallery={setShowGallery}
        />


        {/* 抽卡动画层 */}
        {showAnimationDrawCards && (
            <DrawAnimationCards
                isFiveStar={hasFiveStarAnimation}
                onAnimationEnd={handleDrawCardsAnimationEnd}
                cards={drawResultsRef.current.map((r) => r.card)}
                onSkip={(skipped) => setVideoSkipped(skipped)}
                isSingleDraw={isSingleDraw}
                className="fixed inset-0 z-20"
            />
        )}

        {/* 卡片结果层（最顶层） */}
        <CardOverlay
            showCardOverlay={showCardOverlay}
            currentCardIndex={currentCardIndex}
            drawResultsRef={displayResultsRef}
            videoPlayed={videoPlayed}
            setVideoPlayed={setVideoPlayed}
            handleNextCard={handleNextCard}
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

        {/*查看图鉴*/}
        {showGallery && (
          <GalleryPage
            allCards={galleryHistory}
            onClose={() => setShowGallery(false)}
          />
        )}

      </div>
  );
};

export default Home;