import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createDish } from '../../services/api';
import type { Dish } from '../../types/dish';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dish: Dish) => void;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [dishName, setDishName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    setIsSubmitting(true);
    try {
      const newDish = await createDish({ 
        dishName, 
        imageUrl, 
        description,
        isPublished 
      });
      
      toast.success(`Dish created: ${dishName}`, {
        description: 'The new dish was successfully added to your catalog.',
        style: { background: '#e6f4ea', border: '1px solid #10B981', color: '#137333' }
      });
      
      onSuccess(newDish);
      
      setDishName('');
      setImageUrl('');
      setDescription('');
      setIsPublished(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create dish');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low">
                <h3 className="font-headline-page text-[18px] font-semibold text-on-surface">Add New Dish</h3>
                <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dishName" className="font-button-label text-button-label text-on-surface">Dish Name <span className="text-error">*</span></label>
                  <input
                    id="dishName"
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Truffle Mushroom Risotto"
                    className="px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="description" className="font-button-label text-button-label text-on-surface">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A short, appetizing description..."
                    rows={2}
                    className="px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="imageUrl" className="font-button-label text-button-label text-on-surface">Image URL</label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="px-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <span className="font-metadata text-[11px] text-on-surface-variant">Leave blank to use a default placeholder image.</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-button-label text-button-label text-on-surface">Publish Immediately</span>
                    <span className="font-metadata text-[11px] text-on-surface-variant">Make this dish visible to customers right away</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublished(!isPublished)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isPublished ? 'bg-primary' : 'bg-surface-variant'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${isPublished ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg font-button-label text-button-label text-on-surface-variant hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!dishName.trim() || isSubmitting}
                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-button-label text-button-label transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                  >
                    {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : null}
                    {isSubmitting ? 'Creating...' : 'Create Dish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
