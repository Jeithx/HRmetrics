import React, { createContext, useContext, useState, useCallback } from 'react';
import { SUPPORTER_THEMES } from '../constants/supporter';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryMuted: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  error: string;
  success: string;
  border: string;
}

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

function buildColors(themeId: string | null): ThemeColors {
  if (!themeId) return BASE_COLORS;
  const theme = SUPPORTER_THEMES.find((t) => t.id === themeId);
  if (!theme) return BASE_COLORS;
  return {
    ...BASE_COLORS,
    ...theme.colors,
    primaryMuted: theme.colors.primary + '20',
  };
}

interface ThemeContextValue {
  Colors: ThemeColors;
  activeThemeId: string | null;
  setThemeId: (id: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  Colors: BASE_COLORS,
  activeThemeId: null,
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);

  const setThemeId = useCallback((id: string | null) => {
    setActiveThemeId(id);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ Colors: buildColors(activeThemeId), activeThemeId, setThemeId }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
