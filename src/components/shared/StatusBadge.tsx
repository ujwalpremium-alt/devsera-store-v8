import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, Send, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    SUBMITTED: {
      label: 'Submitted',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Send,
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
}
