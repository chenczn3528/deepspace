import React from 'react';

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
}) => {
    const labelStyle = {
      color: 'white',
      fontSize: '20px',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
      fontWeight: '800',
      alignSelf: 'center',
    };




  return (
    <div className="fixed inset-0 z-10 flex flex-col w-full bottom-[10%] items-center justify-center">
        <div
            className="relative bg-gray-900 bg-opacity-80 p-4 flex flex-col gap-4 ml-[10px] mr-[10px] rounded-xl shadow-lg">

            <div
                style={{
                    color: 'gray',
                    fontSize: '16px',
                    // textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    // fontFamily: '"SimSun", "宋体", serif',
                    fontWeight: '800',
                    marginLeft: '20px',
                    marginRight: '20px'
                }}
                className="text-sm mt-2 flex flex-col"
            >
                <label>请告诉我是更新前还是更新后更卡</label>
                <label>更新时间4月24日09:07，感谢❤</label>
            </div>

            {/*统计抽数*/}
            <div
                style={{
                    color: 'white',
                    fontSize: '20px',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    // fontFamily: '"SimSun", "宋体", serif',
                    fontWeight: '800',
                    marginLeft: '20px',
                }}
                className="text-sm mt-2"
            >
                <label>总抽卡数: {totalDrawCount}</label>
                <label className="ml-[20px]">总出金数: {totalFiveStarCount}</label>
            </div>
            <label
                style={{
                    color: 'white',
                    fontSize: '20px',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                    // fontFamily: '"SimSun", "宋体", serif',
                    fontWeight: '800',
                    marginLeft: '20px',
                }}
                className="text-sm mt-2"
            >
                平均出金数: {totalFiveStarCount === 0 ? '0' : (totalDrawCount / totalFiveStarCount).toFixed(2)}
            </label>

            {/* 角色选择 */}
            <div className="flex items-center gap-2 ml-[20px]" id="role-selector">
                <label
                    style={{
                        color: 'white',
                        fontSize: '20px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                        // fontFamily: '"SimSun", "宋体", serif',
                        fontWeight: '800',
                        marginLeft: '2px',
                        alignSelf: 'center',
                    }}
                >
                    选择角色：
                </label>
                <select
                    className="bg-gray-800 text-white p-2 rounded"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                >
                    {roles.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </select>
            </div>

            {/*是否排除三星*/}
            <div className="flex flex-col gap-2 mb-2 ml-[20px] text-white">
                <div className="flex items-center gap-2">
                    <label htmlFor="includeThree" style={labelStyle}>包括三星卡片</label>
                    <input
                        id="includeThree"
                        type="checkbox"
                        checked={includeThreeStar}
                        onChange={(e) => setIncludeThreeStar(e.target.checked)}
                        className="w-[20px] h-[20px]"
                    />
                </div>

                {selectedRole !== '随机' && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="softGuarantee" style={labelStyle}>开启大小保底机制</label>
                        <input
                            id="softGuarantee"
                            type="checkbox"
                            checked={useSoftGuarantee}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setUseSoftGuarantee(checked);
                                if (checked) setonlySelectedRoleCard(false); // 互斥
                            }}
                            className="w-[20px] h-[20px]"
                        />
                    </div>
                )}

                {selectedRole !== '随机' && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="onlyThisRole" style={labelStyle}>只抽 {selectedRole} 的卡</label>
                        <input
                            id="onlyThisRole"
                            type="checkbox"
                            checked={onlySelectedRoleCard}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setonlySelectedRoleCard(checked);
                                if (checked) setUseSoftGuarantee(false); // 互斥
                            }}
                            className="w-[20px] h-[20px]"
                        />
                    </div>
                )}


            </div>


            {/* 一抽/十抽按钮 */}
            <div className="flex w-screen h-[40px] justify-between px-4">
                <button
                    onClick={() => {
                        setHasShownSummary(false);
                        setShowSummary(false);
                        handleDraw(1);
                    }}
                    className="bg-blue-500 px-8 py-2 rounded flex-1 ml-[20px] h-auto"
                >
                    许愿一次
                </button>
                <div className="flex-1 max-w-[20px]"></div>
                {/* 中间间距 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // 阻止冒泡
                        setHasShownSummary(false);
                        setShowSummary(false);
                        handleDraw(10);
                    }}
                    disabled={isDrawing || isAnimatingDrawCards}
                    className="bg-purple-600 px-8 py-2 rounded flex-1 mr-[20px] h-auto"
                >
                    {isDrawing ? '抽卡中...' : '许愿十次'}
                </button>
            </div>

            <div className="flex w-screen h-[40px] mt-[16px]">
                {/* 保底显示 */}
                <div
                    className="text-sm mt-2"
                    id="pity-counter"
                    style={{
                        color: 'white',
                        fontSize: '20px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                        // fontFamily: '"SimSun", "宋体", serif',
                        fontWeight: '800',
                        marginLeft: '20px',
                        alignSelf: 'center',
                    }}
                >
                    {selectedRole === '随机' || !useSoftGuarantee ? (
                        <>还剩 {70 - pityCount} 抽必得五星</>
                    ) : (
                        softPityFailed ? (
                            <>还剩 {70 - pityCount} 抽大保底</>
                        ) : (
                            <>还剩 {70 - pityCount} 抽小保底</>
                        )
                    )}
                </div>

                {/* 抽卡历史记录按钮 */}
                <button
                    className="bg-gray-700 text-white ml-[20px] rounded"
                    onClick={() => setShowHistory(!showHistory)}
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
