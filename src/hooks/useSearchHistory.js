import { useState, useCallback } from 'react';

const useSearchHistory = (maxItems = 10) => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ddr-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((query) => {
    if (!query || query.length < 2) return;
    setHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      const newHistory = [query, ...filtered].slice(0, maxItems);
      try {
        localStorage.setItem('ddr-search-history', JSON.stringify(newHistory));
      } catch {}
      return newHistory;
    });
  }, [maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('ddr-search-history');
    } catch {}
  }, []);

  const removeFromHistory = useCallback((query) => {
    setHistory(prev => {
      const newHistory = prev.filter(q => q !== query);
      try {
        localStorage.setItem('ddr-search-history', JSON.stringify(newHistory));
      } catch {}
      return newHistory;
    });
  }, []);

  return { history, addToHistory, clearHistory, removeFromHistory };
};

export default useSearchHistory;
