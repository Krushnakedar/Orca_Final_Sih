import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size] || sizeClasses.md}`} />
      {message && <p className="text-sm text-muted-foreground font-medium">{message}</p>}
    </div>
  );
}
