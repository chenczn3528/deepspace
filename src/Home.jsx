import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import HistoryModal from './components/HistoryModal';
import CardOverlay from './components/CardOverlay';
import SettingsLayer from "./components/SettingsLayer.jsx";
import CardSummary from "./components/CardSummary.jsx";
import VideoPreloader from "./components/VideoPreloader.jsx";
import 'react-lazy-load-image-component/src/effects/blur.css';


const Home = () => {

  // ========================================================
  // 数据存储与恢复
  const getInitialValue = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    try {
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // 总抽卡数
  const [totalDrawCount, setTotalDrawCount] = useState(() => getInitialValue('totalDrawCount', 0));
  // 总出金数
  const [totalFiveStarCount, setTotalFiveStarCount] = useState(() => getInitialValue('totalFiveStarCount', 0));
  // 下次出金还需要多少
  const [pityCount, setPityCount] = useState(() => getInitialValue('pityCount', 0));
  // 是否开启大小保底机制
  const [useSoftGuarantee, setUseSoftGuarantee] = useState(() => getInitialValue('useSoftGuarantee', true));
  // 目前是小保底还是大保底
  const [softPityFailed, setSoftPityFailed] = useState(() => getInitialValue('softPityFailed', false));
  // 选择的角色
  const [selectedRole, setSelectedRole] = useState(() => getInitialValue('selectedRole', '随机'));
  // 是否包括三星
  const [includeThreeStar, setIncludeThreeStar] = useState(() => getInitialValue('includeThreeStar', true));
  // 是否只抽当前角色的卡
  const [onlySelectedRoleCard, setOnlySelectedRoleCard] = useState(() => getInitialValue('onlySelectedRoleCard', false));
  // 历史记录
  const [history, setHistory] = useState(() => getInitialValue('history', []));

  useEffect(() => {
    localStorage.setItem('totalDrawCount', JSON.stringify(totalDrawCount));
  }, [totalDrawCount]);

  useEffect(() => {
    localStorage.setItem('totalFiveStarCount', JSON.stringify(totalFiveStarCount));
  }, [totalFiveStarCount]);

  useEffect(() => {
    localStorage.setItem('pityCount', JSON.stringify(pityCount));
  }, [pityCount]);

  useEffect(() => {
    localStorage.setItem('useSoftGuarantee', JSON.stringify(useSoftGuarantee));
  }, [useSoftGuarantee]);

  useEffect(() => {
    localStorage.setItem('softPityFailed', JSON.stringify(softPityFailed));
  }, [softPityFailed]);

  useEffect(() => {
    localStorage.setItem('selectedRole', JSON.stringify(selectedRole));
  }, [selectedRole]);

  useEffect(() => {
    localStorage.setItem('includeThreeStar', JSON.stringify(includeThreeStar));
  }, [includeThreeStar]);

  useEffect(() => {
    localStorage.setItem('onlySelectedRoleCard', JSON.stringify(onlySelectedRoleCard));
  }, [onlySelectedRoleCard]);

  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
  }, [history]);

  // 清除按钮
  const clearLocalData = () => {
    localStorage.clear();     // 清空所有 localStorage 数据
    location.reload();        // 刷新页面以加载默认状态
  };



  // ========================================================
  // 其余变量
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 当前的卡片索引
  const [cards, setCards] = useState([]); // 存储抽卡后的卡片信息
  const [drawnCards, setDrawnCards] = useState([]); // 存储已抽到的卡片的数组
  const drawResultsRef = useRef([]); // 引用存储抽卡结果的数组，避免重新渲染时丢失数据，保存每次抽卡的结果，以便后续处理和展示

  const roles = ['随机', ...new Set(cardData.map(card => card.character))]; // 存储可选择的角色列表

  const drawSessionIdRef = useRef(0); // 全局流程控制 ID，抽卡直接出现结果的bug
  const [isDrawing, setIsDrawing] = useState(false);

  const [videoSkipped, setVideoSkipped] = useState(false); // 设置跳过视频的状态
  const isSingleDraw = drawnCards.length === 1; //是否是一抽，一抽的话不要显示跳过按钮

  const currentPityRef = useRef(0); // 引用存储当前保底计数器的值，在每次抽卡时更新，用于确定保底是否触发
  const currentFourStarRef = useRef(0); // 四星保底计数器的值

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



  // ========================================================
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

  // 在此处判断是否触发大保底机制，并根据是否失败来调整pool
  if (useSoftGuarantee && targetStar === 5) {
    if (softPityFailed) {
      // 大保底触发：强制抽目标角色
      pool = cardData.filter(
        card => card.character === selectedRole && parseInt(card.star) === 5
      );
    } else {
      // 普通抽取五星卡池
      pool = cardData.filter(card => parseInt(card.star) === 5);
    }
  } else {
    // 处理普通抽卡逻辑
    if (onlySelectedRoleCard && selectedRole !== '随机') {
      pool = cardData.filter(
        card =>
          card.character === selectedRole &&
          parseInt(card.star) === targetStar &&
          (includeThreeStar || parseInt(card.star) !== 3)
      );
    } else {
      if (selectedRole === '随机') {
        pool = cardData.filter(
          card =>
            parseInt(card.star) === targetStar &&
            (includeThreeStar || parseInt(card.star) !== 3)
        );
      } else {
        if (targetStar === 5) {
          // 保底机制仍然适用
          pool = cardData.filter(
            card => card.character === selectedRole && parseInt(card.star) === 5
          );
        } else {
          pool = cardData.filter(
            card =>
              parseInt(card.star) === targetStar &&
              (includeThreeStar || parseInt(card.star) !== 3)
          );
        }
      }
    }
  }

  if (pool.length === 0) {
    console.warn("没有找到匹配的卡片！", { rarity, selectedRole });
    return { card: null, rarity };
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];

  // 如果是5星且使用了大保底机制，检查是否抽到目标角色
  if (targetStar === 5 && selectedRole !== '随机' && useSoftGuarantee) {
    if (chosen.character === selectedRole) {
      setSoftPityFailed(false); // 如果抽到目标角色，重置大保底失败标志
    } else {
      setSoftPityFailed(true); // 如果没抽到目标角色，设置为大保底失败
    }
  }

  return { card: chosen, rarity };
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

    setTotalDrawCount((prevCount) => prevCount + 1); // 统计总抽卡数
    if (result.rarity === '5') {
      setTotalFiveStarCount((prevCount) => prevCount + 1); // 增加五星卡片数
    }

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




