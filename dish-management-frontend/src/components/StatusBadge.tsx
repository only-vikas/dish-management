/**
 * src/components/StatusBadge.tsx
 *
 * JetBrains Mono uppercase badge — distinguishes LIVE (amber) from DRAFT (zinc).
 * Design decision (from Stitch): monospace font creates a "kitchen ticket" aesthetic
 * that signals "technical operational state" vs. decorative labeling.
 */

import React from 'react';

interface Props {
  isPublished: boolean;
}

export const StatusBadge: React.FC<Props> = ({ isPublished }) => {
  if (isPublished) {
    return (
      <span
        className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5"
        style={{
          background: 'rgba(245,158,11,0.15)',
          color: '#F59E0B',
          border: '1px solid rgba(245,158,11,0.3)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
        LIVE
      </span>
    );
  }

  return (
    <span
      className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5"
      style={{
        background: 'rgba(107,114,128,0.15)',
        color: '#6B7280',
        border: '1px solid rgba(107,114,128,0.3)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6B7280' }} />
      DRAFT
    </span>
  );
};
