import React from 'react';
import MusicPlayIcon from "../icons/MusicPlayIcon.jsx";
import MusicMuteIcon from "../icons/MusicMuteIcon.jsx";

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
    toggleMusic,
    isMusicPlaying,
    setShowGallery,
    showProbability,
    setShowProbability,
}) => {



    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText("840305422");
            alert("复制成功!");
        } catch (err) {
            console.error("复制失败:", err);
            alert("复制失败！小红书号：840305422");
        }
      };




    return (
        <div className="fixed inset-0 z-10 flex flex-col w-full h-full justify-between">
            {/*放音乐按钮*/}
            <button
                onClick={toggleMusic}
                className="absolute top-[5vmin] right-[5vmin]"
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0
                }}
            >
                {isMusicPlaying ? (
                    <MusicPlayIcon color="gray" size={28} />
                ) : (
                    <MusicMuteIcon color="gray" size={28} />
                )}
            </button>


            {/*右上角按钮、文字*/}
            <div className="flex flex-col mt-[5vmin] ml-[5vmin] mr-[5vmin]">
                <div className="flex flex-row gap-[2vmin]">
                    {/*查看图鉴*/}
                    <button style={{fontSize: '4vmin'}} onClick={() => setShowGallery(true)}>图鉴</button>

                    {/*测试概率*/}
                    <button style={{fontSize: '4vmin'}} onClick={() => setShowProbability(!showProbability)}>测试概率</button>
                </div>

                <div
                    style={{
                        color: 'lightgray',
                        fontSize: '4vmin',
                        fontWeight: '400',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                    }}
                    className="flex flex-col mt-[1vmin]"
                >
                    <span style={{color: 'red', fontWeight: 800}}>重要提示：</span>
                    <label>第一次加载网页的视频、动画会很卡</label>
                    <label>需要等待一段时间让资源加载完</label>
                    <label>加载完只要不清除浏览器缓存就不卡</label>
                    <label>5月25日有更新，以前的记录可能会消失</label>
                    <div className="flex flex-row">
                        <label>反馈bug或功能需求：</label>
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                margin: 0,
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
                className="flex flex-col mb-[5vmin] ml-[5vmin] mr-[5vmin]"
                style={{
                    color: 'white',
                    fontSize: '4vmin',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    fontWeight: '800',
                }}
            >
                {/*清除所有记录*/}
                <div>
                    <button style={{fontSize: '4vmin'}} onClick={clearLocalData}>清除所有记录</button>
                </div>


                {/*统计抽数*/}
                <div className="flex flex-row gap-[5vmin] mt-[1vmin]">
                    <label>总抽卡数: {totalDrawCount}</label>
                    <label>总出金数: {totalFiveStarCount}</label>
                </div>
                <label>
                    平均出金数: {totalFiveStarCount === 0 ? '0' : (totalDrawCount / totalFiveStarCount).toFixed(2)}
                </label>

                {/* 角色选择 */}
                <div className="flex flex-row gap-[2vmin]" id="role-selector">
                    <label>选择角色：</label>
                    <select
                        style={{fontSize: '2.5vmin'}}
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        {roles.map((role) => (<option key={role} value={role}>{role}</option>))}
                    </select>
                </div>

                {/*保底相关*/}
                <div className="flex flex-col">

                    {/*是否包括三星卡*/}
                    <div className="flex flex-row gap-[2vmin] items-center">
                        <label htmlFor="includeThree">包括三星卡片</label>
                        <input
                            id="includeThree"
                            style={{width:'3vmin', height: '3vmin'}}
                            type="checkbox"
                            checked={includeThreeStar}
                            onChange={(e) => setIncludeThreeStar(e.target.checked)}
                        />
                    </div>

                    {/*是否开启大小保底*/}
                    {selectedRole !== '随机' && (
                        <div className="flex flex-row gap-[2vmin] items-center">
                            <label htmlFor="softGuarantee">开启大小保底机制</label>
                            <input
                                id="softGuarantee"
                                style={{width:'3vmin', height: '3vmin'}}
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
                        <div className="flex flex-row gap-[2vmin] items-center">
                            <label htmlFor="onlyThisRole">只抽 {selectedRole} 的卡</label>
                            <input
                                style={{width:'3vmin', height: '3vmin'}}
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
                <div className="flex flex-row mt-[1vmin] gap-[5vmin] justify-between items-center">
                    <button
                        onClick={() => {
                            setHasShownSummary(false);
                            setShowSummary(false);
                            handleDraw(1);
                        }}
                        style={{fontSize: '4vmin'}}
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
                        style={{fontSize: '4vmin'}}
                    >
                        {isDrawing ? '抽卡中...' : '许愿十次'}
                    </button>
                </div>


                <div className="flex flex-row gap-[3vmin] mt-[1vmin] items-center justify-between">
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
                      style={{fontSize: '4vmin'}}
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
