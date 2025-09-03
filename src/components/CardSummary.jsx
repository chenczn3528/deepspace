import React, {useEffect, useRef} from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';  // 确保你有安装这个库
import CardSummaryImageViewer from './CardSummaryImageViewer.jsx';
import { Asset } from './Asset.jsx';
import { useAssetLoader } from '../hooks/useAssetLoader';

const CardSummary = ({ drawResults, onClose, fontsize }) => {

    // ========================================================
    // 设置音效
    const summaryAudioRef = useRef(null);

    const { loadAsset } = useAssetLoader();

  useEffect(() => {
    // 使用 Asset 系统加载并播放展示总结音效
    const playSummarySound = async () => {
      try {
        const audioUrl = await loadAsset('audio', '展示结算.mp3');
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.volume = 1;

          // 使用 WebAudio 增益放大（可配置，读取 localStorage 的 sfxGain）
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
              try { await ctx.resume(); } catch {}
            }
            const source = ctx.createMediaElementSource(audio);
            const gainNode = ctx.createGain();
            let sfxGain = 1;
            try {
              const saved = localStorage.getItem('sfxGain');
              if (saved) {
                const parsed = parseFloat(saved);
                if (!Number.isNaN(parsed) && parsed > 0) sfxGain = parsed;
              }
            } catch {}
            gainNode.gain.value = sfxGain;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
          } catch (e) {
            // 忽略增益管线错误，保底直接播放
          }

          audio.currentTime = 0;
          await audio.play();
          summaryAudioRef.current = audio;
        }
      } catch (err) {
        console.warn("播放十抽总结音效失败：", err);
      }
    };

    playSummarySound();
  }, [loadAsset]); // 组件加载时播放一次

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
