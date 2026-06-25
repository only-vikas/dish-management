import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  viewMode, 
  setViewMode 
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSimulateChange = async () => {
    setIsSimulating(true);
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${BASE}/admin/simulate-change`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger simulation');
      toast.success('Demo Mode Triggered', {
        description: 'External database changes are being simulated. Watch the dashboard!',
      });
    } catch (err: any) {
      toast.error('Simulation Failed', { description: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${BASE}/admin/reset-workspace`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset workspace');
      toast.success('Workspace Reset', {
        description: 'The database has been seeded to its default state. Please reload the page.',
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error('Reset Failed', { description: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="font-headline-page text-[22px] font-semibold text-on-surface">Workspace Settings</h3>
                <p className="text-sm text-on-surface-variant mt-1">Configure your environment and presentation tools</p>
              </div>
              <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-variant">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-8">
              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col pr-8">
                  <span className="font-semibold text-on-surface text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">magic_button</span>
                    Demo Mode
                  </span>
                  <span className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Automatically simulate external database changes. This proves the real-time SSE works without needing a terminal.
                  </span>
                </div>
                <button
                  onClick={handleSimulateChange}
                  disabled={isSimulating}
                  className={`px-4 py-2 rounded-lg font-button-label text-button-label transition-colors shadow-sm whitespace-nowrap flex items-center gap-2 ${
                    isSimulating ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-on-primary'
                  }`}
                >
                  {isSimulating ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : null}
                  {isSimulating ? 'Simulating...' : 'Simulate Changes'}
                </button>
              </div>

              {/* Environment Preferences */}
              <div className="flex flex-col gap-3">
                <span className="font-semibold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">space_dashboard</span>
                  Environment Layout
                </span>
                <span className="text-sm text-on-surface-variant leading-relaxed">
                  Switch between the Kitchen Layout (Grid) and Manager Layout (List).
                </span>
                
                <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-outline-variant w-fit mt-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 flex items-center gap-2 ${
                      viewMode === 'grid' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">grid_view</span>
                    Kitchen Layout
                    {viewMode === 'grid' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-outline-variant -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 flex items-center gap-2 ${
                      viewMode === 'list' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">view_list</span>
                    Manager Layout
                    {viewMode === 'list' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-outline-variant -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-error/20 flex items-center justify-between">
                <div className="flex flex-col pr-8">
                  <span className="font-semibold text-error text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    Danger Zone
                  </span>
                  <span className="text-sm text-error/80 mt-1 leading-relaxed">
                    Reset the workspace to the original default seed. This will erase all your created dishes and customizations.
                  </span>
                </div>
                <button
                  onClick={handleResetWorkspace}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error font-button-label text-button-label transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {isResetting ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : null}
                  Reset Workspace
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-outline-variant/50 flex justify-end gap-3 bg-surface-container-lowest">
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-button-label text-button-label text-on-surface-variant hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-button-label text-button-label shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
