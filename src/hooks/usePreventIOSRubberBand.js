import { useEffect } from 'react';

function preventRubberBandScroll(containerSelector = '.scrollable') {
  const isScrollable = (el) => {
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight
      ) {
        return true;
      }
      el = el.parentNode;
    }
    return false;
  };

  const handleTouchMove = (e) => {
    if (!isScrollable(e.target)) {
      e.preventDefault(); // 阻止回弹
    }
  };

  document.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    document.removeEventListener('touchmove', handleTouchMove);
  };
}

export default function usePreventIOSRubberBand(containerSelector = '.scrollable') {
  useEffect(() => {
    const cleanup = preventRubberBandScroll(containerSelector);
    return cleanup;
  }, [containerSelector]);
}