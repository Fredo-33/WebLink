import React, { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'light') {
      setIsDark(false);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('themeMode', isDark ? 'dark' : 'light');
    }
  }, [isDark, isHydrated]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const theme = {
    isDark,
    moduleBg: isDark ? 'rgba(118, 120, 128, 0.88)' : 'rgba(212, 212, 212, 0.62)',
    textPrimary: isDark ? 'white' : 'black',
    textSecondary: isDark ? '#dadada' : '#555555',
    accentGreen: '#4ade80',
    accentRed: '#d9534f',
    accentYellow: '#fbbf24',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(212, 212, 212, 0.62)',
    cardBg2: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(228, 228, 228, 0.88)',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(204, 204, 204, 0.92)',
    hoverBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(240, 240, 240, 0.88)',
    shadow: isDark ? 'white 0 0 82px -18px' : 'rgba(0, 0, 0, 0.1) 0 0 40px -10px',
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, isHydrated }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  return context;
};

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      <button onClick={toggleTheme} className="themeToggle" title={isDark ? 'Mode clair' : 'Mode sombre'}> {isDark ? '🌙' : '☀️'} </button>

<style jsx>{`

.themeToggle { width: 40px; height: 40px; border-radius: 50%; background: rgba(118, 120, 128, 0.88); border: 2px solid rgba(74, 222, 128, 0.68); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.28s ease; }

.themeToggle:hover { background: rgba(118, 120, 128, 0.88); transform: scale(1.1); }

.themeToggle:active { transform: scale(0.94); }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.themeToggle:active { animation: spin 0.4s ease; }

@media (max-width: 600px) {
	.themeToggle { width: 34.8px; height: 34.8px; font-size: 16px; margin: 10px 3.8px 0 0; }
}

`}</style>

    </>
  )
}