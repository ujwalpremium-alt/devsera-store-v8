import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  expiresAt?: string | null;
  className?: string;
}

export function PremiumBadge({ size = 'md', showText = true, expiresAt, className }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  const getExpiryText = () => {
    if (!expiresAt) return 'Lifetime';
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    
    if (diffDays > 365) {
      const years = Math.round(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} left`;
    }
    if (diffDays > 30) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} left`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600',
        'text-white shadow-lg shadow-amber-500/30',
        'animate-pulse-slow',
        sizeClasses[size],
        className
      )}
    >
      <Crown size={iconSizes[size]} className="fill-white" />
      {showText && (
        <span className="text-white drop-shadow-sm">Premium</span>
      )}
      {showText && expiresAt !== undefined && (
        <span className="opacity-90 text-[0.85em] text-white drop-shadow-sm">• {getExpiryText()}</span>
      )}
    </div>
  );
}

export function PremiumPendingBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        'bg-gradient-to-r from-gray-200 to-gray-300',
        'text-gray-700 text-sm px-3 py-1',
        className
      )}
    >
      <Crown size={14} />
      <span>Premium Pending</span>
    </div>
  );
}
