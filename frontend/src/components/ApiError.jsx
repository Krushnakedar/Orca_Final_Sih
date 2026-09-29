import React from 'react';

/**
 * Offline-aware error block.
 *
 * Usage:
 *   const [err, setErr] = useState(null);
 *   ...
 *   <ApiError error={err} onRetry={() => doIt()} />
 *
 * - err.offline === true -> amber offline message
 * - otherwise            -> red backend error
 * - err === null         -> renders nothing
 */
export default function ApiError({ error, onRetry, className = '' }) {
  if (!error) return null;

  if (error.offline) {
    return (
      <div
        role="alert"
        className={`rounded-xl border border-warning/40 bg-warning-surface px-3 py-2 text-xs text-warning ${className}`}
      >
        <div className="font-semibold mb-0.5">You're offline</div>
        <div className="text-muted-foreground leading-relaxed">
          This action needs a live connection. Your page stays as it is — try again when you're back online.
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-[11px] font-medium underline underline-offset-2 hover:opacity-80"
          >
            Retry now
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`rounded-xl border border-danger/40 bg-danger-surface px-3 py-2 text-xs text-danger ${className}`}
    >
      <div className="font-semibold mb-0.5">Something went wrong</div>
      <div className="text-muted-foreground leading-relaxed">
        {error.message || 'Unexpected error.'}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-[11px] font-medium underline underline-offset-2 hover:opacity-80"
        >
          Retry
        </button>
      )}
    </div>
  );
}