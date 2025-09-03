import React, {useEffect, useRef, useState} from 'react';
import MusicPlayIcon from "../icons/MusicPlayIcon.jsx";
import MusicMuteIcon from "../icons/MusicMuteIcon.jsx";
import MusicIcon from "../icons/MusicIcon.jsx";
import MusicVolumeIcon from "../icons/MusicVolumeIcon.jsx";
import { useAssetLoader } from '../hooks/useAssetLoader';

const SettingsLayer = ({
    totalDrawCount,
    totalFiveStarCount,
    selectedRole,
    setSelectedRole,
    onlySelectedRoleCard,
    setonlySelectedRoleCard,
    roles,
    includeThreeStar,
    setIncludeThreeStar,
    useSoftGuarantee,
    setUseSoftGuarantee,
    pityCount,
    softPityFailed,
    isDrawing,
    isAnimatingDrawCards,
    handleDraw,
    showHistory,
    setShowHistory,
    setHasShownSummary,
    setShowSummary,
    clearLocalData,
    setShowGallery,
    showProbability,
    setShowProbability,
    fontsize,
    // toggleMusic,
    // isMusicPlaying,
    showMusicPageZIndex,
    setShowMusicPageZIndex,
    musicID,
    setMusicID,
    openAssetTest,
    globalVolume,
    setGlobalVolume,
}) => {

    const { loadAsset } = useAssetLoader();

    // 音效增益设置开关与数值
    const [showGainCtrl, setShowGainCtrl] = useState(false);
    const [sfxGain, setSfxGain] = useState(() => {
        try {
            const saved = localStorage.getItem('sfxGain');
            const v = saved ? parseFloat(saved) : 1;
            return Number.isNaN(v) ? 1 : v;
        } catch { return 1; }
    });

    useEffect(() => {
        try { localStorage.setItem('sfxGain', String(sfxGain)); } catch {}
    }, [sfxGain]);

    // 点击外部区域关闭音效设置面板
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showGainCtrl) {
                // 检查点击是否在音效设置面板外部
                const gainPanel = document.querySelector('[data-gain-panel]');
                const gainButton = document.querySelector('[data-gain-button]');
                
                if (gainPanel && gainButton && 
                    !gainPanel.contains(event.target) && 
                    !gainButton.contains(event.target)) {
                    setShowGainCtrl(false);
                }
            }
        };

        if (showGainCtrl) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showGainCtrl]);

    const playTestSfx = async () => {
        try {
            const url = await loadAsset('audio', '切换音效.mp3');
            if (!url) return;
            const audio = new Audio(url);
            audio.volume = 1;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') {
                    try { await ctx.resume(); } catch {}
                }
                const source = ctx.createMediaElementSource(audio);
                const gainNode = ctx.createGain();
                gainNode.gain.value = sfxGain > 0 ? sfxGain : 1;
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
            } catch {}
            audio.currentTime = 0;
            await audio.play();
        } catch {}
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText("840305422");
            alert("复制成功!");
        } catch (err) {
            console.error("复制失败:", err);
            alert("复制失败！小红书号：840305422");
        }
      };




    // 音乐用iframe，出金音效用滑动条，新写一个页面调试这个东西

    return (
        <div className="absolute w-full h-full">

            {/* 音效增益按钮与隐藏面板 */}
            <button className="absolute"
                data-gain-button
                onClick={() => {setShowGainCtrl(v => !v)}}
                style={{background: 'transparent', border: 'none', padding: 0, top: `${fontsize * 1.2}px`, right: `${fontsize * 3.8}px`}}
            >
                <MusicVolumeIcon size={fontsize * 2} color="gray"/>
            </button>


            
            {showGainCtrl && (
                <div className="absolute items-center gap-[1vmin]"
                        data-gain-panel
                        style={{
                        top: `${fontsize * 4.2}px`, 
                        right: `${fontsize * 1.2}px`,
                        padding: `${fontsize * 0.8}px`,
                        borderRadius: `${fontsize * 0.1}px`,
                        backgroundColor: 'rgba(43, 45, 57)',
                        }}
                >
                    <label style={{color: 'white', textShadow: '0 0 6px black', fontSize: `${fontsize * 1.1}px`, whiteSpace: 'nowrap', marginRight: `${fontsize * 0.5}px`}}>音效音量大小</label>
                    <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={sfxGain}
                        onChange={(e) => setSfxGain(parseFloat(e.target.value))}
                        onMouseUp={playTestSfx}
                        onTouchEnd={playTestSfx}
                        style={{width: `${fontsize * 8}px`}}
                    />
                    <span style={{color: 'white', textShadow: '0 0 6px black', fontSize: `${fontsize * 1.1}px`, minWidth: `${fontsize * 8}px`, textAlign: 'right'}}>
                        {`${(sfxGain || 1).toFixed(1)}`}
                    </span>
                </div>
            )}

            {/*放音乐按钮*/}
            <button
                onClick={()=>setShowMusicPageZIndex(10)}
                className="absolute"
                style={{background: 'transparent', border: 'none', padding: 0, top: `${fontsize * 1.2}px`, right: `${fontsize * 1.2}px`}}
            >
                <MusicIcon color="gray" size={fontsize * 2} />
            </button>



            {/*右上角按钮、文字*/}
            <div className="absolute flex flex-col" style={{top: `${fontsize * 1.2}px`, left: `${fontsize * 1.2}px`}}>
                <div className="flex flex-row gap-[10px]">
                    {/*查看图鉴*/}
                    <button style={{fontSize: `${fontsize * 1.2}px`}} onClick={() => setShowGallery(true)}>图鉴</button>

                    {/*素材测试*/}
                    <button style={{fontSize: `${fontsize * 1.2}px`}} onClick={() => openAssetTest && openAssetTest()}>动画缓存</button>

                    {/*测试概率*/}
                    <button style={{fontSize: `${fontsize * 1.2}px`}}
                            onClick={() => setShowProbability(!showProbability)}>测试概率
                    </button>
                </div>

                <div
                    style={{
                        color: 'lightgray',
                        fontSize: `${fontsize * 1.2}px`,
                        fontWeight: '400',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                    }}
                    className="flex flex-col mt-[5px]"
                >
                    <span style={{color: 'red', fontWeight: 800}}>重要提示：</span>
                    <label>第一次加载网页的视频、动画会很卡</label>
                    <label>需要等待一段时间让资源加载完</label>
                    <label>数据来源：恋与深空WIKI</label>
                    <div className="flex flex-row">
                        <label>反馈bug或功能需求：</label>
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                color: '#1750eb',
                                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                            }}
                            onClick={handleCopy}
                        >
                            点击复制小红书号
                        </button>

                    </div>
                </div>
            </div>


            <div
                className="absolute flex flex-col"
                style={{
                    color: 'white',
                    fontSize: `${fontsize * 1.4}px`,
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    fontWeight: '800',
                    bottom: `${fontsize * 1.2}px`,
                    left: `${fontsize * 1.2}px`,
                    right: `${fontsize * 1.2}px`,
                }}
            >
                {/*清除所有记录*/}
                <div>
                    <button style={{fontSize: `${fontsize * 1.2}px`}} onClick={clearLocalData}>清除所有记录</button>
                </div>


                {/*统计抽数*/}
                <div className="flex flex-row" style={{gap: `${fontsize * 2}px`, marginTop: `${fontsize * 0.2}px`}}>
                    <label>总抽卡数: {totalDrawCount}</label>
                    <label>总出金数: {totalFiveStarCount}</label>
                </div>
                <label>
                    平均出金数: {totalFiveStarCount === 0 ? '0' : (totalDrawCount / totalFiveStarCount).toFixed(2)}
                </label>

                {/* 角色选择 */}
                <div className="flex flex-row" style={{gap: `${fontsize * 0.2}px`}} id="role-selector">
                    <label>选择角色：</label>
                    <select
                        style={{fontSize: `${fontsize * 1.1}px`}}
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        {roles.map((role) => (<option key={role} value={role}>{role}</option>))}
                    </select>
                </div>

                {/*保底相关*/}
                <div className="flex flex-col">

                    {/*是否包括三星卡*/}
                    <div className="flex flex-row items-center" style={{gap: `${fontsize * 0.5}px`}}>
                        <label htmlFor="includeThree">包括三星卡片</label>
                        <input
                            id="includeThree"
                            style={{width: `${fontsize * 1.3}px`, height: `${fontsize * 1.3}px`}}
                            type="checkbox"
                            checked={includeThreeStar}
                            onChange={(e) => setIncludeThreeStar(e.target.checked)}
                        />
                    </div>

                    {/*是否开启大小保底*/}
                    {selectedRole !== '随机' && (
                        <div className="flex flex-row items-center" style={{gap: `${fontsize * 0.5}px`}}>
                            <label htmlFor="softGuarantee">开启大小保底机制</label>
                            <input
                                id="softGuarantee"
                                style={{width: `${fontsize * 1.3}px`, height: `${fontsize * 1.3}px`}}
                                type="checkbox"
                                checked={useSoftGuarantee}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setUseSoftGuarantee(checked);
                                    if (checked) setonlySelectedRoleCard(false); // 互斥
                                }}
                            />
                        </div>
                    )}

                    {/*是否只抽xx的卡*/}
                    {selectedRole !== '随机' && (
                        <div className="flex flex-row items-center" style={{gap: `${fontsize * 0.5}px`}}>
                            <label htmlFor="onlyThisRole">只抽 {selectedRole} 的卡</label>
                            <input
                                style={{width: `${fontsize * 1.3}px`, height: `${fontsize * 1.3}px`}}
                                id="onlyThisRole"
                                type="checkbox"
                                checked={onlySelectedRoleCard}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setonlySelectedRoleCard(checked);
                                    if (checked) setUseSoftGuarantee(false); // 互斥
                                }}
                            />
                        </div>
                    )}
                </div>


                {/* 一抽/十抽按钮 */}
                <div className="flex flex-row justify-between items-center"
                     style={{marginTop: `${fontsize}px`, marginBottom: `${fontsize * 0.5}px`}}>
                    <button
                        onClick={() => {
                            setHasShownSummary(false);
                            setShowSummary(false);
                            handleDraw(1);
                        }}
                        style={{fontSize: `${fontsize * 1.2}px`}}
                    >
                        许愿一次
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // 阻止冒泡
                            setHasShownSummary(false);
                            setShowSummary(false);
                            handleDraw(10);
                        }}
                        disabled={isDrawing || isAnimatingDrawCards}
                        style={{fontSize: `${fontsize * 1.2}px`}}
                    >
                        {isDrawing ? '抽卡中...' : '许愿十次'}
                    </button>
                </div>


                <div className="flex flex-row items-center justify-between">
                    {/* 保底显示 */}
                    <label>
                        {selectedRole === '随机' || !useSoftGuarantee ? (
                            <>
                                还剩 {70 - pityCount} 抽 必得五星
                            </>
                        ) : softPityFailed ? (
                            <>
                                还剩 {70 - pityCount} 抽 大保底
                            </>
                        ) : (
                            <>
                                还剩 {70 - pityCount} 抽 小保底
                            </>
                        )}
                    </label>

                    {/* 抽卡历史记录按钮 */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        style={{fontSize: `${fontsize * 1.2}px`}}
                        id="history-toggle-button"
                    >
                        {showHistory ? '关闭抽卡记录' : '查看抽卡记录'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsLayer;
