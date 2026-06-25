import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RailEvent } from '../types/dish';

interface TopActivityTickerProps {
  events: RailEvent[];
}

export const TopActivityTicker: React.FC<TopActivityTickerProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Update timestamps every minute
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const getRelativeTime = (date: Date) => {
    const diffMins = Math.floor((currentTime - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1h ago';
    return `${diffHours}h ago`;
  };

  return (
    <div className="w-full h-10 bg-surface-container-highest border-b border-outline-variant/30 flex items-center px-4 overflow-hidden z-50 shadow-sm flex-shrink-0">
      <div className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase mr-4 flex-shrink-0 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">history</span>
        Recent Activity
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-x-auto flex items-center gap-4 no-scrollbar h-full"
      >
        <AnimatePresence initial={false}>
          {events.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-on-surface-variant text-xs italic opacity-70"
            >
              Waiting for activity...
            </motion.div>
          )}

          {events.map((event, index) => {
            const isPublished = event.action === 'Published';
            // Custom amber tint or green tint based on action
            const colorClass = isPublished ? 'text-[#2D5A3D]' : 'text-[#C97F5C]';
            const actionText = isPublished ? 'Published' : 'Unpublished';

            return (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 min-w-max text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-[#2D5A3D]' : 'bg-[#C97F5C]'}`}></span>
                  <span className="font-semibold text-on-surface">{event.dishName}</span>
                  <span className="text-on-surface-variant mx-1">&rarr;</span>
                  <span className={`font-medium ${colorClass}`}>{actionText}</span>
                  <span className="text-on-surface-variant text-[10px] ml-1">
                    {getRelativeTime(event.timestamp)}
                    {event.source === 'external' ? ' (external)' : ''}
                  </span>
                </div>
                
                {/* Separator if not the last item */}
                {index < events.length - 1 && (
                  <span className="text-outline-variant ml-1">|</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
