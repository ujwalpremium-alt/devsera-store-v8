import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Flame } from 'lucide-react';
import { useFlashSale } from '@/hooks/useFlashSale';

interface FlashSalesProps {
  products: Product[];
}

export function FlashSales({ products }: FlashSalesProps) {
  const navigate = useNavigate();
  const { config, isActive } = useFlashSale();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  // Check if flash sale has expired
  useEffect(() => {
    if (!config?.end_time) {
      setIsExpired(true);
      return;
    }
    
    const checkExpiration = () => {
      const endTime = new Date(config.end_time!).getTime();
      const now = Date.now();
      setIsExpired(now >= endTime);
    };
    
    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [config?.end_time]);

  // Get flash sale products with their discounts - use useMemo for reactivity
  const flashProducts = useMemo(() => {
    if (!config?.enabled || isExpired || !config?.flash_sale_products?.length) {
      return [];
    }
    
    if (!products || products.length === 0) {
      return [];
    }
    
    return config.flash_sale_products
      .map(fp => {
        const product = products.find(p => p.id === fp.productId);
        if (!product) return null;
        return {
          ...product,
          flashDiscountAmount: fp.discountAmount,
          flashSalePrice: Math.max(0, product.salePrice - fp.discountAmount)
        };
      })
      .filter(Boolean) as (Product & { flashDiscountAmount: number; flashSalePrice: number })[];
  }, [config, isExpired, products]);

  useEffect(() => {
    if (!config?.end_time) return;
    
    const calculateTimeLeft = () => {
      const endTime = new Date(config.end_time!).getTime();
      const now = Date.now();
      const diff = endTime - now;
      
      if (diff <= 0) {
        setIsExpired(true);
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Check if just expired
      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config?.end_time]);

  // Don't show if no products, disabled, or expired
  // Debug: console.log('FlashSales Debug:', { config, isExpired, flashProductsCount: flashProducts.length, productsCount: products.length });
  if (!config || !config.enabled || isExpired || flashProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] animate-pulse" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center animate-pulse">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-1 sm:gap-2">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300 animate-bounce" />
                  Flash Sale
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">Limited time offers!</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <div className="flex gap-0.5 sm:gap-1">
                <div className="bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-[40px] sm:min-w-[50px] text-center">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-white font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <p className="text-[10px] sm:text-xs text-white/70">HRS</p>
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white self-start mt-1 sm:mt-2">:</span>
                <div className="bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-[40px] sm:min-w-[50px] text-center">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-white font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <p className="text-[10px] sm:text-xs text-white/70">MIN</p>
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white self-start mt-1 sm:mt-2">:</span>
                <div className="bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-2 min-w-[40px] sm:min-w-[50px] text-center">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-white font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <p className="text-[10px] sm:text-xs text-white/70">SEC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flash Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {flashProducts.map((product) => {
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-transform duration-300 shadow-xl"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&q=80'}
                      alt={product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg sm:rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Badge className="bg-red-500 text-white mb-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                        SAVE ₹{product.flashDiscountAmount}
                      </Badge>
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">{product.name}</h3>
                      <div className="flex items-baseline gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                        <span className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">₹{product.flashSalePrice}</span>
                        <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.salePrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
