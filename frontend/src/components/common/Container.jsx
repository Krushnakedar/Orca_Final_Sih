import React from 'react';
import clsx from 'clsx';

export default function Container({
  children,
  className = '',
  size = 'default',
  as: Component = 'div',
  ...props
}) {
  const sizes = {
    sm: 'max-w-4xl',
    default: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <Component
      className={clsx('w-full mx-auto px-4 sm:px-6 lg:px-8', sizes[size] || sizes.default, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
