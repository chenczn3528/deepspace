// HistoryModal.jsx
import React, { useMemo, useState } from 'react';
import FilterIcon from '../icons/FilterIcon.jsx';

const FILTER_MODES = [
  { key: 'all', label: '全部', color: '#e5c07b', description: '显示全部稀有度', extra: '上限 2000 条' },
  { key: '5and4', label: '4-5星', color: '#9ca3af', description: '仅显示五星与四星', extra: '上限 2000 条' },
  { key: '5only', label: '5星', color: '#c084fc', description: '仅显示五星', extra: '不限条数' },
];

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


  const [filterIndex, setFilterIndex] = useState(0);
  const listRef = React.useRef(null);

  const filteredHistory = useMemo(() => {
    const mode = FILTER_MODES[filterIndex % FILTER_MODES.length].key;
    let filtered = history || [];
    if (mode === '5only') {
      filtered = filtered.filter((card) => (card.star || '').includes('5'));
      return filtered.slice().reverse(); // no limit
    }
    if (mode === '5and4') {
      filtered = filtered.filter((card) => {
        const star = card.star || '';
        return star.includes('5') || star.includes('4');
      });
    }
    return filtered.slice(-2000).reverse();
  }, [history, filterIndex]);

  const currentFilter = FILTER_MODES[filterIndex % FILTER_MODES.length];

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

          <div
            className="flex flex-col items-center justify-center gap-1"
            style={{
              color: 'lightgray',
              fontSize: `${fontsize * 1}px`,
              marginBottom: `${fontsize * 0.4}px`,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: `${fontsize * 0.4}px` }}>
              <span>{currentFilter.description}</span>
              <button
                onClick={() => {
                  setFilterIndex((prev) => {
                    const next = (prev + 1) % FILTER_MODES.length;
                    requestAnimationFrame(() => {
                      if (listRef.current) {
                        listRef.current.scrollTop = 0;
                      }
                    });
                    return next;
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FilterIcon size={fontsize * 1.3} color={currentFilter.color} />
              </button>
            </div>
            <div style={{ fontSize: `${fontsize * 0.9}px`, color: '#d1d5db' }}>{currentFilter.extra}</div>
          </div>


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
                  ref={listRef}
                  style={{
                      fontSize: `${fontsize}px`,
                      width: `${fontsize * 24}px`,
                      marginBottom: `${fontsize * 2.2}px`,
                  }}
              >
                  {filteredHistory.map((card, idx) => {
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

                      const showMarker = idx > 0 && idx % 10 === 0;

                      return (
                        <React.Fragment key={`${card.timestamp}-${idx}`}>
                          {showMarker && (
                            <div
                              style={{
                                fontSize: `${fontsize * 0.9}px`,
                                color: '#34d399',
                                textAlign: 'center',
                                padding: `${fontsize * 0.3}px 0`,
                              }}
                            >
                              —— {idx} 条记录 ——
                            </div>
                          )}
                          <div
                              style={{backgroundColor, fontSize: `${fontsize}px`, height: `${fontsize * 1.8}px`}}
                              className="flex flex-row justify-center items-center"
                          >
                              <div style={style1}>{card.star}</div>
                              <div style={style2}>{card.character}·{card.name}</div>
                              <div style={style2}>{formatDate(card.timestamp)}</div>
                          </div>
                        </React.Fragment>
                      );
                  })}
                  {filteredHistory.length > 0 && (
                    <div
                      style={{
                        fontSize: `${fontsize * 0.9}px`,
                        color: '#34d399',
                        textAlign: 'center',
                        padding: `${fontsize * 0.3}px 0`,
                      }}
                    >
                      —— 共 {filteredHistory.length} 条记录 ——
                    </div>
                  )}
              </div>
        </div>
      </div>
    )
  );
};

export default HistoryModal;
