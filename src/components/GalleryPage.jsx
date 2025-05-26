import React, {useState, useMemo, useEffect} from 'react';
import { FullImageViewer } from './FullImageViewer';
import FunctionIcon from "../icons/FunctionIcon.jsx";
import LeftIcon from "../icons/LeftIcon.jsx";
import FullScreenIcon from "../icons/FullScreenIcon.jsx";
import SmallScreenIcon from "../icons/SmallScreenIcon.jsx";
import LockIcon from "../icons/LockIcon.jsx";
import cardData from '../assets/cards.json';


export const GalleryPage = ({ allCards, onClose }) => {

    const [showAllCards, setShowAllCards] = useState(false);
    const [withLockCards, setWithLockCards] = useState([]);
    const [showLockIcon, setShowLockIcon] = useState(false);

    useEffect(() => {
        setWithLockCards(cardData);
    }, []);

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
            className="h-screen w-screen z-60 relative flex flex-col overflow-hidden"
            style={{backgroundImage: "url('images/结算背景.jpg')"}}
        >
            {/* 顶部操作栏 */}
            <div className="flex justify-between items-center mb-4 ml-[3vw] mr-[3vw]">
                {/*返回按钮*/}
                <button
                    onClick={onClose}
                    className="fixed top-[3vw] left-[3vw]"
                    style={{background: 'transparent', border: 'none', padding: 0}}
                >
                    <LeftIcon size={24} color="black"/>
                </button>

                {/*解锁卡片按钮*/}
                {showLockIcon && (
                    <button
                        className="absolute top-[3vw] left-[16vw]"
                        style={{background: 'transparent', border: 'none', padding: 0}}
                        onClick={() => {
                            if (selectedCharacter !== "全部") setShowAllCards(prev => !prev);
                        }}
                    >
                        {showAllCards ? <LockIcon size={24} color={'lightgray'}/> :
                            <LockIcon size={24} color={'black'}/>}
                    </button>
                )}


                {/*图鉴标题*/}
                <label className="flex-1 text-center mt-[2vw] mb-[2vw]"
                       style={{fontSize: '1.5rem', fontWeight: '800', color: 'black'}}>
                    图鉴
                </label>


                <div className="absolute flex flex-row top-[3vw] right-[3vw] gap-[3vw]">
                    {/*排序*/}
                    <select
                        id="sortOption"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        style={{background: 'transparent', padding: 0, color: 'black'}}
                    >
                        <option value="稀有度">稀有度</option>
                        <option value="套装">套装</option>
                        <option value="星谱">星谱</option>
                    </select>

                    {/*图片大小*/}
                    <button
                        onClick={() => setSquareView(!squareView)}
                        style={{background: 'transparent', border: 'none', padding: 0,}}
                    >
                        {squareView ? (
                            <FullScreenIcon color="black" size={24} />
                        ) : (
                            <SmallScreenIcon color="black" size={24} />
                        )}
                    </button>
                </div>
            </div>


            {/*选择角色*/}
            <div className="ml-[3vw] mr-[3vw] mt-[0.5rem]">
              <div style={{display: 'flex', width: '100%'}}>
                  {/* 左侧“全部”按钮 */}
                  <button
                      onClick={() => {setSelectedCharacter('全部'); setShowLockIcon(false);}}
                      style={{
                          width: '30%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1rem',
                          borderRadius: '0.25rem',
                          backgroundColor: selectedCharacter === '全部' ? 'black' : 'transparent',
                          color: selectedCharacter === '全部' ? 'white' : 'black',
                          fontWeight: '600',
                          fontSize: '1.125rem', // 增大字体
                          transition: 'all 0.3s',
                          cursor: 'pointer',
                      }}
                  >
                      <FunctionIcon color={selectedCharacter === '全部' ? 'white' : 'black'} size={16}/>
                      <span className="ml-[4px]">全部</span>
                  </button>

                  {/* 右侧角色按钮区域 */}
                  <div style={{
                      width: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                  }}>
                      {/* 上面三个 */}
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          {['沈星回', '黎深', '祁煜'].map((char) => (
                              <button
                                  key={char}
                                  onClick={() => {setSelectedCharacter(char); setShowLockIcon(true);}}
                                  style={{
                                      flex: 1,
                                      padding: '0',
                                      height: '2rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '1rem', // 增大字体
                                      backgroundColor: selectedCharacter === char ? 'black' : 'transparent',
                                      color: selectedCharacter === char ? 'white' : 'black',
                                      transition: 'all 0.3s',
                                      cursor: 'pointer',
                                      margin: 0, // 删除按钮之间的间距
                                  }}
                              >
                                  {char}
                              </button>
                          ))}
                      </div>

                      {/* 分隔线 */}
                      <div style={{width: '100%', height: '1px', backgroundColor: '#ccc'}}/>

                      {/* 下面两个 */}
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          {['秦彻', '夏以昼'].map((char) => (
                              <button
                                  key={char}
                                  onClick={() => setSelectedCharacter(char)}
                                  style={{
                                      flex: 1,
                                      padding: '0',
                                      height: '2rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '1rem', // 增大字体
                                      backgroundColor: selectedCharacter === char ? 'black' : 'transparent',
                                      color: selectedCharacter === char ? 'white' : 'black',
                                      transition: 'all 0.3s',
                                      cursor: 'pointer',
                                      margin: 0, // 删除按钮之间的间距
                                  }}
                              >
                                  {char}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* 横线 + 阴影 */}
          <div
              style={{
                  marginTop: '0.5rem',
                  marginBottom: '0.8rem',
                  borderBottom: '2px solid #888', // 灰色线条
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 1)', // 让阴影向下扩散
              }}
          />


          {/* 卡片网格展示 */}
          <div className="h-screen overflow-y-auto">
              <div className="grid grid-cols-3 gap-[3vw] p-4 ml-[3vw] mr-[3vw] mt-[2vw] mb-[6vw]">
                  {sortedCards.map((card, index) => {
                      // const cardTypeHeight = '20px'
                      const cardTypeHeight = card.card_type_tag === "日冕" ? '5vw' :
                         card.card_type_tag === "月晖" ? '4vw' : '5vw';

                      return (
                          <div
                              key={card.name}
                              className="relative w-full"
                              style={{paddingBottom: squareView ? '99%' : '177.2%'}}
                          >
                              {/*星谱*/}
                              <img
                                  src={`images/${card.card_color_tag}.png`}
                                  alt="icon"
                                  className="absolute top-[1.5vw] left-[1.5vw] w-[4vw] z-10"
                              />

                              <div
                                  className="absolute bottom-0 left-0 w-full h-[20px] bg-gray-400 z-10"
                                  // style={{zIndex: 10}} // 确保它覆盖在主图底部
                              />

                              {/*日卡月卡*/}
                              <img
                                  src={`images/${card.card_type_tag}.png`}
                                  alt="icon"
                                  className={`absolute bottom-[5.5vw] left-[1vw] z-10`}
                                  style={{ width: cardTypeHeight }}
                              />

                              {/*主图*/}
                              <img
                                  src={card.image_small}
                                  alt={card.name}
                                  className={`absolute inset-0 w-full h-full rounded ${squareView ? 'object-cover object-top' : 'object-cover'}`}
                                  style={{maxHeight: squareView ? '25vw' : '48vw'}}//{{maxHeight: squareView ? 'auto' : 'calc(100% - 24px)'}}
                                  onClick={() => {
                                      setCurrentIndex(index);
                                      setShowFullImage(true);
                                  }}
                              />

                              {/* 渐变灰色覆盖层 */}
                              <div
                                className="absolute bottom-[4vw] left-0 w-full"
                                style={{
                                  height: '7vw',
                                  background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))',
                                  pointerEvents: 'none', // 保证点击透传到下方
                                }}
                              />


                              {!card.owned && (
                                  <div
                                      className="absolute bottom-[4vw] left-0 w-full h-full z-30 flex items-center justify-center"
                                      style={{
                                          maxHeight: squareView ? '25vw' : '48vw',
                                          background: '#00000088',
                                          pointerEvents: 'none', // 保证点击透传到下方
                                      }}
                                  >
                                      <LockIcon size={24} color={'lightgray'} />
                                  </div>
                              )}

                              {/*星级*/}
                              <img
                                  src={`images/${card.star}.png`}
                                  alt="icon"
                                  className="absolute bottom-[5vw] right-[1vw] h-[4vw] z-10"
                              />

                              {/*名称*/}
                              <div
                                  className="absolute bottom-[-0.5vw] w-full text-center text-white"
                                  style={{
                                      textAlign: 'center',
                                      fontSize: '3vw',         // 设置字体大小
                                      whiteSpace: 'nowrap',     // 禁止换行
                                      overflow: 'hidden',       // 超出隐藏
                                      color: 'black'
                                  }}
                              >
                                  {card.character}·{card.name}
                              </div>
                          </div>

                      );
                  })}
              </div>
          </div>

          <div className="h-[20px] bg-transparent"/>


          {/* 全屏大图预览 */}
          {showFullImage && (
              <FullImageViewer
                  cards={sortedCards}
                  currentIndex={currentIndex}
                  onClose={() => setShowFullImage(false)}
                  setCurrentIndex={setCurrentIndex}
              />
          )}
        </div>
    );
};
