import React, { createContext, useContext, useState, useCallback } from 'react';
import { applyTheme, buildColors, ThemeColors } from '../constants/theme';
import { SUPPORTER_THEMES } from '../constants/supporter';

const BASE_COLORS: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  primary: '#C8FF00',
  primaryMuted: '#C8FF0020',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#444444',
  error: '#FF4444',
  success: '#00C851',
  border: '#2A2A2A',
};

interface ThemeContextValue {
  Colors: ThemeColors;
  activeThemeId: string | null;
  setThemeId: (id: string | null) => void;
  themeKey: number;
}

const ThemeContext = createContext<ThemeContextValue>({
  Colors: BASE_COLORS,
  activeThemeId: null,
  setThemeId: () => {},
  themeKey: 0,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [themeKey, setThemeKey] = useState(0);

  const setThemeId = useCallback((id: string | null) => {
    applyTheme(id);
    setActiveThemeId(id);
    setThemeKey((k) => k + 1);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ Colors: buildColors(activeThemeId), activeThemeId, setThemeId, themeKey }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
