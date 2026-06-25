import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { DishCard } from './DishCard';
import { DishSkeleton } from '../../components/DishSkeleton';
import type { Dish } from '../../types/dish';

interface Props {
  dishes: Dish[];
  loading: boolean;
  error: string | null;
  onToggle: (dish: Dish) => void;
  onDelete?: (dishId: string) => void;
  externallyUpdatedId: string | null;
  viewMode?: 'grid' | 'list';
}

export const DishGrid: React.FC<Props> = ({
  dishes,
  loading,
  error,
  onToggle,
  onDelete,
  externallyUpdatedId,
  viewMode = 'grid',
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // GSAP: Staggered entrance after loading resolves
  useEffect(() => {
    if (!loading && dishes.length > 0 && !hasAnimated.current && gridRef.current) {
      hasAnimated.current = true;

      const cards = gridRef.current.querySelectorAll('[data-dish-card]');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: {
            amount: Math.min(cards.length * 0.06, 0.8),
            from: 'start',
          },
        }
      );
    }
  }, [loading, dishes.length]);

  if (loading) {
    return (
      <div
        className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}
        aria-label="Loading dishes..."
        role="status"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <DishSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
        <div className="text-[40px] mb-4">⚠️</div>
        <h2 className="text-error font-headline-page font-semibold mb-2">Connection Error</h2>
        <p className="text-on-surface-variant font-body-md mb-4">{error}</p>
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center" role="status">
        <div className="text-[48px] mb-4 opacity-50">🍽️</div>
        <h2 className="font-headline-page text-[20px] font-semibold text-on-surface mb-2">
          No dishes found
        </h2>
        <p className="text-on-surface-variant font-body-md">
          Adjust your filters or search query to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={gridRef}
      layout
      className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}
      role="list"
      aria-label={`Dish grid — ${dishes.length} dishes`}
    >
      <AnimatePresence mode="popLayout">
        {dishes.map((dish) => (
          <div key={dish.dishId} data-dish-card role="listitem">
            <DishCard
              dish={dish}
              onToggle={onToggle}
              onDelete={onDelete}
              isExternallyUpdated={externallyUpdatedId === dish.dishId}
              viewMode={viewMode}
            />
          </div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
