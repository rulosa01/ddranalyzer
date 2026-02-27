import { useState, useCallback } from 'react';

const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('ddr-dark-mode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('ddr-dark-mode', JSON.stringify(newValue));
      } catch {}
      return newValue;
    });
  }, []);

  return { darkMode, toggleDarkMode };
};

export default useDarkMode;
