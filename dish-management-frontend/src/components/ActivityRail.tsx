import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RailEvent } from '../types/dish';

interface ActivityRailProps {
  events: RailEvent[];
}

export const ActivityRail: React.FC<ActivityRailProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

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
    <div className="absolute bottom-0 w-full h-[110px] bg-surface/95 backdrop-blur-md border-t-[2px] border-primary z-30 flex flex-col shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="px-gutter py-2 flex items-center justify-between border-b border-outline-variant/30">
        <span className="font-button-label text-button-label text-on-surface-variant uppercase tracking-wider text-[10px]">Recent Activity</span>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-x-auto flex items-center px-gutter gap-6 no-scrollbar pb-2">
        <AnimatePresence initial={false}>
          {events.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-on-surface-variant text-xs italic"
            >
              Waiting for activity...
            </motion.div>
          )}

          {events.map((event) => {
            const isPublished = event.action === 'Published';
            const icon = isPublished ? 'check_circle' : 'remove_circle';
            const colorClasses = isPublished 
              ? 'bg-secondary-container text-on-secondary-container' 
              : 'bg-[#fff8f1] text-primary border border-primary/20'; // Custom amber tint
              
            const sourceText = event.source === 'external' ? 'System (external)' : 'User';

            return (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 min-w-max pr-6 border-r border-outline-variant/50 relative"
              >
                {event.source === 'external' && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_8px_rgba(124,87,45,0.6)] animate-pulse"></div>
                )}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorClasses}`}>
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-metadata text-metadata text-on-surface">
                    {event.action}: <span className="font-bold">{event.dishName}</span>
                  </span>
                  <span className="font-metadata text-[10px] text-on-surface-variant">
                    {getRelativeTime(event.timestamp)} • {sourceText}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
