import React, { useState } from 'react';

const TestProbability = ({ getRandomCard, setShowProbability }) => {

  const [testCount, setTestCount] = useState(100000);
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);


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
          className="fixed inset-0 z-50 flex flex-col items-center justify-start w-screen h-screen"
          onClick={()=>setShowProbability(false)}
      >
        <div
            className="relative flex flex-col px-5 py-5 mt-[100px]"
            style={{backgroundImage: "url('https://cdn.chenczn3528.dpdns.org/deepspace/images/结算背景.jpg')"}}
            onClick={(e) => e.stopPropagation()}
        >

          <div className="flex flex-col ml-[20px] mr-[20px] mt-[20px] mb-[20px]" style={{fontSize: '14px'}}>
            <label>（测试概率有没有出bug）</label>
            <label>（仅测试基础版，即常驻池概率）</label>
          </div>

          <div className="flex flex-row mb-[20px] ml-[20px] mr-[20px]">
            <label style={{"fontWeight": 800}}>测试次数：</label>
            <input
                type="number"
                value={testCount}
                onChange={(e) => setTestCount(parseInt(e.target.value))}
                className="text-black px-2"
            />
          </div>

          <button
              onClick={runTest}
              className={`ml-[20px] mr-[20px] px-4 py-2 font-semibold rounded ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
              disabled={loading}
          >
            开始测试
          </button>

          <div className="flex flex-col mt-[20px] mb-[20px] ml-[20px] mr-[20px]">
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
