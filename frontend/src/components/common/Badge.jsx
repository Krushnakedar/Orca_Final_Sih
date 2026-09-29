import React from 'react';
import clsx from 'clsx';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotPulse = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants = {
    default: 'bg-surface-secondary text-foreground border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success-surface text-success border border-success/30 dark:bg-success/15 dark:text-success',
    warning: 'bg-warning-surface text-warning border border-warning/30 dark:bg-warning/15 dark:text-warning',
    danger: 'bg-danger-surface text-danger border border-danger/30 dark:bg-danger/15 dark:text-danger',
    info: 'bg-info-surface text-info border border-info/30 dark:bg-info/15 dark:text-info',
    accent: 'bg-accent/10 text-accent border border-accent/20',
    outline: 'bg-transparent text-foreground border border-border',
  };

  const dotColors = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    accent: 'bg-accent',
    outline: 'bg-muted-foreground',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  return (
    <span className={clsx(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant] || dotColors.default,
            dotPulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}
