import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

const CardOverlay = ({
  showCardOverlay,
  isFiveStar,
  videoPlayed,
  currentCardIndex,
  drawResultsRef,
  setVideoPlayed,
  cardTypeHeight,
  shadowColor,
}) => {
  const [isSkipped, setIsSkipped] = useState(false); // 跳过视频的状态

  // 跳过按钮点击事件
  const handleSkip = () => {
    setIsSkipped(true); // 设置跳过状态
    setVideoPlayed(true); // 标记视频已播放
  };

  return (
    showCardOverlay && (
      <div className="fixed inset-0 z-30 bg-black bg-opacity-70">
        {/* 底部图片（绝对定位） */}
        <img
          src="结算背景.jpg"
          alt="底部装饰"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full h-full opacity-100 z-0" // 设置 z-index 为 0
        />

        {isFiveStar && !videoPlayed && !isSkipped && (
          // 只有五星卡片并且视频没有播放完时，先播放视频
          <div className="relative">
            <video
              className="fixed inset-0 w-full h-full object-cover z-10" // 设置 z-index 为 10 确保视频在图片之上
              autoPlay
              playsInline
              muted
              controls={false}
              onEnded={() => {
                setVideoPlayed(true); // 设置视频播放完毕
                // handleNextCard(); // 播放完视频后处理下一张卡片
              }}
              onClick={(e) => e.preventDefault()} // 禁用点击事件，防止跳过视频
              style={{ pointerEvents: 'none' }} // 禁用点击交互
            >
              <source
                src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.MOV`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            {/* 跳过按钮 */}
            <button
              onClick={handleSkip}
              className="absolute z-100 top-5 right-5 text-white bg-black bg-opacity-50 rounded-lg px-4 py-2 border"
            >
              跳过
            </button>
          </div>
        )}

        {/* 展示卡片内容 */}
        {(isFiveStar && (videoPlayed || isSkipped)) || !isFiveStar ? (
          <>
            <div className="fixed w-full h-full inset-0 z-0">
              {/* 设置卡片展示层的 z-index 为 0 */}
              <LazyLoadImage
                className="w-screen h-screen object-cover"
                style={{
                  width: '100vw',
                  height: '100vh',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                src={drawResultsRef.current[currentCardIndex]?.card?.image}
                placeholderSrc={drawResultsRef.current[currentCardIndex]?.card?.image_small}
                effect="blur"
                alt="抽到的卡片"
                crossOrigin="anonymous"
                key={currentCardIndex}
              />
            </div>

            <div className="h-screen w-screen pl-8">
              <div className="relative w-full h-full">
                <div className="absolute bottom-[22%] left-[10%] w-full h-[6%] flex items-center">
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
                    alt="星级"
                    className="h-[36px] object-contain"
                  />
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_color}
                    alt="星谱"
                    className="h-[24px] object-contain ml-[12px]"
                  />
                  <img
                    src={drawResultsRef.current[currentCardIndex]?.card?.card_type}
                    alt="类型（日卡月卡）"
                    style={{
                      height: `${cardTypeHeight}px`,
                      maxHeight: `${cardTypeHeight}px`,
                      objectFit: 'contain',
                    }}
                    className="object-contain ml-[8px]"
                  />
                </div>

                {/* 文字区域 */}
                <div className="absolute bottom-[13%] left-[10%] w-full h-[12%] flex items-center">
                  <h1
                    style={{
                      color: 'white',
                      fontSize: '30px',
                      textShadow: shadowColor,
                      fontFamily: '"SimSun", "宋体", serif',
                      fontWeight: '800',
                      marginLeft: '2px',
                      alignSelf: 'center',
                    }}
                  >
                    {drawResultsRef.current[currentCardIndex]?.card?.character}·
                  </h1>

                  <h1
                    style={{
                      color: 'white',
                      fontSize: '40px',
                      textShadow: shadowColor,
                      fontFamily: '"SimSun", "宋体", serif',
                      fontWeight: '800',
                      marginLeft: '2px',
                      alignSelf: 'center',
                    }}
                  >
                    {drawResultsRef.current[currentCardIndex]?.card?.name}
                  </h1>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    )
  );
};

export default CardOverlay;



// // CardOverlay.jsx
// import React from 'react';
// import { LazyLoadImage } from 'react-lazy-load-image-component';
//
// const CardOverlay = ({
//   showCardOverlay,
//   isFiveStar,
//   videoPlayed,
//   currentCardIndex,
//   drawResultsRef,
//   setVideoPlayed,
//   cardTypeHeight,
//   shadowColor,
// }) => {
//   return (
//     showCardOverlay && (
//       <div className="fixed inset-0 z-30 bg-black bg-opacity-70">
//         {/* 底部图片（绝对定位） */}
//         <img
//           src="结算背景.jpg"
//           alt="底部装饰"
//           className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full h-full opacity-100 z-0" // 设置 z-index 为 0
//         />
//
//         {isFiveStar && !videoPlayed && (
//           // 只有五星卡片并且视频没有播放完时，先播放视频
//           <video
//             className="fixed inset-0 w-full h-full object-cover z-10" // 设置 z-index 为 10 确保视频在图片之上
//             autoPlay
//             playsInline
//             muted
//             controls={false}
//             onEnded={() => {
//               setVideoPlayed(true); // 设置视频播放完毕
//               // handleNextCard(); // 播放完视频后处理下一张卡片
//             }}
//             onClick={(e) => e.preventDefault()} // 禁用点击事件，防止跳过视频
//             style={{ pointerEvents: 'none' }} // 禁用点击交互
//           >
//             <source
//               src={`videos/${drawResultsRef.current[currentCardIndex]?.card?.character}金卡.MOV`}
//               type="video/mp4"
//             />
//             Your browser does not support the video tag.
//           </video>
//         )}
//
//         {/* 展示卡片内容 */}
//         {(isFiveStar && videoPlayed) || !isFiveStar ? (
//           <>
//             <div className="fixed w-full h-full inset-0 z-0">
//               {/* 设置卡片展示层的 z-index 为 0 */}
//               <LazyLoadImage
//                 className="w-screen h-screen object-cover"
//                 style={{
//                   width: '100vw',
//                   height: '100vh',
//                   objectFit: 'cover',
//                   objectPosition: 'center',
//                 }}
//                 src={drawResultsRef.current[currentCardIndex]?.card?.image}
//                 placeholderSrc={drawResultsRef.current[currentCardIndex]?.card?.image_small}
//                 effect="blur"
//                 alt="抽到的卡片"
//                 crossOrigin="anonymous"
//                 key={currentCardIndex}
//               />
//             </div>
//
//             <div className="h-screen w-screen pl-8">
//               <div className="relative w-full h-full">
//                 <div className="absolute bottom-[22%] left-[10%] w-full h-[6%] flex items-center">
//                   <img
//                     src={drawResultsRef.current[currentCardIndex]?.card?.card_star_icon}
//                     alt="星级"
//                     className="h-[36px] object-contain"
//                   />
//                   <img
//                     src={drawResultsRef.current[currentCardIndex]?.card?.card_color}
//                     alt="星谱"
//                     className="h-[24px] object-contain ml-[12px]"
//                   />
//                   <img
//                     src={drawResultsRef.current[currentCardIndex]?.card?.card_type}
//                     alt="类型（日卡月卡）"
//                     style={{
//                       height: `${cardTypeHeight}px`,
//                       maxHeight: `${cardTypeHeight}px`,
//                       objectFit: 'contain',
//                     }}
//                     className="object-contain ml-[8px]"
//                   />
//                 </div>
//
//                 {/* 文字区域 */}
//                   <div className="absolute bottom-[13%] left-[10%] w-full h-[12%] flex items-center">
//                       {/*<img*/}
//                       {/*  className="h-[48px] object-contain"*/}
//                       {/*  src={`signs/${drawResultsRef.current[currentCardIndex]?.card?.character}.png`}*/}
//                       {/*  alt="角色"*/}
//                       {/*/>*/}
//                       <h1
//                           style={{
//                               color: 'white',
//                               fontSize: '30px',
//                               textShadow: shadowColor,
//                               fontFamily: '"SimSun", "宋体", serif',
//                               fontWeight: '800',
//                               marginLeft: '2px',
//                               alignSelf: 'center',
//                           }}
//                       >
//                           {drawResultsRef.current[currentCardIndex]?.card?.character}·
//                       </h1>
//
//                       <h1
//                           style={{
//                               color: 'white',
//                               fontSize: '40px',
//                               textShadow: shadowColor,
//                               fontFamily: '"SimSun", "宋体", serif',
//                               fontWeight: '800',
//                               marginLeft: '2px',
//                               alignSelf: 'center',
//                           }}
//                       >
//                           {drawResultsRef.current[currentCardIndex]?.card?.name}
//                       </h1>
//                   </div>
//               </div>
//             </div>
//           </>
//         ) : null}
//       </div>
//     )
//   );
// };
//
// export default CardOverlay;
