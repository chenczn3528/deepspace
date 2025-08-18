import React, { useEffect, useState } from 'react';
import { useAssetLoader } from '../hooks/useAssetLoader';

const TestProbability = ({ getRandomCard, setShowProbability, fontsize }) => {

  const [testCount, setTestCount] = useState(100000);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const { loadAsset } = useAssetLoader();
  const [bgUrl, setBgUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const url = await loadAsset('image', '结算背景.jpg', { onlyCached: true });
        if (isMounted) setBgUrl(url || null);
      } catch {
        if (isMounted) setBgUrl(null);
      }
    })();
    return () => { isMounted = false; };
  }, [loadAsset]);


  const runTest = () => {
    setLoading(true);
    let pity = 0;
    let fourStarCounter = 0;
    let fiveStarCount = 0;
    let fourStarCount = 0;
    let threeStarCount = 0;

    for (let i = 0; i < testCount; i++) {
      const result = getRandomCard(pity, fourStarCounter, false, '随机', false, true);
      const rarity = result.rarity;

      if (rarity === '5') {
        fiveStarCount++;
        pity = 0;
        fourStarCounter = 0;
      } else {
        pity++;
        if (rarity === '4') {
          fourStarCount++;
          fourStarCounter = 0;
        } else {
          threeStarCount++;
          fourStarCounter++;
        }
      }
    }

    const total = fiveStarCount + fourStarCount + threeStarCount;

    setResult({
      total,
      fiveStarCount,
      fourStarCount,
      threeStarCount,
      averageFive: fiveStarCount ? (total / fiveStarCount).toFixed(2) : 'N/A',
    });
    setLoading(false);
  };

  return (
      <div
          className="absolute w-full h-full flex justify-center items-center z-50"
          onClick={()=>setShowProbability(false)}
      >
        <div
            className="absolute flex flex-col"
            style={{
              backgroundImage: `url(${bgUrl || 'images/结算背景.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              width: `${fontsize * 26}px`,
              height: `${fontsize * 32}px`,
              color: 'black',
              marginLeft: `${fontsize * 2}px`,
              marginRight: `${fontsize * 2}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >

          <div className="flex flex-col"
               style={{fontSize: `${fontsize * 1.2}px`, margin: `${fontsize * 2}px`}}>
            <label>（测试概率有没有出bug）</label>
            <label>（仅测试基础版，即常驻池概率）</label>
          </div>

          <div className="flex flex-row justify-center items-center" style={{marginBottom: `${fontsize * 2}px`}}>
            <label style={{"fontWeight": 800, fontSize: `${fontsize * 1.2}px`}}>测试次数：</label>
            <input
                type="number"
                value={testCount}
                onChange={(e) => setTestCount(parseInt(e.target.value))}
                style={{height: `${fontsize * 2}px`, fontSize: `${fontsize * 1.2}px`}}
            />
          </div>

          <button
              onClick={runTest}
              style={{marginLeft: `${fontsize * 2}px`, marginRight: `${fontsize * 2}px`, fontSize: `${fontsize * 1.2}px`}}
              disabled={loading}
          >
            开始测试
          </button>

          <div className="flex flex-col" style={{margin: `${fontsize * 2}px`, fontSize: `${fontsize * 1.5}px`}}>
            <div className="flex-row">
              <label style={{"fontWeight": 800}}>抽卡总数：</label>
              <label>{result ? result.total : ''}</label>
            </div>

            <div className="flex-row">
              <label style={{"fontWeight": 800}}>五星数量：</label>
              <label>
                {result ? result.fiveStarCount : ''}（
                {result ? ((result.fiveStarCount / result.total) * 100).toFixed(2) : '?'}%）
              </label>
            </div>

            <div className="flex-row">
              <label style={{fontWeight: 800}}>四星数量：</label>
              <label>
                {result ? result.fourStarCount : ''}（
                {result ? ((result.fourStarCount / result.total) * 100).toFixed(2) : '?'}%）
              </label>
            </div>

            <div className="flex-row">
              <label style={{"fontWeight": 800}}>三星数量：</label>
              <label>
                {result ? result.threeStarCount : ''}（
                {result ? ((result.threeStarCount / result.total) * 100).toFixed(2) : '?'}%）
              </label>
            </div>

            <div className="flex-row">
              <label style={{"fontWeight": 800}}>平均出金：</label>
              <label>{result ? result.averageFive : ''}</label>
            </div>
          </div>

        </div>
      </div>

  );
};

export default TestProbability;
