import { useState, useEffect } from 'react';

const useResponsiveFontSize = () => {
  const [fontsize, setFontsize] = useState(16);

  const getShorterSide = () => {
    if (window.visualViewport) {
      const { width, height } = window.visualViewport;
      return Math.min(width, height);
    } else {
      return Math.min(window.innerWidth, window.innerHeight);
    }
  };


  const getVisualShorterSide = () => {
    const { width, height } = window.visualViewport || window;
    const isPortrait = height >= width;

    // 如果是横屏，但我们旋转了内容当作竖屏显示，就用长边代替短边
    if (!isPortrait) {
    return Math.max(width, height); // 用视觉“高度”
    }
    return Math.min(width, height);
  };


  const updateFontSize = () => {
    const shorter = getShorterSide();

    let base, scale, min, max;

    if (shorter < 500) {
      base = 30;
      scale = 0.85;
      min = 12;
      max = 20;
    } else if (shorter < 600) {
      base = 34;
      scale = 0.85;
      min = 14;
      max = 24;
    } else {
      base = 34;
      scale = 0.85;
      min = 16;
      max = 26;
    }

    let size = (shorter / base) * scale;
    size = Math.max(min, Math.min(max, size));
    setFontsize(size);
  };

  useEffect(() => {
    updateFontSize();

    const handleViewportChange = () => {
      updateFontSize();
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    // fallback：轮询 viewport 改变（特别是 iOS Safari、微信浏览器）
    let lastShorter = getShorterSide();
    const intervalId = setInterval(() => {
      const newShorter = getShorterSide();
      if (Math.abs(newShorter - lastShorter) > 1) {
        lastShorter = newShorter;
        updateFontSize();
      }
    }, 300);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      clearInterval(intervalId);
    };
  }, []);

  return fontsize;
};

export default useResponsiveFontSize;
