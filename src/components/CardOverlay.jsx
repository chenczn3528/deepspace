// CardOverlay.jsx
import React, {useEffect, useState} from 'react';
import { Asset } from './Asset.jsx';


const CardOverlay = ({
    showCardOverlay,
    currentCardIndex,
    drawResultsRef,
    videoPlayed,
    setVideoPlayed,
    handleNextCard,
    fontsize,
}) => {

    const isCurrentFiveStar = drawResultsRef.current[currentCardIndex]?.card?.star === '5星';


    // ========================================================
    // 设置对应卡片的字体阴影颜色
    const characterShadowColors = {
      "沈星回": '4px 4px 8px rgba(133,82,161,1)',
      "黎深": '4px 4px 8px rgba(16,43,106,1)',
      "祁煜": '4px 4px 8px rgba(239,91,156,1)',
      "秦彻": '4px 4px 8px rgba(170,33,22,1)',
      "夏以昼": '4px 4px 8px rgba(244,121,32,1)',
      // 默认值也可以设一个
      default: '2px 2px 4px rgba(0, 0, 0, 0.8)'
    };
    const currentCharacter = drawResultsRef.current[currentCardIndex]?.card?.character;
    const shadowColor = characterShadowColors[currentCharacter] || characterShadowColors.default;


    // ========================================================
    // 使用 Asset 播放音效（自动播放，随索引/显示状态变化重新挂载触发播放）
    const audioKey = `${showCardOverlay ? 1 : 0}-${currentCardIndex}`;


    // 预加载小图，等大图加载完以后跳出来
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!drawResultsRef.current[currentCardIndex]?.card?.image) return;

        const img = new Image();
        img.src = drawResultsRef.current[currentCardIndex]?.card?.image;
        img.onload = () => {
            setLoaded(true);
        };
    }, [drawResultsRef.current[currentCardIndex]?.card?.image]);


    return (
        showCardOverlay && (
            <div className="absolute w-full h-full"
               onClick={() => {if (!isCurrentFiveStar || videoPlayed) {handleNextCard();}}}// 只有视频播放完了，才能允许切换
            >
                {/* 底部图片（绝对定位） */}
                
                {/* <img
                    src="images/结算背景.jpg"
                    alt="底部装饰"
                    className="absolute w-full h-full flex z-0"
                /> */}
                <Asset  
                    src="结算背景.jpg"
                    type="image"
                    className="absolute w-full h-full flex z-0"
                />

                {isCurrentFiveStar && !videoPlayed && (
                    // 视频播放层
                    <video
                        className="absolute w-full h-full object-cover z-20"
                        preload="auto"
                        autoPlay
                        playsInline
                        muted
                        controls={false}
                        onEnded={() => setVideoPlayed(true)}
                        style={{ pointerEvents: 'none' }}
                    >
                        <source
                            src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.mp4`}
                            type="video/mp4"
                        />
                            Your browser does not support the video tag.
                    </video>
                )}


                {/* 展示卡片内容 */}
                {(isCurrentFiveStar && videoPlayed) || !isCurrentFiveStar ? (
                    <>
                        <div className="relative w-full h-full flex z-10">
                            <div
                                className="absolute w-full h-full transition-opacity duration-300"
                                style={{
                                    backgroundImage: `url(${drawResultsRef.current[currentCardIndex]?.card?.image_small || drawResultsRef.current[currentCardIndex]?.card?.image})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    filter: "blur(20px)",
                                    opacity: loaded ? 0 : 1,
                                }}
                            />

                            {/* 高清图：加载完后显示并播放动画 */}
                            {loaded && (
                                <div
                                    className="absolute w-full h-full animate-fadeZoomIn"
                                    style={{
                                        backgroundImage: `url(${drawResultsRef.current[currentCardIndex]?.card?.image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                            )}
                        </div>

                        <div className="absolute flex items-center z-20"
                             style={{bottom: `${fontsize * 6}px`, left: `${fontsize * 2}px`}}>
                            <Asset
                                src={`${drawResultsRef.current[currentCardIndex]?.card?.star}.png`}
                                type="image"
                                style={{marginRight: `${fontsize * 0.6}px`, height: `${fontsize * 2.5}px`}}
                            />

                            <Asset
                                src={`${drawResultsRef.current[currentCardIndex]?.card?.card_color_tag}.png`}
                                type="image"
                                style={{marginRight:`${fontsize * 0.2}px`, height: `${fontsize * 1.8}px`}}
                            />

                            <Asset
                                src={`${drawResultsRef.current[currentCardIndex]?.card?.card_type_tag}.png`}
                                type="image"
                                style={{height: `${drawResultsRef.current[currentCardIndex]?.card?.card_type_tag === "日冕" ? 
                                      fontsize * 2.5 : fontsize * 1.8}px`}}
                            />
                            
                            {/* <img
                                src={`images/${drawResultsRef.current[currentCardIndex]?.card?.star}.png`}
                                style={{marginRight: `${fontsize * 0.6}px`, height: `${fontsize * 2.5}px`}}
                            />
                            <img
                                src={`images/${drawResultsRef.current[currentCardIndex]?.card?.card_color_tag}.png`}
                                style={{marginRight:`${fontsize * 0.2}px`, height: `${fontsize * 1.8}px`}}
                            />
                            <img
                                src={`images/${drawResultsRef.current[currentCardIndex]?.card?.card_type_tag}.png`}
                                style={{height: `${drawResultsRef.current[currentCardIndex]?.card?.card_type_tag === "日冕" ? 
                                      fontsize * 2.5 : fontsize * 1.8}px`}}
                            /> */}
                        </div>


                        {/* 文字区域 */}
                        <div className="absolute flex items-center z-20" style={{bottom: `${fontsize * 2}px`, left: `${fontsize * 2}px`}}>
                            <label
                                style={{
                                    color: 'white',
                                    fontSize: `${fontsize * 2}px`,
                                    textShadow: shadowColor,
                                    fontWeight: '800',
                                    marginLeft: '2px',
                                }}
                            >
                                {drawResultsRef.current[currentCardIndex]?.card?.character}  ·
                            </label>

                            <label
                                style={{
                                    color: 'white',
                                    fontSize: `${fontsize * 2.8}px`,
                                    textShadow: shadowColor,
                                    fontWeight: '800',
                                    marginLeft: '2px',
                                }}
                            >
                                {drawResultsRef.current[currentCardIndex]?.card?.name}
                            </label>
                        </div>

                        {/* 音效：使用 Asset 自动播放，避免手动 new Audio 造成缓存不走 */}
                        <Asset
                            key={audioKey}
                            src={isCurrentFiveStar ? '金卡展示.mp3' : '切换音效.mp3'}
                            type="audio"
                            autoPlay
                            style={{ display: 'none' }}
                        />
                    </>
                ) : null}
            </div>
        )
    );
};

export default CardOverlay;
