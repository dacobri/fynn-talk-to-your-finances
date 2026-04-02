'use client';

import { CATEGORY_COLORS } from '../utils/mock-data';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colors = CATEGORY_COLORS[category] || {
    bg: '#F5F5F5',
    text: '#333333',
    chart: '#999999',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {category}
    </span>
  );
}
