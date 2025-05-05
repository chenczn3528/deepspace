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
  clearLocalData,
  toggleMusic,
  isMusicPlaying,
  setShowGallery,
  showProbability,
  setShowProbability,
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
          <button
              onClick={toggleMusic}
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
                  src={isMusicPlaying ? "images/放音.png" : "images/静音.png"}
                  alt="music toggle"
                  className="w-[24px] h-[24px]"
              />
          </button>


          {/*查看图鉴*/}
          <button
              onClick={() => setShowGallery(true)}
              style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  position: 'fixed', // 使按钮脱离flex布局
                  top: '60px',  // 靠近顶部
                  right: '20px', // 靠近右侧
                  width: 'auto',
                  height: 'auto',
              }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-auto"
          >
              图鉴
          </button>



          {/*测试概率*/}
          <button
              onClick={() => setShowProbability(!showProbability)}
              style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  position: 'fixed', // 使按钮脱离flex布局
                  top: '20px',  // 靠近顶部
                  left: '20px', // 靠近右侧
                  width: 'auto',
                  height: 'auto',
              }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 ml-auto"
          >
              测试概率
          </button>


          <div
              className="relative bg-gray-900 bg-opacity-80 p-4 flex flex-col gap-4 ml-[10px] mr-[10px] rounded-xl shadow-lg">

              <div
                  style={{
                      color: 'gray',
                      fontSize: '16px',
                      fontWeight: '400',
                      marginLeft: '20px',
                      marginRight: '20px'
                  }}
                  className="text-sm mt-2 flex flex-col"
              >
                  <label>目前应该是第一次加载网页视频会很卡</label>
                  <label>加载完只要不清除浏览器缓存就不卡</label>
                  <label>如果还是很卡，请告诉我，感谢❤</label>
                  <label>图鉴排序正在写……</label>
              </div>


              <button
                  onClick={clearLocalData}
                  className="bg-blue-500 px-8 py-2 rounded flex-1 ml-[20px] w-[40%]"
              >
                  清除所有记录
              </button>


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

              <div className="flex flex-row mr-[20px] mb-[4px]">
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


              <div className="flex w-screen h-auto mt-4 items-center px-4">
                  {/* 保底显示 */}
                  <div
                      className="text-sm text-white font-extrabold text-[20px] break-words ml-[20px] flex-grow"
                      style={{
                          color: 'white',
                          fontSize: '20px',
                          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                          fontWeight: '800',
                          marginLeft: '20px',
                          alignSelf: 'center',
                      }}
                  >
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
                  </div>

                  {/* 抽卡历史记录按钮 */}
                  <button
                      className="ml-[20px] px-3 py-1 bg-gray-700 text-white rounded whitespace-nowrap mr-[20px] mt-[5px]"
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
