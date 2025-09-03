import React, {useEffect, useState, useRef} from 'react';
import cardData from './assets/cards.json';
import songsList from './assets/songs_list.json'
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import HistoryModal from './components/HistoryModal';
import TestProbability from "./components/TestProbability.jsx";
import CardOverlay from './components/CardOverlay';
import SettingsLayer from "./components/SettingsLayer.jsx";
import CardSummary from "./components/CardSummary.jsx";
import useLocalStorageState from './hooks/useLocalStorageState'
import GalleryPage from "./components/GalleryPage.jsx";
import 'react-lazy-load-image-component/src/effects/blur.css';
import {useHistoryDB} from "./hooks/useHistoryDB.js";
import useResponsiveFontSize from "./hooks/useResponsiveFontSize.js";
import MusicPage from "./components/MusicPage.jsx";
import VideoPage from "./components/VideoPage.jsx";
import { Asset } from './components/Asset.jsx';


const Home = ({isPortrait, openAssetTest}) => {

    // 加载serviceWorker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('service_worker.js')
                .then((reg) => {
                    console.log('✅ SW registered:', reg);

                    // 可选：注销旧的 Service Worker（如果你在更新服务工作者时需要这样做）
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => {
                            const expectedScope = location.origin + '/'; // 或者 '/deepspace/'，取决于你的路径
                            if (registration.scope !== expectedScope) {
                                registration.unregister().then((success) => {
                                    console.log('🗑️ Unregistered old SW:', registration.scope, success);
                                });
                            }
                        });
                    });
                })
                .catch((err) => {
                    console.error('❌ SW registration failed:', err);
                });
        });
    }


    // ========================================================
    // 数据存储与恢复

    // 总抽卡数
    const [totalDrawCount, setTotalDrawCount] = useLocalStorageState('ds_totalDrawCount', 0);
    // 选择的角色
    const [selectedRole, setSelectedRole] = useLocalStorageState('ds_selectedRole', '随机');
    // 总出金数
    const [totalFiveStarCount, setTotalFiveStarCount] = useLocalStorageState('ds_totalFiveStarCount', 0);
    // 下次出金还需要多少
    const [pityCount, setPityCount] = useLocalStorageState('ds_pityCount', 0);
    // 是否开启大小保底机制
    const [useSoftGuarantee, setUseSoftGuarantee] = useLocalStorageState('ds_useSoftGuarantee', true);
    // 目前是小保底还是大保底
    const [softPityFailed, setSoftPityFailed] = useLocalStorageState('ds_softPityFailed', false);
    // 是否包括三星
    const [includeThreeStar, setIncludeThreeStar] = useLocalStorageState('ds_includeThreeStar', true);
    // 是否只抽当前角色的卡
    const [onlySelectedRoleCard, setOnlySelectedRoleCard] = useLocalStorageState('ds_onlySelectedRoleCard', false);
    // 历史记录
    const { history, loading, appendHistory, clearHistory } = useHistoryDB();

    const fontsize = useResponsiveFontSize({scale: 0.9});

    const [musicID, setMusicID] = useLocalStorageState("ds_musicID", songsList[0]["id"].slice(0,10))
    
    // 全局音量控制
    const [globalVolume, setGlobalVolume] = useLocalStorageState("ds_globalVolume", 1.0)

    // 音效增益控制
    const [sfxGain, setSfxGain] = useLocalStorageState("ds_sfxGain", 1.0)


    // 清除缓存数据
    const clearLocalData = () => {
        const keysToClear = [
            'ds_totalDrawCount',
            'ds_totalFiveStarCount',
            'ds_pityCount',
            'ds_useSoftGuarantee',
            'ds_softPityFailed',
            'ds_selectedRole',
            'ds_includeThreeStar',
            'ds_onlySelectedRoleCard',
            'ds_musicID',
            'ds_globalVolume',
            'ds_sfxGain', // 添加这一行
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
        clearHistory();
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
    const [showProbability, setShowProbability] = useState(false); // 是否展示概率测试界面

    const [galleryHistory, setGalleryHistory] = useState([]);  // 图鉴历史



    // 根据 name 去重
    const removeDuplicates = (arr) => {
        const seen = new Set();
        return arr.filter((item) => {
            const key = item.name;
            const isDup = seen.has(key);
            seen.add(key);
            return !isDup;
        });
    };

    // 初始化 galleryHistory
    useEffect(() => {
        if (!loading && history.length > 0) {
            // 合并精简记录和完整卡牌数据
            const enriched = history
                .map((entry) => {
                    const fullCard = cardData.find((card) => card.name === entry.name);
                    return fullCard ? { ...fullCard, timestamp: entry.timestamp } : null;
                })
                .filter(Boolean); // 移除找不到的

            const uniqueHistory = removeDuplicates(enriched);
            setGalleryHistory(uniqueHistory);
        }
    }, [loading, history]);



    // // ========================================================
    // // 背景音乐设置
    // const audioRef = useRef(null);
    // const [isMusicPlaying, setIsMusicPlaying] = useState(false); // 默认播放
    //
    // useEffect(() => {
    //     const audio = audioRef.current;
    //     if (audio) {
    //         audio.volume = 0.3;
    //
    //         // 尝试自动播放音乐，只会在组件挂载时自动播放一次
    //         const playPromise = audio.play();
    //         if (playPromise !== undefined) {
    //             playPromise
    //                 .catch((err) => {
    //                     console.warn("自动播放失败：", err);
    //                 })
    //                 .then(() => {
    //                     console.log("音频自动播放成功");
    //                 });
    //         }
    //     }
    //     // 清理：组件卸载时不需要做额外处理
    //     return () => {};
    // }, []);
    //
    // const toggleMusic = () => {
    //     const audio = audioRef.current;
    //     if (!audio) return;
    //
    //     // 如果音频正在播放，点击暂停；如果音频暂停，点击播放
    //     if (isMusicPlaying) {
    //         audio.pause();  // 暂停音频
    //     } else {
    //         const playPromise = audio.play();
    //         if (playPromise !== undefined) {
    //             playPromise
    //                 .then(() => {
    //                     console.log("音频播放成功");
    //                 })
    //                 .catch((err) => {
    //                     console.warn("播放失败：", err);
    //                 });
    //         }
    //     }
    //     // 更新播放状态
    //     setIsMusicPlaying(!isMusicPlaying);
    // };
    //
    // useEffect(() => {
    //     // 如果其他音频或视频播放器引起了音频暂停，我们尝试恢复播放
    //     const audio = audioRef.current;
    //     if (!audio) return;
    //
    //     const forcePlay = () => {
    //         setTimeout(() => {
    //             if (audio.paused && isMusicPlaying) {
    //                 const playPromise = audio.play();
    //                 if (playPromise !== undefined) {
    //                     playPromise
    //                         .catch((err) => {
    //                             console.warn("尝试恢复音频失败", err);
    //                         })
    //                         .then(() => {
    //                             console.log("音频恢复播放");
    //                         });
    //                 }
    //             }
    //         }, 100); // 等待 100ms 后再恢复，避免系统冲突
    //     };
    //     audio.addEventListener("pause", forcePlay);
    //     // 清理：移除事件监听器
    //     return () => {
    //         audio.removeEventListener("pause", forcePlay);
    //     };
    // }, [isMusicPlaying]);




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
                    result = getRandomCard(
                        currentPity,
                        currentFourStarCounter,
                        false,
                        selectedRole,
                        onlySelectedRoleCard,
                        includeThreeStar
                    );
                  // result = getRandomCard(currentPity, currentFourStarCounter, false);
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
                const mustBeTarget = (
                    (useSoftGuarantee && selectedRole !== '随机' && localSoftPityFailed)
                    || (selectedRole !== '随机' && !useSoftGuarantee)
                );

                do {
                    result = getRandomCard(
                        currentPity,
                        currentFourStarCounter,
                        mustBeTarget,
                        selectedRole,
                        onlySelectedRoleCard,
                        includeThreeStar
                    );
                    // result = getRandomCard(currentPity, currentFourStarCounter, mustBeTarget);
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
        if (pity >= 60) dynamicFiveStarRate = 1 + (pity - 59) * 10;

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



    const handleDrawCardsAnimationEnd = async () => {
        const finalResults = drawResultsRef.current;
        const finalPity = currentPityRef.current;
        setPityCount(finalPity);
        setCards(finalResults.map(r => r.card));

        // 保存到 IndexedDB 中
        const newEntries = finalResults.map(r => ({
            name: r.card.name,
            character: r.card.character,
            star: r.card.star,
            timestamp: new Date().toISOString(),
        }));
        await appendHistory(newEntries); // 自动维护 100000 条限制

        setShowAnimationDrawCards(false);
        setisAnimatingDrawCards(false);
    };





    // ======================================= 获取容器尺寸（16:9下）
    const [baseSize, setBaseSize] = useState(1);
    const divRef = useRef(null); // 获取当前绑定的容器的尺寸

    useEffect(() => {
        const updateSize = () => {
            if (divRef.current) {
                const width = divRef.current.clientWidth;
                const height = divRef.current.clientHeight;

                if (height > 0) {
                    const newBaseSize = width / 375;
                    setBaseSize(newBaseSize);
                    return true;
                }
            }
            return false;
        };

        // 初始化时轮询直到能获取有效高度
        const tryInitSize = () => {
            const success = updateSize();
            if (!success) {
                // 如果失败，延迟一帧继续尝试
                requestAnimationFrame(tryInitSize);
            }
        };
        tryInitSize(); // 启动初始化
        window.addEventListener('resize', updateSize); // 响应窗口变化

        return () => {window.removeEventListener('resize', updateSize);};
    }, []);



    const [showMusicPageZIndex, setShowMusicPageZIndex] = useState(-1);
    const [showVideoPageZIndex, setShowVideoPageZIndex] = useState(-1);
    const [videoUrl, setVideoUrl] = useState('');

    // ========================================================
    // 返回数据时显示的页面
    return (
        <div
            ref={divRef}
            className="w-full h-full relative overflow-hidden"
            tabIndex={0}
        >

            {/*/!*音频*!/*/}
            {/*<audio*/}
            {/*    ref={audioRef}*/}
            {/*    loop*/}
            {/*    src="audios/时空引力.mp3"*/}
            {/*/>*/}


            <MusicPage
                baseSize={baseSize}
                songsList={songsList}
                showMusicPageZIndex={showMusicPageZIndex}
                setShowMusicPageZIndex={setShowMusicPageZIndex}
                musicID={musicID}
                setMusicID={setMusicID}
            />

            {showVideoPageZIndex > 0 && (
                <VideoPage
                    fontsize={fontsize}
                    showPageZIndex={showVideoPageZIndex}
                    setShowPageZIndex={setShowVideoPageZIndex}
                    video_url={videoUrl}
                    isPortrait={isPortrait}
                />
            )}



            {/* 视频层（最底层） */}
            <Asset
                src="开屏动画.mp4"
                type="video"
                autoPlay
                muted
                playsInline
                volume={globalVolume}
                onEnded={() => {
                    const validDrawId = drawSessionIdRef.current;
                    if (!validDrawId) return;
                    setisAnimatingDrawCards(false);
                    drawSessionIdRef.current = 0; // 重置流程 ID，防止后续重复触发
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', zIndex: 0, pointerEvents: 'none' }}
            />
            {/* <video
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
            </video> */}

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
                setShowGallery={setShowGallery}
                showProbability={showProbability}
                setShowProbability={setShowProbability}
                fontsize={fontsize}
                musicID={musicID}
                setMusicID={setMusicID}
                showMusicPageZIndex={showMusicPageZIndex}
                setShowMusicPageZIndex={setShowMusicPageZIndex}
                openAssetTest={openAssetTest}
                globalVolume={globalVolume}
                setGlobalVolume={setGlobalVolume}
                sfxGain={sfxGain}
                setSfxGain={setSfxGain}
            />


            {/* 抽卡动画层 */}
            {showAnimationDrawCards && (
                <DrawAnimationCards
                    isFiveStar={hasFiveStarAnimation}
                    onAnimationEnd={handleDrawCardsAnimationEnd}
                    onSkip={(skipped) => setVideoSkipped(skipped)}
                    isSingleDraw={isSingleDraw}
                    fontsize={fontsize}
                    globalVolume={globalVolume}
                    sfxGain={sfxGain} // 添加这一行
                />
            )}

            {/* 卡片结果层（最顶层） */}
            <CardOverlay
                key={currentCardIndex}
                showCardOverlay={showCardOverlay}
                currentCardIndex={currentCardIndex}
                drawResultsRef={displayResultsRef}
                videoPlayed={videoPlayed}
                setVideoPlayed={setVideoPlayed}
                handleNextCard={handleNextCard}
                fontsize={fontsize}
                globalVolume={globalVolume}
                sfxGain={sfxGain} // 添加这一行
            />


            {/*十抽后结算层*/}
            {showSummary && drawResultsRef.current.length > 1 && (
                <CardSummary
                    drawResults={drawResultsRef.current}  // 传递卡片数据
                    onClose={() => setShowSummary(false)}  // 关闭总结页面的回调
                    fontsize={fontsize}
                />
            )}

            {/* 页面 抽卡历史记录内容 */}
            <HistoryModal
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                history={history}
                fontsize={fontsize}
            />

            {/*查看图鉴*/}
            {showGallery && (
                <GalleryPage
                    isPortrait={isPortrait}
                    allCards={galleryHistory}
                    onClose={() => setShowGallery(false)}
                    fontsize={fontsize}
                    videoUrl={videoUrl}
                    setVideoUrl={setVideoUrl}
                    showPageZIndex={showVideoPageZIndex}
                    setShowPageZIndex={setShowVideoPageZIndex}
                />
            )}

            {showProbability && (
                <TestProbability
                    getRandomCard={getRandomCard}
                    setShowProbability={setShowProbability}
                    fontsize={fontsize}
                />
            )}

        </div>
    );
};

export default Home;