// const getRandomCard = (pity, fourStarCounter) => {
//   const fiveStarBase = 0.01;
//   const fourStarBase = 0.07;
//   const fiveStarPityStart = 60;
//   const fiveStarGuaranteed = 70;
//
//   let fiveStarChance = fiveStarBase;
//
//   if (pity >= fiveStarPityStart) {
//     fiveStarChance = Math.min(1, fiveStarBase + 0.1 * (pity - fiveStarPityStart + 1));
//   }
//
//   const roll = Math.random();
//   let rarity = '3';
//
//   if (pity + 1 >= fiveStarGuaranteed || roll < fiveStarChance) {
//     rarity = '5';
//   } else if ((fourStarCounter + 1) % 10 === 0) {
//     rarity = '4';
//   } else if (roll < fiveStarChance + fourStarBase) {
//     rarity = '4';
//   }
//
//   const targetStar = parseInt(rarity, 10);
//   let pool = [];
//
//   if (onlySelectedRoleCard && selectedRole !== '随机') {
//     // 只抽该角色的卡
//     pool = cardData.filter(
//       card =>
//         card.character === selectedRole &&
//         parseInt(card.star) === targetStar &&
//         (includeThreeStar || parseInt(card.star) !== 3)
//     );
//   } else {
//     if (selectedRole === '随机') {
//       pool = cardData.filter(
//         card =>
//           parseInt(card.star) === targetStar &&
//           (includeThreeStar || parseInt(card.star) !== 3)
//       );
//     } else {
//       if (targetStar === 5) {
//         if (useSoftGuarantee) {
//           if (softPityFailed) {
//             // 大保底触发：抽目标角色
//             pool = cardData.filter(
//               card => card.character === selectedRole && parseInt(card.star) === 5
//             );
//           } else {
//             // 正常保底池
//             pool = cardData.filter(card => parseInt(card.star) === 5);
//           }
//         } else {
//           // 不使用保底机制，直接限定为指定角色
//           pool = cardData.filter(
//             card => card.character === selectedRole && parseInt(card.star) === 5
//           );
//         }
//       } else {
//         pool = cardData.filter(
//           card =>
//             parseInt(card.star) === targetStar &&
//             (includeThreeStar || parseInt(card.star) !== 3)
//         );
//       }
//     }
//   }
//
//   if (pool.length === 0) {
//     console.warn("没有找到匹配的卡片！", { rarity, selectedRole });
//     return { card: null, rarity };
//   }
//
//   const chosen = pool[Math.floor(Math.random() * pool.length)];
//
//   if (targetStar === 5 && selectedRole !== '随机' && useSoftGuarantee) {
//     if (chosen.character === selectedRole) {
//       setSoftPityFailed(false);
//     } else {
//       setSoftPityFailed(true);
//     }
//   }
//
//   return { card: chosen, rarity };
// };
//
//
//
// // ========================================================
//   // 处理抽卡逻辑，调用 getRandomCard 函数并更新抽卡结果
//   const handleDraw = async (count) => {
//
//     if (isDrawing || isAnimatingDrawCards) return;
//     // 加锁
//     setIsDrawing(true);
//
//     setisAnimatingDrawCards(true);
//     setVideoPlayed(true); // 控制不能重复点击
//
//     const currentDrawId = Date.now();
//     drawSessionIdRef.current = currentDrawId;
//
//     let drawResults = [];
//     let currentPity = pityCount;
//     let currentFourStarCounter = currentFourStarRef.current;
//     let gotFourStarOrAbove = false;
//
//     for (let i = 0; i < count; i++) {
//       let result;
//
//       // 保证不包括三星时不会抽到三星
//       do {
//         result = getRandomCard(currentPity, currentFourStarCounter);
//       } while (!includeThreeStar && result.rarity === '3');
//
//       setTotalDrawCount((prevCount) => prevCount + 1); // 统计总抽卡数
//       if (result.rarity === '5') {
//         setTotalFiveStarCount((prevCount) => prevCount + 1); // 增加五星卡片数
//       }
//
//       // 处理保底逻辑
//       if (result.rarity === '5') {
//         currentPity = 0;
//         currentFourStarCounter++;
//       } else {
//         currentPity++;
//         if (result.rarity === '4') {
//           currentFourStarCounter = 0;
//           gotFourStarOrAbove = true;
//         } else {
//           currentFourStarCounter++;
//         }
//       }
//
//       drawResults.push(result);
//     }
//     setIsDrawing(false);
//
//     // 更新状态
//     drawResultsRef.current = drawResults;
//     currentPityRef.current = currentPity;
//     currentFourStarRef.current = currentFourStarCounter;
//     setHasFiveStarAnimation(drawResults.some(r => r.rarity === '5'));
//     setShowAnimationDrawCards(true);
//     setDrawnCards(drawResults.map(r => r.card).filter(Boolean));
//   };



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
  // 动画结束后处理卡片的展示和历史记录的更新
  const handleDrawCardsAnimationEnd = () => {
    const finalResults = drawResultsRef.current;
    const finalPity = currentPityRef.current;
    setPityCount(finalPity);
    setCards(finalResults.map(r => r.card));
    // setHistory(prev => [...finalResults.map(r => r.card), ...prev].slice(0, 50));
    // setHistory(prev => [...finalResults.map(r => ({...r.card, timestamp: new Date().toISOString(),})), ...prev,]);
    setHistory(prev => [
      ...prev, // 保留旧的记录
      ...finalResults.map(r => ({
        ...r.card,
        timestamp: new Date().toISOString(),
      })), // 追加新的记录
    ]);

    setShowAnimationDrawCards(false);
    setisAnimatingDrawCards(false);
  };





  // ========================================================
  // 判断是否要跳过抽卡动画，若跳过则传入展示的卡片数据不一样
  const displayResultsRef = useRef([]);

  useEffect(() => {
    const allResults = drawResultsRef.current || [];
    if (videoSkipped) {
      const onlyFiveStars = allResults.filter(item => item.card?.star === '5星');
      // console.log(onlyFiveStars)
      displayResultsRef.current = onlyFiveStars;
    } else {
      displayResultsRef.current = allResults;
    }

    // 如果跳过且没有五星卡，直接展示结算层（跳过 CardOverlay）
    if (videoSkipped && displayResultsRef.current.length === 0) {
      setShowCardOverlay(false);
      setShowSummary(true);
    }

    setVideoSkipped(false);
  }, [drawResultsRef.current, videoSkipped]);



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

        {/*<VideoPreloader />*/}

        {/*/!*音频*!/*/}
        <audio
            ref={audioRef}
            loop
            src="audios/时空引力.mp3"
            // src="https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E6%97%B6%E7%A9%BA%E5%BC%95%E5%8A%9B.mp3"
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

              setVideoPlayed(false);     // 播放结束后解锁
              setisAnimatingDrawCards(false);

              drawSessionIdRef.current = 0; // 重置流程 ID，防止后续重复触发

            }}
            className="fixed top-0 left-0 w-full h-full object-cover z-0">
          <source src="videos/开屏动画.mp4" type="video/mp4"/>
          {/*<source src="https://vqdlonhi.ap-northeast-1.clawcloudrun.com/d/deepspace/%E5%BC%80%E5%B1%8F%E5%8A%A8%E7%94%BB.mp4" type="video/mp4"/>*/}
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
          isFiveStar={isFiveStar}
          videoPlayed={videoPlayed}
          currentCardIndex={currentCardIndex}
          drawResultsRef={drawResultsRef}
          setVideoPlayed={setVideoPlayed}
          isSkipped={videoSkipped}
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