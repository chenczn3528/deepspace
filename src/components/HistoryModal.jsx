// HistoryModal.jsx
import React from 'react';

// 用于格式化日期的函数
// 记录时间的格式化
  const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = String(date.getFullYear()).slice(-2); // 取后两位
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hour}:${minute}`;
};

const HistoryModal = ({ showHistory, setShowHistory, history }) => {
  return (
    showHistory && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center w-screen h-screen"
        onClick={() => setShowHistory(false)}
      >
        <div
          className="relative flex flex-col w-[80vw] h-[60%] mb-[30%] p-4 rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src="images/结算背景.jpg"
            alt="背景"
            className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-90"
          />
          <div className="relative z-10 flex flex-col h-full" style={{ color: 'black' }}>
            <h2 className="text-xl font-bold mb-4 text-center" style={{ color: 'black' }}>
              历史记录
            </h2>
            <div className="flex-1 overflow-y-auto pr-2">
              {history.slice().reverse().map((card, idx) => {
                const cardHistoryColors = {
                  "3星": { color: "black" },
                  "4星": { color: "#a855f7" },
                  "5星": { color: "#dda516", fontWeight: "bold" }
                };
                const historyColor = cardHistoryColors[card.star] || { color: "black" };

                return (
                  <div key={idx} className="text-xs mb-2 flex justify-between">
                    <div style={historyColor} className="ml-[20px]">{card.star}</div>
                    <div style={historyColor}>{card.character}·{card.name}</div>
                    <div style={historyColor} className="mr-[20px]">{formatDate(card.timestamp)}</div>
                  </div>
                );
              })}
            </div>
            <div className="pb-[10px]"></div>
          </div>
        </div>
      </div>
    )
  );
};

export default HistoryModal;
