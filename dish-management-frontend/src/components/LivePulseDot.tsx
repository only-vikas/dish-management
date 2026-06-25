/**
 * src/components/LivePulseDot.tsx
 *
 * Animated emerald pulse indicator — signals live SSE connection.
 * Used in the top bar and stats row.
 */

import React from 'react';

interface Props {
  connected: boolean;
}

export const LivePulseDot: React.FC<Props> = ({ connected }) => (
  <span className="relative flex items-center gap-2">
    <span className="relative flex h-2.5 w-2.5">
      {connected && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{
            backgroundColor: '#10B981',
            animation: 'pulse-emerald 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
      )}
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ backgroundColor: connected ? '#10B981' : '#6B7280' }}
      />
    </span>
    <span
      className="font-mono text-xs uppercase tracking-widest"
      style={{ color: connected ? '#10B981' : '#6B7280' }}
    >
      {connected ? 'Live' : 'Offline'}
    </span>
  </span>
);
