import React from 'react';
import clsx from 'clsx';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-surface border border-border text-foreground transition-all duration-200 shadow-sm',
        hover && 'hover:border-border-subtle hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('p-5 sm:p-6 border-b border-border/80 flex flex-col gap-1.5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component
      className={clsx('text-base sm:text-lg font-bold text-foreground tracking-tight', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={clsx('text-xs sm:text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={clsx('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('p-4 sm:p-5 border-t border-border/80 bg-surface-secondary/40 rounded-b-2xl flex items-center justify-between gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
