import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleThemeWithTransition: (origin?: { x: number; y: number } | 'center') => void;
  setThemeWithTransition: (theme: ThemeMode, origin?: { x: number; y: number } | 'center') => void;
}

const STORAGE_KEY = 'rla_theme_mode';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDOM = (resolved: 'light' | 'dark') => {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const saved = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as ThemeMode | null;
  const initialTheme: ThemeMode = saved || 'light';
  const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;

  if (typeof window !== 'undefined') {
    applyThemeToDOM(initialResolved);

    // Listen to system OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (get().theme === 'system') {
        const nextResolved = getSystemTheme();
        applyThemeToDOM(nextResolved);
        set({ resolvedTheme: nextResolved });
      }
    });
  }

  const applyWithCircularTransition = (
    nextTheme: ThemeMode,
    origin: { x: number; y: number } | 'center' = 'center'
  ) => {
    const targetResolved = nextTheme === 'system' ? getSystemTheme() : nextTheme;
    const doc = document as unknown as {
      startViewTransition?: (updateCallback: () => void) => {
        ready: Promise<void>;
        finished?: Promise<void>;
      };
    };

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If browser doesn't support View Transitions API or user prefers reduced motion
    if (!doc.startViewTransition || isReducedMotion) {
      get().setTheme(nextTheme);
      return;
    }

    // Determine circular expansion epicenter (default: screen center)
    const x = origin === 'center' ? window.innerWidth / 2 : origin.x;
    const y = origin === 'center' ? window.innerHeight / 2 : origin.y;

    // Calculate maximum radius to the furthest screen corner with a 15% overshoot + 60px buffer.
    // This ensures the sharp geometric circle edge fully clears all 4 corners BEFORE the animation terminates,
    // eliminating the abrupt snapping/cutting sensation at the finish line.
    const endRadius =
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      ) * 1.15 + 60;

    // Temporarily suppress live DOM CSS transitions (e.g. Tailwind transition-colors)
    // so the live DOM and snapshot render consistently without a dual-transition visual pop
    document.documentElement.classList.add('theme-transitioning');

    const cleanup = () => {
      document.documentElement.classList.remove('theme-transitioning');
    };

    // Failsafe timeout to ensure the class is always removed even if transition cancels
    const fallbackTimeout = setTimeout(cleanup, 700);

    const transition = doc.startViewTransition(() => {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      applyThemeToDOM(targetResolved);
      set({ theme: nextTheme, resolvedTheme: targetResolved });
      syncThemeToCloud(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      const animation = document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 480,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth ease-out exponential glide
          fill: 'forwards',
          pseudoElement: '::view-transition-new(root)',
        }
      );

      animation.finished.finally(() => {
        clearTimeout(fallbackTimeout);
        cleanup();
      });
    });

    if (transition.finished) {
      transition.finished.finally(() => {
        clearTimeout(fallbackTimeout);
        cleanup();
      });
    }
  };

  const syncThemeToCloud = (theme: ThemeMode) => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    const isPublicOrAuthRoute =
      path === '/' ||
      path === '/login' ||
      path === '/signup' ||
      path === '/email-verification' ||
      path === '/mobile-verification' ||
      path === '/forgot-password' ||
      path === '/onboarding';

    // On auth screens, onboarding, and landing page: managed via local storage only!
    if (isPublicOrAuthRoute) return;

    // Inside authenticated dashboard: save to MongoDB
    apiClient.patch('/auth/theme', { theme }).catch(() => undefined);
  };

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,
    setTheme: (theme: ThemeMode) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      localStorage.setItem(STORAGE_KEY, theme);
      applyThemeToDOM(resolved);
      set({ theme, resolvedTheme: resolved });
      syncThemeToCloud(theme);
    },
    toggleTheme: () => {
      const current = get().resolvedTheme;
      const nextTheme: ThemeMode = current === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },
    toggleThemeWithTransition: (origin = 'center') => {
      const current = get().resolvedTheme;
      const nextTheme: ThemeMode = current === 'dark' ? 'light' : 'dark';
      applyWithCircularTransition(nextTheme, origin);
    },
    setThemeWithTransition: (nextTheme: ThemeMode, origin = 'center') => {
      applyWithCircularTransition(nextTheme, origin);
    },
  };
});
