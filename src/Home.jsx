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

  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 当前的卡片索引
  const [cards, setCards] = useState([]); // 存储抽卡后的卡片信息
  const [history, setHistory] = useState([]); // 存储抽卡历史记录
  const [drawnCards, setDrawnCards] = useState([]); // 存储已抽到的卡片的数组
  const drawResultsRef = useRef([]); // 引用存储抽卡结果的数组，避免重新渲染时丢失数据，保存每次抽卡的结果，以便后续处理和展示


  const [selectedRole, setSelectedRole] = useState('随机'); // 当前选择的角色
  const roles = ['随机', ...new Set(cardData.map(card => card.character))]; // 存储可选择的角色列表

  const [includeThreeStar, setIncludeThreeStar] = useState(true); // 设置是否包括三星
  const [onlySelectedRoleCard, setOnlySelectedRoleCard] = useState(false); //设置是否只抽所有单一角色的卡

  const drawSessionIdRef = useRef(0); // 全局流程控制 ID，抽卡直接出现结果的bug
  const [isDrawing, setIsDrawing] = useState(false);

  const [videoSkipped, setVideoSkipped] = useState(false); // 设置跳过视频的状态
  const isSingleDraw = drawnCards.length === 1; //是否是一抽，一抽的话不要显示跳过按钮

  const [totalDrawCount, setTotalDrawCount] = useState(0); // 统计总抽卡数
  const [totalFiveStarCount, setTotalFiveStarCount] = useState(0); // 统计总出金数


  const [pityCount, setPityCount] = useState(0); // 保底计数器
  const [softPityFailed, setSoftPityFailed] = useState(false); //小保底是否激活
  const [useSoftGuarantee, setUseSoftGuarantee] = useState(true); // 是否开启小保底
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
  // 数据存储
  useEffect(() => {
    // 保存到 localStorage
    localStorage.setItem('totalDrawCount', totalDrawCount);
    localStorage.setItem('totalFiveStarCount', totalFiveStarCount);
    localStorage.setItem('pityCount', pityCount);
    localStorage.setItem('useSoftGuarantee', useSoftGuarantee ? 'true' : 'false'); // boolean 转字符串
    localStorage.setItem('history', JSON.stringify(history)); // 保存历史记录
  }, [totalDrawCount, totalFiveStarCount, pityCount, useSoftGuarantee, history]);

  useEffect(() => {
    // 从 localStorage 恢复状态
    const savedDrawCount = localStorage.getItem('totalDrawCount');
    const savedFiveStarCount = localStorage.getItem('totalFiveStarCount');
    const savedPityCount = localStorage.getItem('pityCount');
    const savedUseSoftGuarantee = localStorage.getItem('useSoftGuarantee');
    const savedHistory = localStorage.getItem('history');

    // 恢复数据
    if (savedDrawCount) {
      setTotalDrawCount(parseInt(savedDrawCount, 10)); // 恢复抽卡总数
    }
    if (savedFiveStarCount) {
      setTotalFiveStarCount(parseInt(savedFiveStarCount, 10)); // 恢复五星卡片数
    }
    if (savedPityCount) {
      setPityCount(parseInt(savedPityCount, 10)); // 恢复保底计数
    }
    if (savedUseSoftGuarantee) {
      setUseSoftGuarantee(savedUseSoftGuarantee === 'true'); // 恢复是否启用软保底
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory)); // 恢复历史记录
    }
  }, []); // 只在初次加载时执行一次

// useEffect(() => {
//   localStorage.setItem('totalDrawCount', totalDrawCount);
//   localStorage.setItem('totalFiveStarCount', totalFiveStarCount); // 同步保存五星卡总数
// }, [totalDrawCount, totalFiveStarCount]);

// useEffect(() => {
//   // 保存抽卡总数、五星卡总数、剩余抽卡次数和是否使用小保底
//   localStorage.setItem('totalDrawCount', totalDrawCount);
//   localStorage.setItem('totalFiveStarCount', totalFiveStarCount); // 同步保存五星卡总数
//   localStorage.setItem('pityCount', pityCount); // 保存剩余抽卡次数
//   localStorage.setItem('useSoftGuarantee', useSoftGuarantee); // 保存是否开启小保底
// }, [totalDrawCount, totalFiveStarCount, pityCount, useSoftGuarantee]);






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

  if (onlySelectedRoleCard && selectedRole !== '随机') {
    // 只抽该角色的卡
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
        if (useSoftGuarantee) {
          if (softPityFailed) {
            // 大保底触发：抽目标角色
            pool = cardData.filter(
              card => card.character === selectedRole && parseInt(card.star) === 5
            );
          } else {
            // 正常保底池
            pool = cardData.filter(card => parseInt(card.star) === 5);
          }
        } else {
          // 不使用保底机制，直接限定为指定角色
          pool = cardData.filter(
            card => card.character === selectedRole && parseInt(card.star) === 5
          );
        }
      } else {
        pool = cardData.filter(
          card =>
            parseInt(card.star) === targetStar &&
            (includeThreeStar || parseInt(card.star) !== 3)
        );
      }
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