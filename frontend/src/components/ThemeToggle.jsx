import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

export default function ThemeToggle({ className = '', showLabel = false, size = 'md' }) {
  const { theme, isDark, toggleTheme } = useTheme();

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonPaddings = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        'relative inline-flex items-center gap-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40',
        'bg-surface-secondary hover:bg-surface-tertiary text-foreground border border-border',
        buttonPaddings[size] || buttonPaddings.md,
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (currently ${theme} mode)`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className={clsx(iconSizes[size] || iconSizes.md, 'text-amber-400 animate-in spin-in-90 duration-200')} />
        ) : (
          <Moon className={clsx(iconSizes[size] || iconSizes.md, 'text-ocean-600 animate-in -spin-in-90 duration-200')} />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium select-none">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
