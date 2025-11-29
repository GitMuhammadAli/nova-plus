import { useUIStore } from '@/zustand-stores/uiStore';
import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { theme, setTheme: setUITheme } = useUIStore();
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setNextTheme(newTheme);
    setUITheme(newTheme);
  };

  return {
    theme: resolvedTheme || theme,
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      setNextTheme(theme);
      setUITheme(theme);
    },
    toggleTheme,
  };
}

