import React, {useEffect, useRef, useState} from 'react';
import MusicPlayIcon from "../icons/MusicPlayIcon.jsx";
import MusicMuteIcon from "../icons/MusicMuteIcon.jsx";
import MusicIcon from "../icons/MusicIcon.jsx";

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
}) => {




    // // ========================================================
    // // 背景音乐设置
    // const audioRef = useRef(null);
    // const [volume, setVolume] = useState(0.1);
    // const [showSlider, setShowSlider] = useState(false);
    // const hideTimeoutRef = useRef(null);
    //
    // useEffect(() => {
    //     const audio = audioRef.current;
    //     if (audio) {
    //         audio.volume = volume;
    //         audio.loop = true;
    //         audio.play().catch((err) => {
    //             console.warn('自动播放失败', err);
    //         });
    //     }
    // }, []);
    //
    // useEffect(() => {
    //     if (audioRef.current) {
    //         audioRef.current.volume = volume;
    //         if (audioRef.current.paused && volume > 0) {
    //             audioRef.current.play().catch(() => {});
    //         }
    //     }
    // }, [volume]);
    //
    // // 每次显示音量条后自动在 2 秒后隐藏
    // useEffect(() => {
    //     if (showSlider) {
    //         clearTimeout(hideTimeoutRef.current);
    //         hideTimeoutRef.current = setTimeout(() => {
    //             setShowSlider(false);
    //         }, 2000);
    //     }
    //     return () => clearTimeout(hideTimeoutRef.current);
    // }, [showSlider]);
    //
    // const toggleSlider = () => {
    //     setShowSlider(true);
    // };
    //
    //
    // const [musicID, setMusicID] = useState("2660222366");
    // const [showPlayer, setShowPlayer] = useState(true);

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
