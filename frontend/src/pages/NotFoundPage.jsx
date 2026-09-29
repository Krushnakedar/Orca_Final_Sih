import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[500px] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-border space-y-4 shadow-sm">
        <div className="p-3 w-fit mx-auto rounded-full bg-info-surface border border-info/30 text-primary">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground">404</h1>
        <h2 className="text-lg font-bold text-foreground">Lost at Sea?</h2>
        <p className="text-xs text-muted-foreground">
          The marine coordinate or page you requested does not exist in the ORCA navigation index.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Safety</span>
        </Link>
      </div>
    </div>
  );
}
