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

export function buildColors(themeId: string | null): ThemeColors {
  if (!themeId) return { ...BASE_COLORS };
  // SUPPORTER_THEMES is imported lazily to avoid circular deps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SUPPORTER_THEMES } = require('../constants/supporter') as { SUPPORTER_THEMES: { id: string; colors: Partial<ThemeColors> }[] };
  const theme = SUPPORTER_THEMES.find((t) => t.id === themeId);
  if (!theme) return { ...BASE_COLORS };
  return {
    ...BASE_COLORS,
    ...theme.colors,
    primaryMuted: (theme.colors.primary ?? BASE_COLORS.primary) + '20',
  };
}

export const Colors: ThemeColors = { ...BASE_COLORS };

export function applyTheme(themeId: string | null): void {
  Object.assign(Colors, buildColors(themeId));
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Typography = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
