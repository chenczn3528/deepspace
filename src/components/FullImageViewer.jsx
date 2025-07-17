import React, {useEffect, useRef, useState} from 'react';
import LeftIcon from "../icons/LeftIcon.jsx";
import RightIcon from "../icons/RightIcon.jsx";
import LockIcon from "../icons/LockIcon.jsx";
import ShortVideoIcon from "../icons/ShortVideoIcon.jsx";

const FullImageViewer = ({
     videoUrl,
     setVideoUrl,
     showPageZIndex,
     setShowPageZIndex,
     cards,
     currentIndex,
     setCurrentIndex,
     onClose,
     fontsize
}) => {

    const [showPicture, setShowPicture] = useState(false);
    const card = cards[currentIndex];

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };


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
    const currentCharacter = card.character;
    const shadowColor = characterShadowColors[currentCharacter] || characterShadowColors.default;


    useEffect(()=>{
        if(!card.owned) setShowPicture(false);
        setVideoUrl(card?.video_url);
    },[card])


    // 预加载小图，等大图加载完以后跳出来
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!card?.image) return;

        const img = new Image();
        img.src = card.image;
        img.onload = () => {
            setLoaded(true);
        };
    }, [card?.image]);


    return (
        <div className="absolute w-full h-full z-30"
             onClick={() => {
                 if (card.owned) setShowPicture(!showPicture)
             }}>



            {!showPicture && (
                <div>
                    {/* 渐变灰色覆盖层 */}
                    <div
                        className="absolute top-0 w-full z-20"
                        style={{
                            height: `${fontsize * 5}px`,
                            background: 'linear-gradient(to top, transparent, rgba(0, 0, 0, 0.6))',
                            pointerEvents: 'none',
                        }}
                    />

                    {/*返回按钮*/}
                    <button
                        className="absolute z-40"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            left: `${fontsize}px`,
                            top: `${fontsize * 1.2}px`
                        }}
                    >
                        <LeftIcon size={fontsize * 2.5} color="white"/>
                    </button>

                    {/*视频按钮*/}
                    {card.video_url && (
                        <button
                            className="absolute"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPageZIndex(100);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                right: `${fontsize * 1.2}px`,
                                top: `${fontsize * 1.2}px`,
                                zIndex: card.owned ? 40 : 20,
                            }}
                        >
                            <ShortVideoIcon size={fontsize * 2} color="white"/>
                        </button>
                    )}



                    {/*上一个*/}
                    <div
                        className="absolute z-30 h-full flex justify-center items-center"
                        style={{left: `${fontsize}px`, right: `${fontsize}px`}}
                    >
                        <button className="absolute left-[0] " onClick={handlePrev}
                                style={{background: 'transparent', border: 'none', padding: 0}}>
                            <LeftIcon size={fontsize * 2.5} color="white"/>
                        </button>

                        {/*下一个*/}
                        <button className="absolute z-30 right-[0]" onClick={handleNext}
                                style={{background: 'transparent', border: 'none', padding: 0}}>
                            <RightIcon size={fontsize * 2.5} color="white"/>
                        </button>
                    </div>

                </div>
            )}


            {!card.owned && (
                <div>
                    <div
                        className="absolute left-0 w-full h-full z-20 flex items-center justify-center"
                        style={{background: '#00000088', pointerEvents: 'none',}}
                    />
                    <div className="absolute w-full h-full flex justify-center items-center z-25"
                         style={{pointerEvents: 'none'}}>
                        <LockIcon size={fontsize * 3} color={'lightgray'}/>
                    </div>
                </div>

            )}


            {/* 底部图片（绝对定位） */}
            <img
                src="images/结算背景.jpg"
                alt="底部装饰"
                className="absolute w-full h-full z-0"
            />


            {/* 展示卡片内容 */}
            <div className="relative w-full h-full flex z-10">
                {/* 低清图：模糊背景 */}
                <div
                    className="absolute w-full h-full transition-opacity duration-300"
                    style={{
                        backgroundImage: `url(${card?.image_lowres || card?.image})`,
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
                            backgroundImage: `url(${card?.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />
                )}
            </div>

            {!showPicture && (
                <div>
                    <div className="absolute flex items-center z-10"
                         style={{bottom: `${fontsize * 6}px`, left: `${fontsize * 2}px`}}>
                        <img
                            src={`images/${card?.star}.png`}
                            style={{marginRight: `${fontsize * 0.6}px`, height: `${fontsize * 2.5}px`}}
                        />
                        <img
                            src={`images/${card?.card_color_tag}.png`}
                            style={{marginRight: `${fontsize * 0.2}px`, height: `${fontsize * 1.8}px`}}
                        />
                        <img
                            src={`images/${card?.card_type_tag}.png`}
                            style={{
                                height: `${card?.card_type_tag === "日冕" ?
                                    fontsize * 2.5 : fontsize * 1.8}px`
                            }}
                        />
                    </div>

                    {/* 文字区域 */}
                    <div className="absolute flex items-center z-10"
                         style={{bottom: `${fontsize * 2}px`, left: `${fontsize * 2}px`}}>
                        <label
                            style={{
                                color: 'white',
                                fontSize: `${fontsize * 2}px`,
                                textShadow: shadowColor,
                                fontWeight: '800',
                                marginLeft: '2px',
                            }}
                        >
                            {card?.character} ·
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
                            {card?.name}
                        </label>
                    </div>
                </div>
            )}




        </div>
    );
};


export default FullImageViewer;