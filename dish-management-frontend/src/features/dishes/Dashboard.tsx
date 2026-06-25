import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { TopActivityTicker } from '../../components/TopActivityTicker';
import { DishGrid } from './DishGrid';
import { AddDishModal } from './AddDishModal';
import { SettingsModal } from '../settings/SettingsModal';
import { SupportHealthModal } from '../support/SupportHealthModal';
import { useDishes } from '../../hooks/useDishes';
import { useSSE } from '../../hooks/useSSE';
import { useDishFilter } from '../../hooks/useDishFilter';
import type { FilterStatus } from '../../hooks/useDishFilter';
import type { RailEvent, Dish } from '../../types/dish';
import gsap from 'gsap';

import { deleteDish } from '../../services/api';
import { toast } from 'sonner';

const MAX_RAIL_EVENTS = 20;

export const Dashboard: React.FC = () => {
  const [railEvents, setRailEvents] = useState<RailEvent[]>([]);
  const headerRef = useRef<HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [dishToDelete, setDishToDelete] = useState<string | null>(null);

  const addRailEvent = useCallback((event: RailEvent) => {
    setRailEvents((prev) => [event, ...prev].slice(0, MAX_RAIL_EVENTS));
  }, []);

  const { dishes, loading, error, togglePublish, sseUpsert, sseDelete } =
    useDishes(addRailEvent);

  const { connected, externallyUpdatedId } = useSSE({
    onUpsert: sseUpsert,
    onDelete: sseDelete,
    onRailEvent: addRailEvent,
  });

  const { filteredDishes, filterActive, setFilterActive, searchQuery, setSearchQuery, counts } = useDishFilter(dishes);

  const handleToggle = useCallback((dish: Dish) => {
    togglePublish(dish);
  }, [togglePublish]);

  const handleDelete = useCallback((dishId: string) => {
    setDishToDelete(dishId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!dishToDelete) return;
    try {
      await deleteDish(dishToDelete);
      sseDelete(dishToDelete);
      toast.success('Dish deleted successfully', {
        style: { background: '#e6f4ea', border: '1px solid #10B981', color: '#137333' }
      });
    } catch (err: any) {
      toast.error('Failed to delete dish', { description: err.message });
    } finally {
      setDishToDelete(null);
    }
  }, [dishToDelete, sseDelete]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault();
            document.querySelector<HTMLInputElement>('input[placeholder="Search dishes..."]')?.focus();
            break;
          case 'n':
            e.preventDefault();
            setIsModalOpen(true);
            break;
          case 'v':
            e.preventDefault();
            setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
            break;
          case ',':
            e.preventDefault();
            setIsSettingsOpen(true);
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFilterClick = (status: FilterStatus) => {
    setFilterActive(status);
  };

  const handleLockedFeature = (feature: string) => {
    setComingSoonFeature(feature);
    setTimeout(() => {
      setComingSoonFeature(null);
    }, 3000);
  };

  return (
    <div className="bg-surface text-on-surface h-screen flex overflow-hidden font-body-md text-body-md antialiased">
      {/* SideNavBar */}
      <aside className="bg-surface-container-low flex-shrink-0 h-screen w-64 docked left-0 border-r border-outline-variant flex flex-col p-4 z-40 relative hidden md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-variant flex-shrink-0 border border-outline-variant">
            <img alt="Restaurant Logo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDU3rKYIsyxOf5HW1ylZvfGzksZIBXBMp_E_BIhMe5BCz1-4q53EIOs-bk4iLlyTy6qxg-3umsHL3MDRTWe3LBKQ8eYPvmoGXqfZR6syUb65ed-a1_yLqPxKQy24aHKIM-PhWNGJYBxl4rD-Hm3VOQqxAt-p6kQ2CuY8_ponPtZJZlyz2nVhjjPwjW5KU-MFqId-eH31eZglCkz8A7k-3LNPd3cePlEln8FrAglZIS0DCnsf0gkl6kvv9_P1EOVrqc9354cpEvv3_u3"/>
          </div>
          <div>
            <h1 className="font-headline-page text-headline-page text-primary text-[18px] leading-tight">Euphotic Lab's Kitchen</h1>
            <p className="font-metadata text-metadata text-on-surface-variant">Kitchen Management</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-3 py-2.5 bg-secondary-container text-on-secondary-container font-bold rounded-lg scale-95 active:scale-90 transition-transform">
            <span className="material-symbols-outlined fill-icon">menu_book</span>
            <span>Menu</span>
          </button>
          <button onClick={() => handleLockedFeature('Inventory')} className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-variant transition-all rounded-lg scale-95 active:scale-90 hover:text-primary">
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Inventory</span>
          </button>
          <button onClick={() => handleLockedFeature('Orders')} className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-variant transition-all rounded-lg scale-95 active:scale-90 hover:text-primary">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Orders</span>
          </button>
          <button onClick={() => handleLockedFeature('Analytics')} className="flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-variant transition-all rounded-lg scale-95 active:scale-90 hover:text-primary">
            <span className="material-symbols-outlined">bar_chart</span>
            <span>Analytics</span>
          </button>
        </nav>

        <div className="mb-6 px-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-button-label text-button-label py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Dish
          </button>
        </div>

        <div className="border-t border-outline-variant pt-4 flex flex-col gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant transition-all rounded-lg scale-95 active:scale-90 hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </button>
          <button onClick={() => setIsSupportOpen(true)} className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant transition-all rounded-lg scale-95 active:scale-90 hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span>Support</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-surface">
        {/* Top Activity Ticker */}
        <TopActivityTicker events={railEvents} />
        
        {/* Header */}
        <header ref={headerRef} className="h-header_height flex items-center justify-between px-gutter border-b border-outline-variant bg-surface/80 backdrop-blur-md z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-on-surface-variant p-2 -ml-2 rounded-full hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="font-headline-page text-headline-page text-on-surface">Menu Catalogue</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input 
                className="pl-9 pr-10 py-2 bg-surface-container-low border border-outline-variant rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-64" 
                placeholder="Search dishes..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-secondary' : 'bg-error'} shadow-sm`} title={connected ? 'Connected' : 'Reconnecting...'} />
          </div>
        </header>

        {/* Scrollable Canvas */}
        <div className="flex-1 overflow-y-auto px-gutter py-margin_desktop pb-[calc(110px+32px)]" id="main-content">
          
          {/* Filters & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
              <button 
                onClick={() => handleFilterClick('all')}
                className={`px-4 py-2 rounded-full font-button-label text-button-label whitespace-nowrap flex items-center gap-2 transition-colors ${filterActive === 'all' ? 'bg-secondary-container text-on-secondary-container border border-secondary-container shadow-sm' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
              >
                {filterActive === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>}
                All Items ({counts.total})
              </button>
              <button 
                onClick={() => handleFilterClick('published')}
                className={`px-4 py-2 rounded-full font-button-label text-button-label whitespace-nowrap flex items-center gap-2 transition-colors ${filterActive === 'published' ? 'bg-secondary-container text-on-secondary-container border border-secondary-container shadow-sm' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
              >
                {filterActive === 'published' && <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>}
                On Menu ({counts.published})
              </button>
              <button 
                onClick={() => handleFilterClick('draft')}
                className={`px-4 py-2 rounded-full font-button-label text-button-label whitespace-nowrap flex items-center gap-2 transition-colors ${filterActive === 'draft' ? 'bg-secondary-container text-on-secondary-container border border-secondary-container shadow-sm' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
              >
                {filterActive === 'draft' && <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>}
                Drafts ({counts.draft})
              </button>
              <button 
                onClick={() => handleFilterClick('archived')}
                className={`px-4 py-2 rounded-full font-button-label text-button-label whitespace-nowrap flex items-center gap-2 transition-colors ${filterActive === 'archived' ? 'bg-secondary-container text-on-secondary-container border border-secondary-container shadow-sm' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
              >
                {filterActive === 'archived' && <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>}
                Archived ({counts.archived})
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 text-on-surface-variant">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors border ${viewMode === 'list' ? 'bg-surface-variant border-outline-variant text-primary' : 'border-transparent hover:border-outline-variant hover:bg-surface-variant'}`}
                title="List View"
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors border ${viewMode === 'grid' ? 'bg-surface-variant border-outline-variant text-primary' : 'border-transparent hover:border-outline-variant hover:bg-surface-variant'}`}
                title="Grid View"
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
            </div>
          </div>

          {/* Dish grid */}
          <section aria-label="Dish card grid">
            <DishGrid
              dishes={filteredDishes}
              loading={loading}
              error={error}
              onToggle={handleToggle}
              onDelete={handleDelete}
              externallyUpdatedId={externallyUpdatedId}
              viewMode={viewMode}
            />
          </section>
        </div>
      </main>

      <AddDishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(dish) => sseUpsert(dish)}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <SupportHealthModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {dishToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setDishToDelete(null)}>
          <div className="bg-surface border border-outline-variant rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="font-semibold text-lg text-on-surface mb-2">Are you sure want to delete this?</h3>
              <p className="text-sm text-on-surface-variant">This action cannot be undone.</p>
            </div>
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex justify-end gap-3">
              <button onClick={() => setDishToDelete(null)} className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-error hover:bg-error/90 text-white shadow-sm transition-colors text-sm font-medium">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />

      {/* Framer Motion Coming Soon Caption */}
      <AnimatePresence>
        {comingSoonFeature && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-on-primary px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-xl animate-pulse">auto_awesome</span>
            <span className="font-medium tracking-wide">The <span className="font-bold">{comingSoonFeature}</span> feature is brewing and will be available soon!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
