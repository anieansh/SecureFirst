import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accentGold: '#b48600',
    accentDanger: '#d93025',
    accentWarning: '#b48500',
    accentSuccess: '#178a36',
    borderLight: '#e2e8f0',
    shadowColor: '#64748b',
  },
  dark: {
    bgPrimary: '#0f1115',
    bgSecondary: '#1a1d24',
    textPrimary: '#ffffff',
    textSecondary: '#a0aab2',
    accentGold: '#1DD3B0',
    accentDanger: '#ea4335',
    accentWarning: '#fbbc04',
    accentSuccess: '#34a853',
    borderLight: '#2a2e3b',
    shadowColor: '#000000',
  }
};

export const ThemeContext = createContext<{
  themeMode: 'light' | 'dark' | 'automatic';
  setThemeMode: (mode: 'light' | 'dark' | 'automatic') => void;
}>({
  themeMode: 'dark',
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'automatic'>('dark');
  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useThemeMode() {
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useContext(ThemeContext);
  const isDark = themeMode === 'automatic' ? colorScheme === 'dark' : themeMode === 'dark';
  
  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return { isDark, toggleTheme, themeMode, setThemeMode };
}

export function useTheme() {
  const colorScheme = useColorScheme();
  const { themeMode } = useContext(ThemeContext);
  const activeTheme = themeMode === 'automatic' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeMode;
  return Colors[activeTheme] || Colors.light;
}
