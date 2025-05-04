import React, {useState, useMemo, useEffect} from 'react';
import { FullImageViewer } from './FullImageViewer';
import LeftIcon from './LeftIcon.jsx'
import FunctionIcon from "./FunctionIcon.jsx";

export const GalleryPage = ({ allCards, onClose }) => {
  const [selectedCharacter, setSelectedCharacter] = useState('全部');
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [squareView, setSquareView] = useState(false);

  const filteredCards = useMemo(() => {
    const sorted = [...allCards].sort((a, b) => b.star - a.star);
    return selectedCharacter === '全部'
      ? sorted
      : sorted.filter((c) => c.character === selectedCharacter);
  }, [selectedCharacter, allCards]);

  console.log("allCards:", allCards)


  return (
      <div
          className="h-screen w-screen z-60 relative flex flex-col"
          style={{backgroundImage: "url('images/结算背景.jpg')"}}
      >
          {/* 顶部操作栏 */}
          <div className="flex justify-between items-center mb-4 ml-[20px] mr-[20px]">
              <button
                  onClick={onClose}
                  style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      position: 'fixed', // 使按钮脱离flex布局
                      top: '20px',  // 靠近顶部
                      left: '20px', // 靠近右侧
                      width: 'auto',
                      height: 'auto',
                  }}
              >
                  <LeftIcon size={24} color="black"/>
              </button>

              <h2
                  style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: '800'
                  }}
              >
                  图鉴
              </h2>


              <button
                  onClick={() => setSquareView(!squareView)}
                  style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      margin: 0,
                      position: 'fixed', // 使按钮脱离flex布局
                      top: '20px',  // 靠近顶部
                      right: '20px', // 靠近右侧
                      width: 'auto',
                      height: 'auto',
                  }}
              >
                  <img
                      src={squareView ? "images/放大.png" : "images/缩小.png"}
                      alt="music toggle"
                      className="w-[24px] h-[24px]"
                  />
              </button>
          </div>


          {/*选择角色*/}
          <div className="ml-[20px] mr-[20px]">
              <div style={{display: 'flex', width: '100%'}}>
                  {/* 左侧“全部”按钮 */}
                  <button
                      onClick={() => setSelectedCharacter('全部')}
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
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                          {['沈星回', '黎深', '祁煜'].map((char) => (
                              <button
                                  key={char}
                                  onClick={() => setSelectedCharacter(char)}
                                  style={{
                                      flex: 1,
                                      padding: '0',
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
                      <div style={{width: '100%', height: '1px', backgroundColor: '#ccc', marginBottom: '0.5rem'}}/>

                      {/* 下面两个 */}
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          {['秦彻', '夏以昼'].map((char) => (
                              <button
                                  key={char}
                                  onClick={() => setSelectedCharacter(char)}
                                  style={{
                                      flex: 1,
                                      padding: '0',
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
                  marginTop: '8px',
                  marginBottom: '14px',
                  borderBottom: '2px solid #888', // 灰色线条
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 1)', // 让阴影向下扩散
              }}
          >
              {/* 你的内容 */}
          </div>


          {/* 卡片网格展示 */}
          <div className="h-screen overflow-y-auto">
              <div className="grid grid-cols-3 gap-[16px] p-4 ml-[20px] mr-[20px] mt-[10px] mb-[20px]">
                  {filteredCards.map((card, index) => (
                      <div
                          key={card.name}
                          className="relative w-full"
                          style={{paddingBottom: squareView ? '100%' : '177.78%'}}
                      >
                          {/*星谱*/}
                          <img
                              src={card.card_color}
                              alt="icon"
                              className="absolute top-[4px] left-[4px] w-[20px] z-10"
                          />

                          <div
                              className="absolute bottom-0 left-0 w-full h-[20px] bg-gray-400 z-10"
                              // style={{zIndex: 10}} // 确保它覆盖在主图底部
                          />

                          {/*日卡月卡*/}
                          <img
                              src={card.card_type}
                              alt="icon"
                              className="absolute bottom-[28px] left-[4px] w-[20px] z-10"
                          />

                          {/*主图*/}
                          <img
                              src={card.image_small}
                              alt={card.name}
                              className={`absolute inset-0 w-full h-full rounded ${squareView ? 'object-cover object-top' : 'object-cover'}`}
                              style={{maxHeight: squareView ? 'auto' : 'calc(100% - 24px)'}}
                              onClick={() => {
                                  setCurrentIndex(index);
                                  setShowFullImage(true);
                              }}
                          />

                          {/* 渐变灰色覆盖层 */}
                          <div
                            className="absolute bottom-[24px] left-0 w-full"
                            style={{
                              height: '28px',
                              background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.4))',
                              pointerEvents: 'none', // 保证点击透传到下方
                            }}
                          />

                          {/*星级*/}
                          <img
                              src={card.card_star_icon}
                              alt="icon"
                              className="absolute bottom-[28px] right-[4px] h-[16px] z-10"
                          />

                          {/*名称*/}
                          <div
                              className="absolute bottom-[0px] left-0 right-0 text-center text-white"
                              style={{
                                  textAlign: 'center',
                                  fontSize: '12px',         // 设置字体大小
                                  whiteSpace: 'nowrap',     // 禁止换行
                                  overflow: 'hidden',       // 超出隐藏
                              }}
                          >
                              {card.character}·{card.name}
                          </div>
                      </div>

                  ))}
              </div>
          </div>

          <div className="h-[20px] bg-transparent"/>


          {/* 全屏大图预览 */}
          {showFullImage && (
              <FullImageViewer
                  cards={filteredCards}
                  currentIndex={currentIndex}
                  onClose={() => setShowFullImage(false)}
                  setCurrentIndex={setCurrentIndex}
              />
          )}
      </div>
  );
};
