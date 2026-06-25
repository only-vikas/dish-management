import React from 'react';
import { motion } from 'framer-motion';
import type { Dish } from '../../types/dish';

interface DishCardProps {
  dish: Dish;
  onToggle: (dish: Dish) => void;
  isExternallyUpdated: boolean;
  viewMode?: 'grid' | 'list';
  onDelete?: (dishId: string) => void;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onToggle, isExternallyUpdated, viewMode = 'grid', onDelete }) => {
  const { dishName, description, price, imageUrl, isPublished, dishId } = dish;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(dish);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(dishId);
  };

  const externalPulseClass = isExternallyUpdated ? 'pulse-external-change' : '';
  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop';
  
  const localImageMap: Record<string, string> = {
    'Butter Chicken': '/butter_chicken.jpg',
    'Caesar Salad': '/caesar_salad.jpg',
    'Chicken Tikka Masala': '/chicken_tikka_masala.jpg',
    'Chocolate Lava Cake': '/chocolate_lava_cake.jpg',
    'French Onion Soup': '/french_onion_soup.jpg',
    'Pad Thai': '/pad_thai.jpg',
    'Sushi Platter': '/sushi_platter.jpg',
    'Spaghetti Carbonara': '/spaghetti_carbonara.jpg',
    'Bisi Bele Bath': '/bisi_bele_bath.jpg',
  };
  
  const finalImageUrl = localImageMap[dishName] || imageUrl || fallbackImage;

  // New dishes have IDs starting with 'dish-'. Default dishes are 'dish1', 'dish2', etc.
  const isNewDish = dishId.startsWith('dish-');

  // Format price if available, else standard format
  const formattedPrice = price ? `$${price.toFixed(2)}` : '$0.00';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      data-dish-card
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_12px_24px_-12px_rgba(0,0,0,0.15)] transition-shadow duration-300 cursor-pointer relative ${externalPulseClass} ${
        viewMode === 'list' ? 'flex flex-row h-40' : 'flex flex-col'
      }`}
      whileHover={{ y: -4 }}
    >
      <motion.div layout="position" className={`relative bg-surface-variant overflow-hidden ${viewMode === 'list' ? 'w-48 h-full flex-shrink-0' : 'h-48 w-full'}`}>
        <img 
          src={finalImageUrl} 
          alt={dishName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        
      </motion.div>

      <motion.div layout="position" className="p-[20px] flex flex-col gap-4 flex-1 justify-between">
        <div>
          <h3 className="font-dish-name text-dish-name text-on-surface mb-1">{dishName}</h3>
          <p className="font-metadata text-metadata text-on-surface-variant line-clamp-2 mb-2">
            {description || 'No description available for this item.'}
          </p>
          <div className="flex justify-between items-center mt-1">
            <span className="font-metadata text-metadata text-on-surface-variant">ID: {dishId}</span>
            <div className="flex items-center gap-3">
              {isNewDish && (
                <button 
                  onClick={handleDelete}
                  className="text-error hover:bg-error/10 p-1 rounded transition-colors"
                  title="Delete Dish"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              )}
              <span className="font-dish-name text-dish-name text-primary">{formattedPrice}</span>
            </div>
          </div>
        </div>
        
        {/* Card Footer with Badge and Button */}
        <div className="flex justify-between items-center pt-4 border-t border-surface-container-high">
          {/* Static Badge */}
          <div className={`px-2.5 py-1 rounded-full font-badge-label text-badge-label flex items-center gap-1 border ${
            isPublished ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-surface-variant border-outline-variant text-on-surface-variant'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-secondary' : 'bg-outline-variant'}`}></span>
            {isPublished ? 'Published' : 'Draft'}
          </div>
          
          {/* Interactive Toggle Button */}
          <motion.button
            onClick={handleToggle}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-1.5 rounded-full font-badge-label text-badge-label font-bold border transition-all cursor-pointer ${
              isPublished
                ? 'bg-surface border-[#2D5A3D] text-[#2D5A3D] hover:bg-[#2D5A3D] hover:text-white'
                : 'bg-surface border-[#C97F5C] text-[#C97F5C] hover:bg-[#C97F5C] hover:text-white'
            }`}
          >
            {isPublished ? 'Unpublish' : 'Publish'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
