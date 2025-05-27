// HistoryModal.jsx
import React from 'react';

const HistoryModal = ({ showHistory, setShowHistory, history, fontsize }) => {

  const style = {
    textAlign: 'center',
    fontWeight: '400'
  };


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


  return (
    showHistory && (
      <div
        className="absolute w-full h-full flex justify-center items-center z-50"
        onClick={() => setShowHistory(false)}
      >
        <div
            className="absolute flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{backgroundColor: '#38343dee', width: `${fontsize * 28}px`, height: `${fontsize * 40}px`}}
        >

          <label
              style={{
                zIndex: 10,
                color: 'white',
                fontSize: `${fontsize * 2}px`,
                fontWeight: 800,
                marginTop: `${fontsize * 1.5}px`,
                marginBottom: `${fontsize * 0.2}px`,
              }}
          >
            历史记录
          </label>

          <label
              style={{
                color: 'lightgray',
                fontSize: `${fontsize * 1.1}px`,
                marginBottom: `${fontsize * 1}px`,
                zIndex: 10,
              }}
          >
            只显示最新的2000条记录，多了会卡
          </label>


          {/*表头*/}
              <div
                  className="flex flex-row items-center justify-center z-10"
                  style={{
                      fontSize: `${fontsize}px`,
                      width: `${fontsize * 24}px`,
                      height: `${fontsize * 2.2}px`,
                  }}
              >
                  <div style={{...style, color: 'white', flexBasis: '20%', fontWeight: 800}}>类型</div>
                  <div style={{...style, color: 'white', flexBasis: '40%', fontWeight: 800}}>名称</div>
                  <div style={{...style, color: 'white', flexBasis: '40%', fontWeight: 800}}>许愿时间</div>
              </div>


              <div
                  className="flex-1 overflow-y-auto"
                  style={{
                      fontSize: `${fontsize}px`,
                      width: `${fontsize * 24}px`,
                      marginBottom: `${fontsize * 2.2}px`,
                  }}
              >
                  {history.slice(-2000).reverse().map((card, idx) => {
                      const cardHistoryColors = {
                          "3星": {color: "white"},
                          "4星": {color: "#a18fed"},
                          "5星": {color: "#fae192"}
                      };
                      const historyColor = cardHistoryColors[card.star] || {color: "black"};

                      const style1 = {
                          ...historyColor,
                          flexBasis: '20%',
                          textAlign: 'center',
                      };

                      const style2 = {
                          ...historyColor,
                          flexBasis: '40%',
                          textAlign: 'center',
                      };

                      const backgroundColor = idx % 2 === 0 ? 'rgba(92,91,96,0.65)': 'transparent';

                      return (
                          <div
                              key={idx}
                              style={{backgroundColor, fontSize: `${fontsize}px`, height: `${fontsize * 1.8}px`}}
                              className="flex flex-row justify-center items-center"
                          >
                              <div style={style1}>{card.star}</div>
                              <div style={style2}>{card.character}·{card.name}</div>
                              <div style={style2}>{formatDate(card.timestamp)}</div>
                          </div>
                      );
                  })}
              </div>
        </div>
      </div>
    )
  );
};

export default HistoryModal;
