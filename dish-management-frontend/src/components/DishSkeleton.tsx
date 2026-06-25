import React from 'react';

export const DishSkeleton: React.FC = () => (
  <div
    className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col"
    aria-label="Loading dish..."
    role="status"
  >
    {/* Image area */}
    <div className="relative h-48 bg-surface-variant overflow-hidden skeleton-shimmer">
      {/* Top Left Badge placeholder */}
      <div className="absolute top-3 left-3 w-20 h-6 bg-surface-container-high rounded-full opacity-50" />
      {/* Top Right Toggle placeholder */}
      <div className="absolute top-3 right-3 w-20 h-6 bg-surface-container-high rounded-full opacity-50" />
    </div>

    {/* Content area */}
    <div className="p-[20px] flex flex-col gap-2 flex-1 justify-between">
      <div>
        {/* Name */}
        <div className="skeleton-shimmer rounded h-5 w-3/4 mb-2" />
        {/* Description */}
        <div className="skeleton-shimmer rounded h-3 w-full mb-1" />
        <div className="skeleton-shimmer rounded h-3 w-2/3" />
      </div>

      {/* Footer: ID and Price */}
      <div className="flex justify-between items-end mt-4 pt-4 border-t border-surface-container-high">
        <div className="skeleton-shimmer rounded h-4 w-12" />
        <div className="skeleton-shimmer rounded h-4 w-16" />
      </div>
    </div>
  </div>
);
