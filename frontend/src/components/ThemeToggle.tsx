'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

export function ThemeToggle() {
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-secondary"
      title="Cambiar tema"
    >
      {theme === 'dark' ? (
        <>
          <Sun size={16} className="mr-2" />
          Light
        </>
      ) : (
        <>
          <Moon size={16} className="mr-2" />
          Dark
        </>
      )}
    </button>
  );
}