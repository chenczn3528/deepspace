import { useState, useEffect, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';

const HISTORY_KEY = 'ds_history';
const MAX_HISTORY = 100000;

export function useHistoryDB() {
  const [history, setHistoryState] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初始化加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      const stored = await get(HISTORY_KEY);
      setHistoryState(stored || []);
      setLoading(false);
    };
    loadHistory();
  }, []);

  // 追加记录
  const appendHistory = useCallback(async (newEntries) => {
    const existing = (await get(HISTORY_KEY)) || [];
    const combined = [...existing, ...newEntries];
    const trimmed = combined.slice(-MAX_HISTORY);
    await set(HISTORY_KEY, trimmed);
    setHistoryState(trimmed);
  }, []);

  // 清空记录
  const clearHistory = useCallback(async () => {
    await del(HISTORY_KEY);
    setHistoryState([]);
  }, []);

  return {
    history,
    loading,
    appendHistory,
    clearHistory,
  };
}