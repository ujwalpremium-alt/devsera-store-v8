import { Shield, Clock, HeadphonesIcon, RefreshCw, CreditCard, Lock } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    { icon: <Shield className="h-4 w-4 sm:h-5 sm:w-5" />, label: '100% Secure', color: 'text-emerald-600' },
    { icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Fast Delivery', color: 'text-amber-600' },
    { icon: <HeadphonesIcon className="h-4 w-4 sm:h-5 sm:w-5" />, label: '24/7 Support', color: 'text-blue-600' },
    { icon: <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Replacement', color: 'text-purple-600' },
    { icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Secure Pay', color: 'text-teal-600' },
    { icon: <Lock className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Privacy', color: 'text-pink-600' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-y border-gray-100 dark:border-gray-700 py-3 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-10">
          {badges.map((badge, index) => (
            <div 
              key={index} 
              className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300"
            >
              <span className={badge.color}>{badge.icon}</span>
              <span className="text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
