import { OrderStatus } from '@/types';
import { 
  Clock, 
  CreditCard, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

interface OrderStatusStepperProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  compact?: boolean;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  time?: string;
}

export function OrderStatusStepper({ 
  status, 
  createdAt, 
  updatedAt,
  compact = false 
}: OrderStatusStepperProps) {
  const getSteps = (): Step[] => {
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    const estimatedDelivery = new Date(created.getTime() + 2 * 60 * 60 * 1000);

    if (status === 'CANCELLED') {
      return [
        {
          id: 1,
          title: 'Order Placed',
          description: 'Order was created',
          icon: <CheckCircle2 className="h-5 w-5" />,
          status: 'completed',
          time: created.toLocaleString()
        },
        {
          id: 2,
          title: 'Order Cancelled',
          description: 'This order was cancelled',
          icon: <XCircle className="h-5 w-5" />,
          status: 'cancelled',
          time: updated.toLocaleString()
        }
      ];
    }

    const steps: Step[] = [
      {
        id: 1,
        title: 'Order Placed',
        description: 'Your order has been received',
        icon: <Clock className="h-5 w-5" />,
        status: 'completed',
        time: created.toLocaleString()
      },
      {
        id: 2,
        title: 'Payment Submitted',
        description: 'Payment proof uploaded',
        icon: <CreditCard className="h-5 w-5" />,
        status: status === 'PENDING' ? 'pending' : 'completed',
        time: status !== 'PENDING' ? updated.toLocaleString() : 'Awaiting'
      },
      {
        id: 3,
        title: 'Verification',
        description: 'Payment being verified',
        icon: <AlertCircle className="h-5 w-5" />,
        status: status === 'PENDING' ? 'pending' : status === 'SUBMITTED' ? 'current' : 'completed',
        time: status === 'SUBMITTED' ? 'In Progress' : status === 'COMPLETED' ? 'Verified' : 'Pending'
      },
      {
        id: 4,
        title: 'Delivered',
        description: 'Credentials sent',
        icon: <Truck className="h-5 w-5" />,
        status: status === 'COMPLETED' ? 'completed' : 'pending',
        time: status === 'COMPLETED' 
          ? updated.toLocaleString() 
          : `Est. ${estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
    ];

    return steps;
  };

  const steps = getSteps();

  const getStepStyles = (stepStatus: Step['status']) => {
    switch (stepStatus) {
      case 'completed':
        return {
          circle: 'bg-emerald-500 text-white',
          line: 'bg-emerald-500',
          title: 'text-emerald-600 dark:text-emerald-400',
          description: 'text-gray-600 dark:text-gray-400',
          time: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'current':
        return {
          circle: 'bg-blue-500 text-white animate-pulse',
          line: 'bg-gray-200 dark:bg-gray-700',
          title: 'text-blue-600 dark:text-blue-400',
          description: 'text-gray-600 dark:text-gray-400',
          time: 'text-blue-600 dark:text-blue-400'
        };
      case 'cancelled':
        return {
          circle: 'bg-red-500 text-white',
          line: 'bg-red-500',
          title: 'text-red-600 dark:text-red-400',
          description: 'text-red-500 dark:text-red-400',
          time: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          circle: 'bg-gray-200 dark:bg-gray-700 text-gray-400',
          line: 'bg-gray-200 dark:bg-gray-700',
          title: 'text-gray-400 dark:text-gray-500',
          description: 'text-gray-400 dark:text-gray-500',
          time: 'text-gray-400 dark:text-gray-500'
        };
    }
  };

  if (compact) {
    // Horizontal compact stepper for mobile
    return (
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const styles = getStepStyles(step.status);
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.circle}`}>
                  {step.icon}
                </div>
                <span className={`text-xs mt-1 text-center ${styles.title} hidden sm:block`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${
                  step.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical detailed stepper
  return (
    <div className="relative">
      {steps.map((step, index) => {
        const styles = getStepStyles(step.status);
        return (
          <div key={step.id} className="flex items-start gap-4 mb-6 last:mb-0">
            {/* Step indicator */}
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${styles.circle}`}>
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute top-10 w-0.5 h-16 ${styles.line}`} />
              )}
            </div>
            
            {/* Step content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={`font-semibold ${styles.title}`}>
                  {step.title}
                </h4>
                <span className={`text-xs font-mono ${styles.time}`}>
                  {step.time}
                </span>
              </div>
              <p className={`text-sm ${styles.description}`}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
