import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm shadow-primary/20 active:scale-[0.98]',
    secondary:
      'bg-surface-secondary hover:bg-surface-tertiary text-foreground border border-border active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-surface-secondary text-foreground border border-border active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-surface-secondary text-muted-foreground hover:text-foreground active:scale-[0.98]',
    danger:
      'bg-danger hover:opacity-90 text-danger-foreground shadow-sm shadow-danger/20 active:scale-[0.98]',
    success:
      'bg-success hover:opacity-90 text-success-foreground shadow-sm shadow-success/20 active:scale-[0.98]',
    accent:
      'bg-accent hover:opacity-90 text-accent-foreground shadow-sm shadow-accent/20 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
    </button>
  );
}
