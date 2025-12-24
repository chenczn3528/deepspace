import React, {useState, useMemo, useEffect} from 'react';
import FullImageViewer from './FullImageViewer';
import FunctionIcon from "../icons/FunctionIcon.jsx";
import LeftIcon from "../icons/LeftIcon.jsx";
import FullScreenIcon from "../icons/FullScreenIcon.jsx";
import SmallScreenIcon from "../icons/SmallScreenIcon.jsx";
import LockIcon from "../icons/LockIcon.jsx";
import BlurIcon from "../icons/BlurIcon.jsx";
import cardData from '../assets/cards.json';
import { Asset } from './Asset.jsx';


const GalleryPage = ({
     allCards,
     onClose,
     fontsize,
     videoUrl,
     setVideoUrl,
     showPageZIndex,
     setShowPageZIndex,
}) => {

    const [showAllCards, setShowAllCards] = useState(false);
    const [withLockCards, setWithLockCards] = useState([]);
    const [showLockIcon, setShowLockIcon] = useState(false);
    const [isBlurEnabled, setIsBlurEnabled] = useState(() => {
        const saved = localStorage.getItem('gallery-blur-enabled');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        setWithLockCards(cardData);
    }, []);

    // 保存模糊状态到localStorage
    useEffect(() => {
        localStorage.setItem('gallery-blur-enabled', JSON.stringify(isBlurEnabled));
    }, [isBlurEnabled]);

    useEffect(()=>{
        if(selectedCharacter === "全部") {
            setShowAllCards(false);
            setShowLockIcon(false);
        }
    })

    const displayedCards = useMemo(() => {
        if (!withLockCards) return []; // 加载未完成前返回空数组

        const ownedNames = new Set(allCards.map(c => c.name));

        if (showAllCards) {
            return withLockCards.map(card => ({
                ...card,
                owned: ownedNames.has(card.name),
            }));
        }

        return allCards.map(card => ({ ...card, owned: true }));
    }, [showAllCards, withLockCards, allCards]);



    const [selectedCharacter, setSelectedCharacter] = useState('全部');
    const [showFullImage, setShowFullImage] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [squareView, setSquareView] = useState(false);

    const filteredCards = useMemo(() => {
        const sorted = [...displayedCards].sort((a, b) => b.star - a.star);
        return selectedCharacter === '全部'
            ? sorted
            : sorted.filter((c) => c.character === selectedCharacter);
    }, [selectedCharacter, displayedCards]);




    const [sortOption, setSortOption] = useState("稀有度");

    // 稀有度排序
    const rarityOrder = { '5星': 1, '4星': 2, '3星': 3 };

    // 角色排序
    const roleOrder = {"沈星回": 1, "黎深": 2, "祁煜": 3, "秦彻": 4, "夏以昼": 5};

    // 星谱排序
    const starMapOrder = {
        "全部": {"绿珥": 1, "蓝弧": 2, "紫辉": 3, "黄璃": 4, "红漪": 5, "粉珀": 6},
        "沈星回": {"绿珥": 1, "黄璃": 2, "红漪": 3, "粉珀": 4, "蓝弧": 5, "紫辉": 6},
        "黎深": {"蓝弧": 1, "红漪": 2, "粉珀": 3, "黄璃": 4, "紫辉": 5, "绿珥": 6},
        "祁煜": {"紫辉": 1, "粉珀": 2, "黄璃": 3, "红漪": 4, "绿珥": 5, "蓝弧": 6},
        "秦彻": {"粉珀": 1, "绿珥": 2, "蓝弧": 3, "紫辉": 4, "黄璃": 5, "红漪": 6},
        "夏以昼": {"红漪": 1, "紫辉": 2, "绿珥": 3, "蓝弧": 4, "粉珀": 5, "黄璃": 6},
    };

    // 套装排序
    const suitOrder = {"日冕": 1, "月晖": 2};

    // 获取稀有度索引
    const getRarityIndex = (card) => rarityOrder[card.star] || 999;

    // 获取角色排序索引
    const getRoleIndex = (card) => roleOrder[card.character] || 999;

    // 获取星谱排序索引
    const getStarMapIndex = (card) => {
        const map = selectedCharacter === "全部"
            ? starMapOrder["全部"]
            : starMapOrder[card.character] || starMapOrder["全部"];
        return map[card.card_color_tag || ""] || 999;
    };


    // 获取套装排序索引
    const getSuitIndex = (card) => suitOrder[card.card_type_tag || ""] || 999;

    const sortedCards = [...filteredCards].sort((a, b) => {
      // 打印比较的每个卡片信息，查看排序逻辑是否正确
        if (sortOption === "稀有度") {
            return (
                getRarityIndex(a) - getRarityIndex(b) ||
                getRoleIndex(a) - getRoleIndex(b) ||
                getSuitIndex(a) - getSuitIndex(b) ||
                getStarMapIndex(a) - getStarMapIndex(b)
            );
        }

        if (sortOption === "套装") {
            return (
                getSuitIndex(a) - getSuitIndex(b) ||
                getRarityIndex(a) - getRarityIndex(b) ||
                getRoleIndex(a) - getRoleIndex(b) ||
                getStarMapIndex(a) - getStarMapIndex(b)
            );
        }

        if (sortOption === "星谱") {
        return (
            getStarMapIndex(a) - getStarMapIndex(b) ||
            getRoleIndex(a) - getRoleIndex(b) ||
            getRarityIndex(a) - getRarityIndex(b) ||
            getSuitIndex(a) - getSuitIndex(b)
            );
        }

        return 0; // 默认返回0
    });





    return (
        <div
            className="absolute w-full h-full z-20"
        >
            <Asset
                src="结算背景.jpg"
                type="image"
                preferImmediateNetwork
                className="absolute w-full h-full object-cover"
                style={{ pointerEvents: 'none', zIndex: 0 }}
            />
            {/* 顶部操作栏 */}
            <div className="absolute flex flex-col"
                 style={{top: 0, height: `${fontsize * 10}px`, left: `${fontsize}px`, right: `${fontsize}px`}}>
                {/*第一行 返回按钮 锁定图标 图鉴 稀有度 缩放图标*/}
                <div className="flex flex-row items-center w-full h-[40%]">
                    {/*返回按钮*/}
                    <button
                        className="flex items-center z-20"
                        onClick={onClose}
                        style={{background: 'transparent', border: 'none', padding: 0,}}
                    >
                        <LeftIcon size={fontsize * 2} color="black"/>
                    </button>

                    {/*图鉴标题*/}
                    <label className="absolute left-0 w-full text-center"
                           style={{fontSize: `${fontsize * 2}px`, fontWeight: '800', color: 'black'}}>
                        图鉴
                    </label>

                    {/*解锁卡片按钮*/}
                    {showLockIcon && (
                        <button
                            className="flex items-center ml-[20px] z-20"
                            style={{background: 'transparent', border: 'none', padding: 0}}
                            onClick={() => {
                                if (selectedCharacter !== "全部") setShowAllCards(prev => !prev);
                            }}
                        >
                            {showAllCards ? <LockIcon size={fontsize * 2} color={'lightgray'}/> :
                                <LockIcon size={fontsize * 2} color={'black'}/>}
                        </button>
                    )}

                    {/*模糊按钮*/}
                    {showLockIcon && showAllCards && (
                        <button
                            className="flex items-center ml-[20px] z-20"
                            style={{background: 'transparent', border: 'none', padding: 0}}
                            onClick={() => setIsBlurEnabled(prev => !prev)}
                        >
                            <BlurIcon size={fontsize * 2} color={isBlurEnabled ? 'lightgray' : 'black'}/>
                        </button>
                    )}

                    <div className="absolute flex flex-row right-[0] items-center" style={{gap: `${fontsize}px`}}>
                        {/*排序*/}
                        <select
                            id="sortOption"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            style={{
                                background: 'transparent',
                                padding: 0,
                                color: 'black',
                                fontSize: `${fontsize * 1.1}px`
                            }}
                        >
                            <option value="稀有度">稀有度</option>
                            <option value="套装">套装</option>
                            <option value="星谱">星谱</option>
                        </select>

                        {/*图片大小*/}
                        <button
                            className="flex items-center"
                            onClick={() => setSquareView(!squareView)}
                            style={{background: 'transparent', border: 'none', padding: 0,}}
                        >
                            {squareView ? (
                                <FullScreenIcon color="black" size={fontsize * 2}/>
                            ) : (
                                <SmallScreenIcon color="black" size={fontsize * 2}/>
                            )}
                        </button>
                    </div>
                </div>

                {/*第二行 选择角色*/}
                <div className="flex flex-row h-[60%]">
                    {/*全部*/}
                    <button
                        className="flex w-[30%] h-full items-center justify-center"
                        onClick={() => {
                            setSelectedCharacter('全部');
                            setShowLockIcon(false);
                        }}
                        style={{
                            backgroundColor: selectedCharacter === '全部' ? 'black' : 'transparent',
                            color: selectedCharacter === '全部' ? 'white' : 'black',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            borderRadius: 0,
                        }}
                    >
                        <FunctionIcon color={selectedCharacter === '全部' ? 'white' : 'black'} size={fontsize * 1.5}/>
                        <span
                            style={{fontSize: `${fontsize * 1.6}px`, fontWeight: '600', marginLeft: "3px"}}>全部</span>
                    </button>

                    {/*上下两行*/}
                    <div className="w-[70%] grid grid-cols-3">
                        {/* 在第3个按钮后插入一条横线 */}
                        <div className="absolute top-[70%] w-[70%]"
                             style={{height: '1px', backgroundColor: 'lightgray'}}
                        />
                        {['沈星回', '黎深', '祁煜', '秦彻', '夏以昼'].map((char) => (
                            <div key={char} className="flex items-center justify-center">
                                <button
                                    key={char}
                                    onClick={() => {
                                        setSelectedCharacter(char);
                                        setShowLockIcon(true);
                                    }}
                                    className="flex items-center justify-center w-full h-full"
                                    style={{
                                        outline: 'none',
                                        boxShadow: 'none',
                                        padding: 0,
                                        borderRadius: 0,
                                        fontSize: `${fontsize * 1.3}px`,
                                        backgroundColor: selectedCharacter === char ? 'black' : 'transparent',
                                        color: selectedCharacter === char ? 'white' : 'black',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {char}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/*横线 + 阴影*/}
            <div
                className="absolute w-full h-[5px]"
                style={{
                    top: `${fontsize * 10}px`,
                    borderBottom: '2px solid #999',
                    boxShadow: '0 4px 6px -2px rgba(0, 0, 0, 0.4)',
                }}
            />


            {/*卡片网格展示*/}
            <div className="absolute w-full h-full overflow-y-auto z-30" style={{top: `${fontsize * 11.5}px`}}>
                <div className="grid grid-cols-3"
                     style={{gap: `${fontsize * 1.2}px`, margin: `${fontsize}px`}}>
                    {sortedCards.map((card, index) => {
                        return (
                            <div
                                key={card.name}
                                className="relative w-full"
                                style={{
                                    height: squareView ? `${fontsize * 12}px` : `${fontsize * 18}px`,
                                    overflow: 'hidden',
                                    borderRadius: '8px'
                                }}
                            >
                                {/*主图*/}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: squareView ? `${fontsize * 10}px` : `${fontsize * 16}px`,
                                        overflow: 'hidden',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <img
                                        src={card.image_small}
                                        alt={card.name}
                                        className={`w-full h-full ${squareView ? 'object-cover object-top' : 'object-cover'}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            filter: (isBlurEnabled && !card.owned) ? 'blur(6px)' : 'none',
                                            transition: 'filter 0.3s ease',
                                            transform: (isBlurEnabled && !card.owned) ? 'scale(1.05)' : 'scale(1)',
                                            transformOrigin: 'center'
                                        }}
                                        onClick={() => {
                                            setCurrentIndex(index);
                                            setShowFullImage(true);
                                        }}
                                    />
                                </div>

                                {/*星谱*/}
                                {/* <img
                                    src={`images/${card.card_color_tag}.png`}
                                    className="absolute"
                                    style={{top: `${fontsize * 0.3}px`, left: `${fontsize * 0.3}px`, width: `${fontsize * 1.5}px`}}
                                /> */}
                                <Asset
                                    src={`${card.card_color_tag}.png`}
                                    type="image"
                                    className="absolute"
                                    style={{top: `${fontsize * 0.3}px`, left: `${fontsize * 0.3}px`, width: `${fontsize * 1.5}px`}}
                                />

                                {/*日卡月卡*/}
                                {/* <img
                                    src={`images/${card.card_type_tag}.png`}
                                    className="absolute z-10"
                                    style={{
                                        bottom: card.card_type_tag === "月晖" ? `${fontsize * 2.3}px`: `${fontsize * 2.1}px`,
                                        left: `${fontsize * 0.3}px`,
                                        width: card.card_type_tag === "月晖" ? `${fontsize * 1.5}px` : `${fontsize * 1.8}px`
                                    }}
                                /> */}
                                <Asset
                                    src={`${card.card_type_tag}.png`}
                                    type="image"
                                    className="absolute z-10"
                                    style={{bottom: `${fontsize * 2.3}px`, left: `${fontsize * 0.3}px`, width: `${fontsize * 1.5}px`}}
                                />

                                {/*星级*/}
                                {/* <img
                                    src={`images/${card.star}.png`}
                                    className="absolute z-10"
                                    style={{bottom: `${fontsize * 2.3}px`, right: 0, height: `${fontsize * 1.3}px`}}
                                /> */}

                                <Asset
                                    src={`${card.star}.png`}
                                    type="image"
                                    className="absolute z-10"
                                    style={{bottom: `${fontsize * 2.3}px`, right: 0, height: `${fontsize * 1.3}px`}}
                                />

                                {/* 渐变灰色覆盖层 */}
                                <div
                                    className="absolute w-full"
                                    style={{
                                        bottom: `${fontsize * 2}px`,
                                        height: squareView ? `${fontsize * 3}px` : `${fontsize * 2.5}px`,
                                        background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.5))',
                                        pointerEvents: 'none',
                                    }}
                                />




                                {!card.owned && (
                                    <div
                                        className="absolute w-full h-full z-30 flex items-center justify-center"
                                        style={{
                                            height: squareView ? `${fontsize * 10}px` : `${fontsize * 16}px`,
                                            background: '#00000088',
                                            pointerEvents: 'none', // 保证点击透传到下方
                                        }}
                                    >
                                        <LockIcon size={fontsize * 2} color={'lightgray'} />
                                    </div>
                                )}



                                {/*名称*/}
                                <div
                                    className="absolute w-full flex items-center justify-center"
                                    style={{
                                        fontSize: `${fontsize}px`,
                                        color: 'black',
                                        bottom: 0,
                                        top: squareView ? `${fontsize * 10}px` : `${fontsize * 16}px`,
                                    }}
                                >
                                    <label>
                                        {card.character}·{card.name}
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/*能够滑到最下面看到完整的图*/}
                <div style={{height: `${fontsize * 16}px`}}/>
            </div>


            {/* 全屏大图预览 */}
            {showFullImage && (
                <FullImageViewer
                    key={currentIndex}
                    cards={sortedCards}
                    currentIndex={currentIndex}
                    onClose={() => setShowFullImage(false)}
                    setCurrentIndex={setCurrentIndex}
                    fontsize={fontsize}
                    videoUrl={videoUrl}
                    setVideoUrl={setVideoUrl}
                    showPageZIndex={showPageZIndex}
                    setShowPageZIndex={setShowPageZIndex}
                />
            )}
        </div>
    );
};


export default GalleryPage;
