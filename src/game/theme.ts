// Theme definitions for light and dark mode

export interface Theme {
  // Backgrounds
  background: string;
  backgroundGradient: string[];
  cardBg: string;
  cardBgGradient: string[];

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accents
  accentPurple: string;
  accentPink: string;
  accentTeal: string;
  accentBlue: string;

  // UI elements
  danger: string;
  success: string;
  timerGradient: string[];

  // Grid
  gridBg: string;
  cellBg: string;
  cellBorder: string;

  // Glow effects (for dark mode)
  glowEnabled: boolean;
  glowColor: string;

  // Status bar
  statusBarStyle: 'light-content' | 'dark-content';
}

export const lightTheme: Theme = {
  // Backgrounds - soft cream/beige to match HomeScreen
  background: '#F5F0E8',
  backgroundGradient: ['#F5F0E8', '#F8F4EC', '#FFF9F0', '#F5F0E8'],
  cardBg: '#FFFFFF',
  cardBgGradient: ['#FFFEF5', '#FFF9E8'],

  // Text
  textPrimary: '#4A4A4A',
  textSecondary: '#7A7A7A',
  textMuted: '#B0B0B0',

  // Accents
  accentPurple: '#9B7ED9',
  accentPink: '#E8A4C4',
  accentTeal: '#5BBFBA',
  accentBlue: '#7EC8E3',

  // UI elements
  danger: '#E57373',
  success: '#81C784',
  timerGradient: ['#F8BBD9', '#E1BEE7', '#D1C4E9'],

  // Grid
  gridBg: '#FAFBFC',
  cellBg: '#F5F5F5',
  cellBorder: 'rgba(255, 255, 255, 0.8)',

  // Glow effects
  glowEnabled: false,
  glowColor: 'transparent',

  // Status bar
  statusBarStyle: 'dark-content',
};

export const darkTheme: Theme = {
  // Backgrounds - dark navy to match HomeScreen
  background: '#0D0D1A',
  backgroundGradient: ['#0D0D1A', '#1A1A2E', '#16213E', '#0D0D1A'],
  cardBg: '#1E1E32',
  cardBgGradient: ['#252540', '#1E1E32'],

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C0',
  textMuted: '#6A6A7A',

  // Accents
  accentPurple: '#A855F7',
  accentPink: '#EC4899',
  accentTeal: '#14B8A6',
  accentBlue: '#3B82F6',

  // UI elements
  danger: '#EF4444',
  success: '#22C55E',
  timerGradient: ['#1E1E32', '#2D2D4A'],

  // Grid
  gridBg: '#151525',
  cellBg: '#1A1A2A',
  cellBorder: '#2A2A4A',

  // Glow effects
  glowEnabled: true,
  glowColor: '#00FFFF',

  // Status bar
  statusBarStyle: 'light-content',
};

// Neon paint colors for dark mode
export const darkPaintColors = [
  '#00FFFF', // Cyan
  '#14B8A6', // Teal
  '#22C55E', // Green
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#3B82F6', // Blue
];

// Pastel paint colors for light mode
export const lightPaintColors = [
  '#5BBFBA', // Teal
  '#7EC8E3', // Sky Blue
  '#A8E6CF', // Mint Green
  '#E8A4C4', // Coral Pink
  '#C5B3E3', // Lavender
  '#FFD180', // Peach
  '#B5EAD7', // Seafoam
  '#FFDAC1', // Apricot
];

export const getTheme = (darkMode: boolean): Theme => {
  return darkMode ? darkTheme : lightTheme;
};

export const getPaintColors = (darkMode: boolean): string[] => {
  return darkMode ? darkPaintColors : lightPaintColors;
};
