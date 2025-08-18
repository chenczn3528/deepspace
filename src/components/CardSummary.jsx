import React, {useEffect, useRef} from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';  // 确保你有安装这个库
import CardSummaryImageViewer from './CardSummaryImageViewer.jsx';
import { Asset } from './Asset.jsx';

const CardSummary = ({ drawResults, onClose, fontsize }) => {

    // ========================================================
    // 设置音效
    const summaryAudioRef = useRef(null);

    useEffect(() => {
        summaryAudioRef.current = new Audio("audios/展示结算.mp3");
        summaryAudioRef.current.volume = 1;
        summaryAudioRef.current.currentTime = 0;

        summaryAudioRef.current
            .play()
            .catch((err) => console.warn("播放十抽总结音效失败：", err));
    }, []); // 组件加载时播放一次

    const [showImageViewer, setShowImageViewer] = React.useState(false);
    const [viewerIndex, setViewerIndex] = React.useState(0);


    return (
        <div
            className="absolute w-full h-full flex items-center justify-center"
            onClick={onClose}
        >
            {/* 底部图片（绝对定位） */}
            <Asset
                src="结算背景.jpg"
                type="image"
                className="absolute z-10 w-full h-full"
            />
            {/* <img
                src="images/结算背景.jpg"
                alt="底部装饰"
                className="absolute z-10 w-full h-full"
            /> */}


            {/* 卡片网格 */}
            <div className="absolute grid grid-cols-5 z-20"
                 style={{
                      top: `${fontsize * 8}px`,
                      bottom: `${fontsize * 8}px`,
                      left: `${fontsize * 2}px`,
                      right: `${fontsize * 2}px`,
                      rowGap: `${fontsize * 2}px`,
                      columnGap: `${fontsize * 0.8}px`,
            }}>
                {drawResults.map((item, index) => {
                    let glowStyle = {};

                    if (item.card.star === '5星') {
                        glowStyle = {
                            boxShadow: '0 -10px 20px rgba(255, 215, 0, 0.6), 0 10px 20px rgba(255, 215, 0, 0.6)', // 上下金光
                        };
                    } else if (item.card.star === '4星') {
                        glowStyle = {
                            boxShadow: '0 -10px 20px rgba(168, 85, 247, 0.6), 0 10px 20px rgba(168, 85, 247, 0.6)', // 上下紫光
                        };
                    }

                    return (
                        <LazyLoadImage
                            key={index}
                            src={item.card.image}
                            placeholderSrc={item.card.image_small}
                            effect="blur"
                            alt={`Card ${index}`}
                            className="w-full h-full object-cover cursor-pointer"
                            style={glowStyle}
                            onClick={e => {e.stopPropagation(); setViewerIndex(index); setShowImageViewer(true);}}
                        />
                    );
                })}
            </div>

            {showImageViewer && (
                <CardSummaryImageViewer
                    card={drawResults[viewerIndex].card}
                    onClose={() => setShowImageViewer(false)}
                    fontsize={fontsize}
                />
            )}
        </div>
    );
};

export default CardSummary;
