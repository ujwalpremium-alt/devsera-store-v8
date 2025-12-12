import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Home, Package, Gift, User, MessageSquare, Crown, Users, Heart } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { wishlist } = useWishlist();

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Home', path: '/' },
    { icon: <Users className="h-5 w-5" />, label: 'Community', path: '/community' },
    { icon: <Crown className="h-5 w-5" />, label: 'Premium', path: '/premium', highlight: true },
    { 
      icon: (
        <div className="relative">
          <Heart className="h-5 w-5" />
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {wishlist.length > 9 ? '9+' : wishlist.length}
            </span>
          )}
        </div>
      ), 
      label: 'Wishlist', 
      path: '/wishlist' 
    },
    { 
      icon: user ? <User className="h-5 w-5" /> : <User className="h-5 w-5" />, 
      label: user ? 'Profile' : 'Login', 
      path: user ? '/profile' : '/login' 
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 safe-area-bottom shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
      <div className="flex items-center justify-around py-1.5 sm:py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isPremiumItem = (item as any).highlight;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all min-w-[56px] ${
                isActive
                  ? isPremiumItem 
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
                    : 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30'
                  : isPremiumItem
                    ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 active:bg-amber-50 dark:active:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium ${isPremiumItem ? 'font-semibold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
