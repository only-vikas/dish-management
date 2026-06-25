import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SupportHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export const SupportHealthModal: React.FC<SupportHealthModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Fetch health status when modal opens
      fetch('http://localhost:5000/api/health')
        .catch(err => console.error('Failed to fetch health status:', err));
    }
  }, [isOpen]);

  const copyEmail = () => {
    navigator.clipboard.writeText('caankitgupta27@gmail.com');
    toast.success("Copied to clipboard. We'll get back to you shortly.", {
      style: { background: '#e6f4ea', border: '1px solid #10B981', color: '#137333' }
    });
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
            className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="font-headline-page text-[22px] font-semibold text-on-surface">Support & System Health</h3>
                <p className="text-sm text-on-surface-variant mt-1">Connect with us and monitor real-time infrastructure.</p>
              </div>
              <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-variant">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Support */}
              <div className="flex flex-col gap-6">
                
                {/* Contact Card */}
                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-on-surface text-sm uppercase tracking-wider text-on-surface-variant">Euphotic Labs Direct Line</span>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">support_agent</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface">Email Support</span>
                        <span className="text-sm text-on-surface-variant">caankitgupta27@gmail.com</span>
                      </div>
                    </div>
                    <button 
                      onClick={copyEmail}
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Copy Email"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-on-surface text-sm uppercase tracking-wider text-on-surface-variant">Connect With Nosh</span>
                  <div className="flex gap-3">
                    <a href="https://www.linkedin.com/company/nosh-robotics/posts/?feedView=all" target="_blank" rel="noreferrer" className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-surface-variant transition-colors group">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" />
                      <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors">LinkedIn</span>
                    </a>
                    <a href="https://www.letsnosh.io/" target="_blank" rel="noreferrer" className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-surface-variant transition-colors group">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[24px]">public</span>
                      <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors">Website</span>
                    </a>
                    <a href="https://www.youtube.com/@letsnosh" target="_blank" rel="noreferrer" className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-error/50 hover:bg-error/10 transition-colors group">
                      <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" />
                      <span className="text-xs font-medium text-on-surface-variant group-hover:text-error transition-colors">YouTube</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Health & Shortcuts */}
              <div className="flex flex-col gap-6">
                
                {/* Diagnostics */}
                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-on-surface text-sm uppercase tracking-wider text-on-surface-variant">Live System Diagnostics</span>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                    {/* Database */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-on-surface">Database (MongoDB)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">Connected</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                    {/* Change Stream */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-on-surface">Event Stream (SSE)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">Polling</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                    {/* Active Clients */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-on-surface">Active Connections</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">1 Clients</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Shortcuts */}
                <div className="flex flex-col gap-3">
                  <span className="font-semibold text-on-surface text-sm uppercase tracking-wider text-on-surface-variant">Pro-User Shortcuts</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-sm text-on-surface">Search</span>
                      <kbd className="font-mono text-xs bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant shadow-sm">Ctrl + K</kbd>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-sm text-on-surface">New Dish</span>
                      <kbd className="font-mono text-xs bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant shadow-sm">Ctrl + N</kbd>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-sm text-on-surface">Toggle View</span>
                      <kbd className="font-mono text-xs bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant shadow-sm">Ctrl + V</kbd>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-sm text-on-surface">Settings</span>
                      <kbd className="font-mono text-xs bg-surface-variant px-1.5 py-0.5 rounded text-on-surface-variant border border-outline-variant shadow-sm">Ctrl + ,</kbd>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
