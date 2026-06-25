import { useMemo, useState } from 'react';
import type { Dish } from '../types/dish';

export type FilterStatus = 'all' | 'published' | 'draft' | 'archived';

export function useDishFilter(dishes: Dish[]) {
  const [filterActive, setFilterActive] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Computations
  const totalCount = dishes.length;
  const publishedCount = dishes.filter(d => d.isPublished).length;
  const draftCount = totalCount - publishedCount;
  // Assume archived is 0 for now as it's not in the data model
  const archivedCount = 0;

  const filteredDishes = useMemo(() => {
    let result = dishes;

    // Apply Status Filter
    if (filterActive === 'published') {
      result = result.filter(d => d.isPublished);
    } else if (filterActive === 'draft') {
      result = result.filter(d => !d.isPublished);
    } else if (filterActive === 'archived') {
      result = [];
    }

    // Apply Search Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.dishName.toLowerCase().includes(q) || d.dishId.toLowerCase().includes(q));
    }

    // Sort: Alphabetical. Wait, previous sorting was published-first.
    // User requested: "On Menu" shows only published dishes, sorted alphabetically
    // "Drafts" shows only unpublished dishes, sorted alphabetically
    // "All Items" shows all dishes in original order
    if (filterActive !== 'all') {
       result = [...result].sort((a, b) => a.dishName.localeCompare(b.dishName));
    }

    return result;
  }, [dishes, filterActive, searchQuery]);

  return {
    filteredDishes,
    filterActive,
    setFilterActive,
    searchQuery,
    setSearchQuery,
    counts: {
      total: totalCount,
      published: publishedCount,
      draft: draftCount,
      archived: archivedCount
    }
  };
}
