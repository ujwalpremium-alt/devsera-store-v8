import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { Heart, Clock, Key, Package, UserCheck, Zap, ShoppingCart, Star, Check, Flame } from 'lucide-react';
import { getFlashSaleInfoFromStorage } from '@/hooks/useFlashSale';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const deliveryIcons: Record<string, React.ReactNode> = {
  CREDENTIALS: <Key className="h-4 w-4" />,
  COUPON_CODE: <Package className="h-4 w-4" />,
  MANUAL_ACTIVATION: <UserCheck className="h-4 w-4" />,
  INSTANT_KEY: <Zap className="h-4 w-4" />
};

const deliveryLabels: Record<string, string> = {
  CREDENTIALS: 'Login Access',
  COUPON_CODE: 'License Key',
  MANUAL_ACTIVATION: 'Manual Setup',
  INSTANT_KEY: 'Instant Key'
};

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [flashSaleInfo, setFlashSaleInfo] = useState({ isOnFlashSale: false, discountAmount: 0 });

  // Check flash sale status
  useEffect(() => {
    if (!product) return;
    const checkFlashSale = () => {
      setFlashSaleInfo(getFlashSaleInfoFromStorage(product.id));
    };
    checkFlashSale();
    const interval = setInterval(checkFlashSale, 1000);
    return () => clearInterval(interval);
  }, [product?.id]);

  if (!product) return null;

  const baseSalePrice = product.salePrice || 0;
  const salePrice = flashSaleInfo.isOnFlashSale 
    ? Math.max(0, baseSalePrice - flashSaleInfo.discountAmount)
    : baseSalePrice;
  const originalPrice = flashSaleInfo.isOnFlashSale ? baseSalePrice : (product.originalPrice || 0);
  const savings = originalPrice - salePrice;
  const discountPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  const handleBuyNow = () => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
              alt={product.name}
              className="w-full h-64 md:h-full object-cover"
            />
            {flashSaleInfo.isOnFlashSale ? (
              <div className="absolute top-4 left-4">
                <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm px-3 py-1 animate-pulse">
                  <Flame className="h-3 w-3 mr-1 inline" />
                  FLASH SALE -₹{flashSaleInfo.discountAmount}
                </Badge>
              </div>
            ) : discountPercent > 0 && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-red-500 text-white text-sm px-3 py-1">
                  -{discountPercent}% OFF
                </Badge>
              </div>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isInWishlist(product.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="text-left mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800">
                  {product.category}
                </Badge>
                <div className="flex items-center text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium ml-1">4.9</span>
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
            </DialogHeader>

            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {product.description}
            </p>

            {/* Delivery Info */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{product.duration}</span>
              </div>
              {product.deliveryType && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  {deliveryIcons[product.deliveryType]}
                  <span>{deliveryLabels[product.deliveryType]}</span>
                </div>
              )}
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-500" />
                  What's Included:
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {product.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  {product.features.length > 4 && (
                    <p className="text-xs text-gray-400 mt-1">
                      +{product.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-baseline gap-3 mb-4">
                <span className={`text-3xl font-bold ${flashSaleInfo.isOnFlashSale ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                  ₹{salePrice.toLocaleString()}
                </span>
                {originalPrice > salePrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                    {flashSaleInfo.isOnFlashSale ? (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <Flame className="h-3 w-3 mr-1 inline" />
                        Save ₹{flashSaleInfo.discountAmount}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Save ₹{savings.toLocaleString()}
                      </Badge>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBuyNow}
                  className={`flex-1 font-semibold ${flashSaleInfo.isOnFlashSale 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' 
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white'}`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleWishlist(product.id)}
                  className={`px-4 ${isInWishlist(product.id) ? 'border-red-500 text-red-500' : ''}`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
