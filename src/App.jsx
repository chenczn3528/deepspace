import { useEffect, useRef, useState } from 'react';
import './App.css';
import Home from './Home.jsx';
import AssetManager from './components/AssetManager.jsx';
import AssetTest from './components/AssetTest.jsx'; // 添加这行

function App() {
  const wrapperRef = useRef();
  const gameRef = useRef();
  const [isPortrait, setIsPortrait] = useState(window.innerHeight >= window.innerWidth);
  const [showAssetTest, setShowAssetTest] = useState(true);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const portrait = h >= w;
    setIsPortrait(portrait);

    const wrapper = wrapperRef.current;
    const game = gameRef.current;

    let gameW, gameH;

    if (!portrait) {
      // 横屏时旋转内容适应竖屏
      gameW = h;
      gameH = w;

      wrapper.style.width = `${h}px`;
      wrapper.style.height = `${w}px`;
      wrapper.style.transform = `translate(-50%, -50%) rotate(-90deg)`;
    } else {
      // 竖屏时正常显示，无旋转
      gameW = w;
      gameH = h;

      wrapper.style.width = `${w}px`;
      wrapper.style.height = `${h}px`;
      wrapper.style.transform = `translate(-50%, -50%) rotate(0deg)`;
    }

    game.style.width = `${gameW}px`;
    game.style.height = `${gameH}px`;
  };

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);



  // App.jsx 中添加 useEffect
  useEffect(() => {
    const updateRealVh = () => {
      const realHeight = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--real-vh', `${realHeight}px`);
      // console.log(realHeight, window.innerHeight)
    };

    updateRealVh();
    window.visualViewport?.addEventListener('resize', updateRealVh);
    window.addEventListener('resize', updateRealVh);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateRealVh);
      window.removeEventListener('resize', updateRealVh);
    };
  }, []);



  return (
    <div className="viewport">
      <div className="wrapper" ref={wrapperRef}>
        <div className="game relative" ref={gameRef}>
          {showAssetTest ? (
            <AssetTest onClose={() => setShowAssetTest(false)} />
          ) : (
            <Home isPortrait={isPortrait} openAssetTest={() => setShowAssetTest(true)} />
          )}
          {/* <AssetManager/> */}
        </div>
      </div>
    </div>
    // <AssetTest />
  );
}

export default App;