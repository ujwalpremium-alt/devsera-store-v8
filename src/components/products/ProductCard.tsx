import { useState, useEffect } from 'react';
import { Product, DeliveryType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Clock, Key, Package, UserCheck, Zap, ArrowRight, Eye, Star, AlertTriangle, Layers, Flame, Heart } from 'lucide-react';
import { getFlashSaleInfoFromStorage } from '@/hooks/useFlashSale';
import { useWishlist } from '@/contexts/WishlistContext';

const deliveryIcons: Record<DeliveryType, React.ReactNode> = {
  CREDENTIALS: <Key className="h-3 w-3" />,
  COUPON_CODE: <Package className="h-3 w-3" />,
  MANUAL_ACTIVATION: <UserCheck className="h-3 w-3" />,
  INSTANT_KEY: <Zap className="h-3 w-3" />
};

const deliveryLabels: Record<DeliveryType, string> = {
  CREDENTIALS: 'Login Access',
  COUPON_CODE: 'License Key',
  MANUAL_ACTIVATION: 'Manual Setup',
  INSTANT_KEY: 'Instant Key'
};

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [flashSaleInfo, setFlashSaleInfo] = useState({ isOnFlashSale: false, discountAmount: 0 });
  
  const inWishlist = isInWishlist(product.id);
  
  // Check flash sale status
  useEffect(() => {
    const checkFlashSale = () => {
      setFlashSaleInfo(getFlashSaleInfoFromStorage(product.id));
    };
    checkFlashSale();
    const interval = setInterval(checkFlashSale, 1000);
    return () => clearInterval(interval);
  }, [product.id]);
  
  // Get price range for products with variants
  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;
  const baseMinPrice = hasVariants 
    ? Math.min(...product.variants!.map(v => v.salePrice))
    : product.salePrice || 0;
  const baseMaxPrice = hasVariants 
    ? Math.max(...product.variants!.map(v => v.salePrice))
    : product.salePrice || 0;
  
  // Apply flash sale discount
  const minPrice = flashSaleInfo.isOnFlashSale 
    ? Math.max(0, baseMinPrice - flashSaleInfo.discountAmount)
    : baseMinPrice;
  const maxPrice = flashSaleInfo.isOnFlashSale 
    ? Math.max(0, baseMaxPrice - flashSaleInfo.discountAmount)
    : baseMaxPrice;
  
  const salePrice = minPrice;
  const originalPrice = hasVariants 
    ? Math.min(...product.variants!.map(v => v.originalPrice))
    : (product.originalPrice || 0);
  
  // For flash sale, show the base price as "original" for comparison
  const displayOriginalPrice = flashSaleInfo.isOnFlashSale ? baseMinPrice : originalPrice;
  const savings = displayOriginalPrice - salePrice;
  const discountPercent = displayOriginalPrice > 0 ? Math.round((savings / displayOriginalPrice) * 100) : 0;
  
  // Get stock level from product data
  const stockLevel = product.stockCount !== undefined ? product.stockCount : 0;
  // Show stock for all delivery types that have stock tracking enabled
  const showStock = product.useManualStock || 
    product.deliveryType === 'INSTANT_KEY' || 
    product.deliveryType === 'COUPON_CODE' || 
    product.deliveryType === 'CREDENTIALS' ||
    product.deliveryType === 'MANUAL_ACTIVATION';
  const isLowStock = showStock && stockLevel > 0 && stockLevel <= 5;
  const isOutOfStock = showStock && stockLevel === 0;
  
  // Simulated rating
  const rating = 4.5 + Math.random() * 0.5;

  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl sm:hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-500 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {flashSaleInfo.isOnFlashSale ? (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg animate-pulse">
            <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            FLASH -₹{flashSaleInfo.discountAmount}
          </span>
        </div>
      ) : discountPercent > 0 && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
          <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
            -{discountPercent}% OFF
          </span>
        </div>
      )}

      {/* Quick View Button */}
      {onQuickView && (
        <div className={`absolute top-2 sm:top-4 right-2 sm:right-4 z-10 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 sm:opacity-0'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 dark:bg-gray-800/95 text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-500 transition-all"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      )}

      {/* Wishlist Button */}
      <div className={`absolute top-2 sm:top-4 right-${onQuickView ? '12 sm:right-16' : '2 sm:right-4'} z-10 transition-all duration-300 ${isHovered || inWishlist ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 sm:opacity-0'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
            inWishlist 
              ? 'bg-pink-500 text-white hover:bg-pink-600' 
              : 'bg-white/95 dark:bg-gray-800/95 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500'
          }`}
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Image Container */}
      <div className="aspect-[4/3] overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Bottom Badges Container */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between gap-2">
          {/* Delivery Type Badge */}
          {product.deliveryType && (
            <Badge className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-700 dark:text-gray-200 border-0 shadow-md text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1">
              {deliveryIcons[product.deliveryType]}
              <span className="hidden xs:inline">{deliveryLabels[product.deliveryType]}</span>
            </Badge>
          )}

          {/* Low Stock Warning */}
          {isLowStock && (
            <Badge className="bg-amber-500/95 text-white border-0 shadow-md text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 flex-shrink-0">
              <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden xs:inline">Only</span> {stockLevel} left
            </Badge>
          )}
        </div>
        
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
            <Badge className="bg-red-500/95 text-white border-0 shadow-md text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1">
              Out of Stock
            </Badge>
          </div>
        )}
        
        {/* In Stock Badge */}
        {showStock && stockLevel > 5 && (
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
            <Badge className="bg-green-500/95 text-white border-0 shadow-md text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1">
              {stockLevel} in stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 md:p-5 space-y-1.5 sm:space-y-3 md:space-y-4">
        {/* Category, Rating & Duration */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-[9px] sm:text-xs px-1 sm:px-2 py-0">
              {product.category}
            </Badge>
            <div className="flex items-center text-amber-500">
              <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current" />
              <span className="text-[9px] sm:text-xs font-semibold ml-0.5">{rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-[9px] sm:text-sm">
            <Clock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 mr-0.5" />
            <span className="font-medium truncate max-w-[50px] sm:max-w-none">{product.duration}</span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-xs sm:text-base md:text-lg font-bold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-tight">{product.description}</p>
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              {hasVariants && minPrice !== maxPrice ? (
                <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
                </span>
              ) : (
                <>
                  <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    ₹{salePrice.toLocaleString()}
                  </span>
                  {originalPrice > salePrice && (
                    <span className="text-[9px] sm:text-xs text-gray-400 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </div>
            {hasVariants ? (
              <p className="text-[9px] sm:text-xs font-medium text-purple-600 mt-0.5 flex items-center gap-0.5">
                <Layers className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {product.variants!.length} plans
              </p>
            ) : flashSaleInfo.isOnFlashSale ? (
              <p className="text-[9px] sm:text-xs font-semibold text-red-600 mt-0.5 flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Save ₹{flashSaleInfo.discountAmount}
              </p>
            ) : savings > 0 ? (
              <p className="text-[9px] sm:text-xs font-semibold text-emerald-600 mt-0.5">
                Save ₹{savings.toLocaleString()}
              </p>
            ) : null}
          </div>
          <Button
            onClick={() => navigate(`/product/${product.id}`)}
            size="sm"
            className="rounded-lg sm:rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 transition-all group/btn text-[10px] sm:text-xs px-2.5 sm:px-3 h-7 sm:h-8 flex-shrink-0 min-w-[60px] sm:min-w-0"
          >
            <span>View</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
