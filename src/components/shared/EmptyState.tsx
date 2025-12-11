import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Search, ShoppingBag, Heart, FileText, MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  type?: 'orders' | 'products' | 'wishlist' | 'search' | 'tickets' | 'default';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

const illustrations: Record<string, ReactNode> = {
  orders: (
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center">
        <ShoppingBag className="h-16 w-16 text-teal-500" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
        <Package className="h-6 w-6 text-amber-500" />
      </div>
    </div>
  ),
  products: (
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
        <Package className="h-16 w-16 text-purple-500" />
      </div>
    </div>
  ),
  wishlist: (
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
        <Heart className="h-16 w-16 text-red-400" />
      </div>
    </div>
  ),
  search: (
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
        <Search className="h-16 w-16 text-blue-500" />
      </div>
    </div>
  ),
  tickets: (
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full flex items-center justify-center">
        <MessageSquare className="h-16 w-16 text-orange-500" />
      </div>
    </div>
  ),
  default: (
    <div className="relative">
      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
        <FileText className="h-16 w-16 text-gray-400" />
      </div>
    </div>
  ),
};

const defaultContent: Record<string, { title: string; description: string }> = {
  orders: {
    title: 'No orders yet',
    description: "You haven't placed any orders yet. Browse our products to get started!",
  },
  products: {
    title: 'No products found',
    description: 'Try adjusting your search or filter criteria.',
  },
  wishlist: {
    title: 'Your wishlist is empty',
    description: 'Save products you love by clicking the heart icon.',
  },
  search: {
    title: 'No results found',
    description: 'Try different keywords or remove some filters.',
  },
  tickets: {
    title: 'No support tickets',
    description: "You haven't created any support tickets yet.",
  },
  default: {
    title: 'Nothing here',
    description: 'There is no content to display.',
  },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6 animate-bounce-slow">
        {illustrations[type]}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title || content.title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {description || content.description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
