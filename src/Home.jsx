import React, {useEffect, useState, useRef, useMemo} from 'react';
import DrawAnimationCards from './components/DrawAnimationCards.jsx';
import HistoryModal from './components/HistoryModal';
import TestProbability from "./components/TestProbability.jsx";
import CardOverlay from './components/CardOverlay';
import SettingsLayer from "./components/SettingsLayer.jsx";
import CardSummary from "./components/CardSummary.jsx";
import useLocalStorageState from './hooks/useLocalStorageState'
import GalleryPage from "./components/GalleryPage.jsx";
import CardPoolFilter from "./components/CardPoolFilter.jsx";
import 'react-lazy-load-image-component/src/effects/blur.css';
import {useHistoryDB} from "./hooks/useHistoryDB.js";
import useResponsiveFontSize from "./hooks/useResponsiveFontSize.js";
import MusicPage from "./components/MusicPage.jsx";
import VideoPage from "./components/VideoPage.jsx";
import { Asset } from './components/Asset.jsx';
import { useData } from './contexts/DataContext.jsx';
import { initCacheManager } from './utils/cacheManager.js';


const Home = ({isPortrait, openAssetTest}) => {
    const { cardData, songsList } = useData();

    useEffect(() => {
        initCacheManager();
    }, []);

    // 加载serviceWorker
    if ('serviceWorker' in navigator) {
        let swRefreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (swRefreshing) return;
            swRefreshing = true;
            window.location.reload();
        });

        window.addEventListener('load', () => {
            // 注册 Service Worker，添加时间戳确保获取最新版本
            const swUrl = `service_worker.js?t=${Date.now()}`;
            navigator.serviceWorker
                .register(swUrl)
                .then((reg) => {
                    console.log('✅ SW registered:', reg);

                    // 启动时主动检查更新
                    reg.update();

                    // 检查 Service Worker 更新
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // 有新版本可用，提示用户刷新
                                    console.log('🔄 发现新版本，建议刷新页面');
                                    if (reg.waiting) {
                                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                                    } else {
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    }
                                }
                            });
                        }
                    });

                    // 定期检查更新（每小时检查一次）
                    setInterval(() => {
                        reg.update();
                    }, 3600000); // 1小时

                    // 注销不同域名的旧 Service Worker
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => {
                            const expectedScope = location.origin + '/';
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
    const [selectedRoleFilters, setSelectedRoleFilters] = useLocalStorageState('ds_selectedRoleFilters', []);
    // 总出金数
    const [totalFiveStarCount, setTotalFiveStarCount] = useLocalStorageState('ds_totalFiveStarCount', 0);
    const [offTargetFiveStarCount, setOffTargetFiveStarCount] = useLocalStorageState('ds_offTargetFiveStarCount', 0);
    const [targetFiveStarCount, setTargetFiveStarCount] = useLocalStorageState('ds_targetFiveStarCount', 0);
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
            'ds_selectedRoleFilters',
            'ds_selectedPools',
            'ds_includeThreeStar',
            'ds_onlySelectedRoleCard',
            'ds_musicID',
            'ds_globalVolume',
            'ds_sfxGain', // 添加这一行
            'ds_offTargetFiveStarCount',
            'ds_targetFiveStarCount',
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

    const roles = ['随机', '沈星回', '黎深', '祁煜', '秦彻', '夏以昼']; // 存储可选择的角色列表

    const handleSelectedRoleChange = (role) => {
        setSelectedRole(role);
        if (role === '随机') {
            setSelectedRoleFilters([]);
        } else {
            setSelectedRoleFilters([role]);
        }
    };

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
    const [showCardPoolFilter, setShowCardPoolFilter] = useState(false); // 是否展示筛选卡池界面

    // 提取所有可用的池子
    const cleanPoolName = (name) => {
        if (!name) return "";
        return name.replace(/^\[+/, "").trim();
    };

    const extractPoolName = (getStr) => {
        if (!getStr) return "";
        const bracketMatch = getStr.match(/[\[【]([^】\]]+)[\]】]/);
        if (bracketMatch) {
            return cleanPoolName(bracketMatch[1].replace(/「|」/g, ""));
        }
        const quoteMatch = getStr.match(/「([^」]+)」/);
        if (quoteMatch) {
            return cleanPoolName(quoteMatch[1]);
        }
        return cleanPoolName(getStr);
    };

    // 获取所有池子列表
    const isExcludedPool = (name) => name === '许愿';

    const allPools = useMemo(() => {
        const poolSet = new Set();
        cardData.forEach((card) => {
            if (parseInt(card.star) === 5) {
                const pool = extractPoolName(card.get);
                if (pool && !isExcludedPool(pool)) {
                    poolSet.add(pool);
                }
            }
        });
        return Array.from(poolSet);
    }, []);

    const [selectedPools, setSelectedPools] = useLocalStorageState('ds_selectedPools', allPools);

    const hasPoolRestrictions = useMemo(() => {
        if (!Array.isArray(selectedPools) || selectedPools.length === 0) return false;
        return allPools.some((pool) => !selectedPools.includes(pool));
    }, [selectedPools, allPools]);

    const ensureUnique = (array) => Array.from(new Set(array));

    useEffect(() => {
        if (!Array.isArray(selectedPools)) return;
        let updated = selectedPools.filter(pool => !isExcludedPool(pool));
        const hasPermanent = updated.includes('常驻');
        if (!hasPermanent) {
            updated = [...updated, '常驻'];
        }
        updated = ensureUnique(updated);
        if (JSON.stringify(updated) !== JSON.stringify(selectedPools)) {
            setSelectedPools(updated);
        }
    }, [selectedPools]);

    const [galleryHistory, setGalleryHistory] = useState([]);  // 图鉴历史

    const cardMapByName = useMemo(() => {
        const map = new Map();
        cardData.forEach((card) => {
            if (card?.name) {
                map.set(card.name, card);
            }
        });
        return map;
    }, []);



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
                    const fullCard = cardMapByName.get(entry.name);
                    return fullCard ? { ...fullCard, timestamp: entry.timestamp } : null;
                })
                .filter(Boolean); // 移除找不到的

            const uniqueHistory = removeDuplicates(enriched);
            setGalleryHistory(uniqueHistory);
        }
    }, [loading, history, cardMapByName]);




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

        const restrictedRoles = selectedRoleFilters && selectedRoleFilters.length > 0
            ? selectedRoleFilters
            : (selectedRole !== '随机' ? [selectedRole] : []);
        const hasRoleRestrictions = restrictedRoles.length > 0;
        const hasSoftGuaranteeTarget = hasRoleRestrictions || hasPoolRestrictions;
        const onlySelectedRoleActive = hasRoleRestrictions && restrictedRoles.length === 1 && onlySelectedRoleCard;

        for (let i = 0; i < count; i++) {
            let result;

            if (onlySelectedRoleActive) {
              // 只抽当前角色卡，关闭大小保底
                do {
                    result = getRandomCard(
                        currentPity,
                        currentFourStarCounter,
                        restrictedRoles,
                        true,
                        includeThreeStar,
                        true,
                        false
                    );
                  // result = getRandomCard(currentPity, currentFourStarCounter, false);
                } while (!includeThreeStar && result.rarity === '3');

                if (result.rarity === '5') {
                    currentPity = 0;
                    currentFourStarCounter = 0;

                    const card = result.card;
                    const isLimitedFiveStar = card ? ((card.permanent || '') !== '常驻') : false;
                    const hitTargetRole = card ? restrictedRoles.includes(card.character) : false;
                    const isOnTarget = isLimitedFiveStar && hitTargetRole;
                    if (isOnTarget) {
                        setTargetFiveStarCount((prev) => prev + 1);
                    } else {
                        setOffTargetFiveStarCount((prev) => prev + 1);
                    }
                } else {
                    currentPity++;
                    currentFourStarCounter = result.rarity === '4' ? 0 : currentFourStarCounter + 1;
                }
            } else {
                // 启用或关闭大小保底逻辑
                const shouldForceLimited = useSoftGuarantee && hasSoftGuaranteeTarget && localSoftPityFailed;
                const forceTargetRole = shouldForceLimited && hasRoleRestrictions;
                const forceLimitedOnly = shouldForceLimited && !hasRoleRestrictions && hasPoolRestrictions;
                do {
                    result = getRandomCard(
                        currentPity,
                        currentFourStarCounter,
                        restrictedRoles,
                        onlySelectedRoleActive,
                        includeThreeStar,
                        forceTargetRole,
                        forceLimitedOnly
                    );
                } while (!includeThreeStar && result.rarity === '3');

                if (result.rarity === '5') {
                    currentPity = 0;
                    currentFourStarCounter = 0;

                    const card = result.card;
                    const isLimitedFiveStar = card ? ((card.permanent || '') !== '常驻') : false;
                    let isOnTarget = true;
                    if (hasRoleRestrictions) {
                        const hitTargetRole = card ? restrictedRoles.includes(card.character) : false;
                        isOnTarget = isLimitedFiveStar && hitTargetRole;
                    } else if (hasPoolRestrictions) {
                        isOnTarget = isLimitedFiveStar;
                    }
                    if (isOnTarget) {
                        setTargetFiveStarCount((prev) => prev + 1);
                    } else {
                        setOffTargetFiveStarCount((prev) => prev + 1);
                    }

                    if (useSoftGuarantee && hasSoftGuaranteeTarget) {
                        const hitTargetRole = result.card && restrictedRoles.includes(result.card.character);
                        const hitLimitedPool = result.card && (result.card.permanent || '') !== '常驻';
                        if (hasRoleRestrictions) {
                            if (hitTargetRole && hitLimitedPool) {
                                localSoftPityFailed = false; // 命中限定角色
                            } else {
                                localSoftPityFailed = true;  // 小保底失败，开启大保底
                            }
                        } else if (hasPoolRestrictions) {
                            localSoftPityFailed = hitLimitedPool ? false : true;
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
        restrictedRoles = [],
        onlySelectedRoleCard = false,
        includeThreeStar = true,
        forceTargetRole = false,
        forceLimitedOnly = false
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
        const activeRoles = Array.isArray(restrictedRoles) ? restrictedRoles.filter(Boolean) : [];
        const limitToRoles = activeRoles.length > 0;
        const filterBySelectedPools = (cards) => {
            if (!selectedPools || selectedPools.length === 0) return cards;
            const poolSet = new Set(selectedPools);
            poolSet.add('常驻');
            const filtered = cards.filter(card => {
                const poolName = extractPoolName(card.get);
                return poolName ? poolSet.has(poolName) : false;
            });
            return filtered.length > 0 ? filtered : cards;
        };

        if (targetStar === 5) {
            pool = cardData.filter(card =>
                parseInt(card.star) === 5
            );
            pool = filterBySelectedPools(pool);
            if (forceTargetRole && limitToRoles) {
                const forcedPool = pool.filter(card => {
                    if (!activeRoles.includes(card.character)) return false;
                    return (card.permanent || '') !== '常驻';
                });
                if (forcedPool.length > 0) {
                    pool = forcedPool;
                }
            } else if (onlySelectedRoleCard && limitToRoles) {
                const roleOnlyPool = pool.filter(card => activeRoles.includes(card.character));
                if (roleOnlyPool.length > 0) {
                    pool = roleOnlyPool;
                }
            }
            if (forceLimitedOnly) {
                const limitedPool = pool.filter(card => (card.permanent || '') !== '常驻');
                if (limitedPool.length > 0) {
                    pool = limitedPool;
                }
            }
        } else {
            if (onlySelectedRoleCard && limitToRoles) {
                pool = cardData.filter(card =>
                    activeRoles.includes(card.character) &&
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
    const [videoInfo, setVideoInfo] = useState({ bvid: '', page: 1 });

    // ========================================================
    // 返回数据时显示的页面
    return (
        <div
            ref={divRef}
            className="w-full h-full relative overflow-hidden"
            tabIndex={0}
        >


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
                    videoInfo={videoInfo}
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

            {/* 控件层（中间层） */}
            <SettingsLayer
                totalDrawCount={totalDrawCount}
                totalFiveStarCount={totalFiveStarCount}
                offTargetFiveStarCount={offTargetFiveStarCount}
                targetFiveStarCount={targetFiveStarCount}
                selectedRole={selectedRole}
                setSelectedRole={handleSelectedRoleChange}
                selectedRoleFilters={selectedRoleFilters}
                onlySelectedRoleCard={onlySelectedRoleCard}
                setonlySelectedRoleCard={setOnlySelectedRoleCard}
                roles={roles}
                includeThreeStar={includeThreeStar}
                setIncludeThreeStar={setIncludeThreeStar}
                useSoftGuarantee={useSoftGuarantee}
                setUseSoftGuarantee={setUseSoftGuarantee}
                hasPoolRestrictions={hasPoolRestrictions}
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
                setShowCardPoolFilter={setShowCardPoolFilter}
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
                    setVideoInfo={setVideoInfo}
                    showPageZIndex={showVideoPageZIndex}
                    setShowPageZIndex={setShowVideoPageZIndex}
                />
            )}

            {showProbability && (
                <TestProbability
                    getRandomCard={getRandomCard}
                    setShowProbability={setShowProbability}
                    fontsize={fontsize}
                    selectedRole={selectedRole}
                    selectedRoleFilters={selectedRoleFilters}
                    onlySelectedRoleCard={onlySelectedRoleCard}
                    includeThreeStar={includeThreeStar}
                    useSoftGuarantee={useSoftGuarantee}
                    softPityFailed={softPityFailed}
                    hasPoolRestrictions={hasPoolRestrictions}
                />
            )}

            {showCardPoolFilter && (
                <CardPoolFilter
                    fontsize={fontsize}
                    showCardPoolFilter={showCardPoolFilter}
                    setShowCardPoolFilter={setShowCardPoolFilter}
                    selectedPools={selectedPools}
                    setSelectedPools={setSelectedPools}
                    poolsLoaded={true}
                    selectedRoleFilters={selectedRoleFilters}
                    setSelectedRoleFilters={setSelectedRoleFilters}
                    updateSelectedRole={setSelectedRole}
                    handleSelectedRoleChange={handleSelectedRoleChange}
                    selectedRole={selectedRole}
                />
            )}

        </div>
    );
};

export default Home;
