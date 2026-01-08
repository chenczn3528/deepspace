import { useState, useEffect } from 'react';
import { loadDataFile } from '../utils/dataLoader.js';
import cardDataStatic from '../assets/cards.json';
import poolCategoriesStatic from '../assets/poolCategories.json';
import songsListStatic from '../assets/songs_list.json';

export function useDataLoader() {
  const [cardData, setCardData] = useState(cardDataStatic);
  const [poolCategories, setPoolCategories] = useState(poolCategoriesStatic);
  const [songsList, setSongsList] = useState(songsListStatic);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [cards, pools, songs] = await Promise.all([
          loadDataFile('cards.json', cardDataStatic),
          loadDataFile('poolCategories.json', poolCategoriesStatic),
          loadDataFile('songs_list.json', songsListStatic),
        ]);

        if (!cancelled) {
          setCardData(cards);
          setPoolCategories(pools);
          setSongsList(songs);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('数据加载失败:', err);
          setError(err);
          setLoading(false);
          setCardData(cardDataStatic);
          setPoolCategories(poolCategoriesStatic);
          setSongsList(songsListStatic);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    cardData,
    poolCategories,
    songsList,
    loading,
    error,
  };
}
