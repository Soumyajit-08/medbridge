import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme) {
  const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme());
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  return isDark;
}

const initialTheme = (typeof window !== 'undefined' && (localStorage.getItem('medbridge-theme') as Theme)) || 'system';
const initialIsDark = applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set, get) => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (get().theme === 'system') {
        const isDark = applyTheme('system');
        set({ isDark });
      }
    });
  }

  return {
    theme: initialTheme,
    isDark: initialIsDark,
    setTheme: (theme: Theme) => {
      localStorage.setItem('medbridge-theme', theme);
      const isDark = applyTheme(theme);
      set({ theme, isDark });
    },
    toggleTheme: () => {
      const current = get().isDark;
      const nextTheme: Theme = current ? 'light' : 'dark';
      localStorage.setItem('medbridge-theme', nextTheme);
      const isDark = applyTheme(nextTheme);
      set({ theme: nextTheme, isDark });
    },
  };
});
