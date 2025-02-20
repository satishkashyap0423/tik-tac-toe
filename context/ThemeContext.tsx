import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colors: typeof themes[Theme];
}

const themes = {
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    primary: '#FF2B63',
    secondary: '#2B63FF',
    border: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.05)',
  },
  dark: {
    background: '#000000',
    surface: '#1a1a1a',
    text: '#ffffff',
    primary: '#FF2B63',
    secondary: '#2B63FF',
    border: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: themes.dark,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(colorScheme || 'dark');

  useEffect(() => {
    if (colorScheme) {
      setTheme(colorScheme);
    }
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}