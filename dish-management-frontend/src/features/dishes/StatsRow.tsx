/**
 * src/features/dishes/StatsRow.tsx
 *
 * Summary statistics bar — total, published (amber), drafts (zinc).
 * Uses GSAP for the count-up animation on load (number ticking up is a satisfying
 * performance-indicator micro-interaction for kitchen ops dashboards).
 */

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Dish } from '../../types/dish';

interface Props {
  dishes: Dish[];
  loading: boolean;
}

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, accent, loading }) => {
  const numRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  // GSAP count-up animation when value changes
  useEffect(() => {
    if (loading || !numRef.current) return;
    const obj = { val: prevValue.current };
    gsap.to(obj, {
      val: value,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = Math.round(obj.val).toString();
      },
      onComplete: () => { prevValue.current = value; },
    });
  }, [value, loading]);

  return (
    <div
      style={{
        background: '#1e1f26',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px 24px',
        flex: 1,
        minWidth: '140px',
      }}
    >
      <p
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: '#6B7280', margin: '0 0 8px' }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter',
          fontSize: '36px',
          fontWeight: 700,
          lineHeight: 1,
          color: loading ? '#374151' : accent,
          transition: 'color 0.3s',
        }}
      >
        {loading ? '—' : <span ref={numRef}>{value}</span>}
      </p>
    </div>
  );
};

export const StatsRow: React.FC<Props> = ({ dishes, loading }) => {
  const total = dishes.length;
  const published = dishes.filter((d) => d.isPublished).length;
  const drafts = total - published;

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <StatCard label="Total Dishes" value={total}     accent="#e2e2eb" loading={loading} />
      <StatCard label="On Menu"      value={published} accent="#F59E0B" loading={loading} />
      <StatCard label="Drafts"       value={drafts}    accent="#6B7280" loading={loading} />
    </div>
  );
};
