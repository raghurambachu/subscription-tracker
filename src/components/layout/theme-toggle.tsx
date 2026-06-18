import * as React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center rounded-full bg-base-800 p-1"
    >
      <button
        role="radio"
        aria-checked={theme === 'dark'}
        onClick={() => setTheme('dark')}
        title="Dark mode"
        className={cn(
          'flex items-center justify-center rounded-full p-1.5 transition-colors',
          theme === 'dark' ? 'bg-base-600 text-base-50' : 'text-base-400 hover:text-base-200'
        )}
      >
        <Moon className="size-3.5" />
      </button>
      <button
        role="radio"
        aria-checked={theme === 'light'}
        onClick={() => setTheme('light')}
        title="Light mode"
        className={cn(
          'flex items-center justify-center rounded-full p-1.5 transition-colors',
          theme === 'light' ? 'bg-base-600 text-base-50' : 'text-base-400 hover:text-base-200'
        )}
      >
        <Sun className="size-3.5" />
      </button>
    </div>
  );
}
