import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { useReviews } from '@/hooks/useReviews';
import { mockProducts, mockReviews } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Check, Star, ShieldCheck, Clock, ArrowLeft, Key, Package, UserCheck, Zap, MessageCircle, Sparkles, Send, Layers, Flame, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isSupabaseConfigured } from '@/lib/supabase';
import { DeliveryType, ProductVariant } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getFlashSaleInfoFromStorage } from '@/hooks/useFlashSale';
import { usePremium } from '@/hooks/usePremium';

const deliveryTypeInfo: Record<DeliveryType, { label: string; icon: React.ReactNode; description: string; color: string; userAction: string }> = {
  CREDENTIALS: {
    label: 'Login Credentials',
    icon: <Key className="h-5 w-5" />,
    description: 'You will receive login credentials (email & password) to access the service',
    color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
    userAction: 'After purchase, you will receive the account email and password'
  },
  COUPON_CODE: {
    label: 'Activation Code / License Key',
    icon: <Package className="h-5 w-5" />,
    description: 'You will receive an activation code or license key to redeem',
    color: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
    userAction: 'After purchase, you will receive a code to activate your subscription'
  },
  MANUAL_ACTIVATION: {
    label: 'Manual Activation (You Provide Account)',
    icon: <UserCheck className="h-5 w-5" />,
    description: 'We will activate the premium features on YOUR existing account',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
    userAction: '⚠️ You need to provide your account email/ID during checkout'
  },
  INSTANT_KEY: {
    label: 'Instant Delivery',
    icon: <Zap className="h-5 w-5" />,
    description: 'Your license key will be delivered instantly after payment',
    color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
    userAction: 'After payment verification, your key will be delivered automatically'
  }
};

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { product: dbProduct, isLoading } = useProduct(id!);
  const { settings } = useSettings();
  const { reviews: dbReviews, createReview, isLoading: reviewsLoading } = useReviews(id);
  const { isPremium, premiumProducts, fetchPremiumProducts } = usePremium();
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [flashSaleInfo, setFlashSaleInfo] = useState({ isOnFlashSale: false, discountAmount: 0 });

  // Use mock data if Supabase is not configured
  const product = isSupabaseConfigured && dbProduct ? dbProduct : mockProducts.find(p => p.id === id);
  const productReviews = isSupabaseConfigured && dbReviews.length > 0 ? dbReviews : mockReviews.filter(r => r.productId === id);

  // Fetch premium products for premium users
  useEffect(() => {
    if (isPremium) {
      fetchPremiumProducts();
    }
  }, [isPremium, fetchPremiumProducts]);

  // Check if this product has premium pricing
  const premiumProductInfo = useMemo(() => {
    if (!isPremium || !id) return null;
    return premiumProducts.find(pp => pp.product_id === id);
  }, [isPremium, premiumProducts, id]);

  // Check flash sale status
  useEffect(() => {
    if (!id) return;
    const checkFlashSale = () => {
      setFlashSaleInfo(getFlashSaleInfoFromStorage(id));
    };
    checkFlashSale();
    const interval = setInterval(checkFlashSale, 1000);
    return () => clearInterval(interval);
  }, [id]);


  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to submit a review',
        variant: 'destructive',
      });
      return;
    }

    if (!reviewComment.trim()) {
      toast({
        title: 'Review required',
        description: 'Please write a review comment',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await createReview(reviewRating, reviewComment);
      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback',
      });
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      toast({
        title: 'Error submitting review',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center pb-20 md:pb-0">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} className="btn-gradient">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const handleBuyNow = () => {
    if (!user) {
      const variantParam = selectedVariant ? `?variant=${selectedVariant.id}` : '';
      navigate('/login', { state: { from: `/checkout/${id}${variantParam}` } });
    } else {
      const variantParam = selectedVariant ? `?variant=${selectedVariant.id}` : '';
      navigate(`/checkout/${id}${variantParam}`);
    }
  };
  
  // Get selected variant or default
  const selectedVariant = product?.hasVariants && product?.variants 
    ? product.variants.find(v => v.id === selectedVariantId) || product.variants.find(v => v.isDefault) || product.variants[0]
    : null;
  
  // Calculate effective prices based on variant
  const baseSalePrice = selectedVariant ? selectedVariant.salePrice : (product?.salePrice || 0);
  const originalPrice = selectedVariant ? selectedVariant.originalPrice : (product?.originalPrice || 0);
  
  // Apply premium pricing if applicable
  let premiumAdjustedPrice = baseSalePrice;
  let isPremiumFree = false;
  let premiumDiscountPercent = 0;
  
  if (premiumProductInfo) {
    if (premiumProductInfo.is_free_for_premium) {
      premiumAdjustedPrice = 0;
      isPremiumFree = true;
    } else if (premiumProductInfo.premium_discount_percent > 0) {
      premiumDiscountPercent = premiumProductInfo.premium_discount_percent;
      premiumAdjustedPrice = Math.round(baseSalePrice * (1 - premiumDiscountPercent / 100));
    }
  }
  
  // Apply flash sale discount (on top of premium pricing)
  const salePrice = flashSaleInfo.isOnFlashSale 
    ? Math.max(0, premiumAdjustedPrice - flashSaleInfo.discountAmount)
    : premiumAdjustedPrice;
  
  const effectiveDuration = selectedVariant ? selectedVariant.duration : product?.duration;
  const displayOriginalPrice = flashSaleInfo.isOnFlashSale ? premiumAdjustedPrice : (isPremiumFree ? baseSalePrice : originalPrice);
  const savings = displayOriginalPrice - salePrice;
  const discountPercent = displayOriginalPrice > 0 ? Math.round((savings / displayOriginalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-400 h-10 sm:h-11 px-4 sm:px-5 text-sm font-medium transition-all duration-200 hover:shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 mb-8 sm:mb-14 md:mb-20">
          {/* Image Section */}
          <div className="relative group">
            <div className="aspect-square rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl shadow-gray-200/60 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 ring-1 ring-black/[0.03] dark:ring-white/[0.03]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
                  loading="eager"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <Package className="h-20 w-20 text-gray-300 dark:text-gray-600 mb-4" />
                  <span className="text-gray-400 dark:text-gray-500 text-sm">Product Image</span>
                </div>
              )}
            </div>
            {/* Discount Badge */}
            {flashSaleInfo.isOnFlashSale ? (
              <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
                <span className="inline-flex items-center px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 text-white shadow-xl shadow-red-500/40 animate-pulse backdrop-blur-sm">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  FLASH SALE -₹{flashSaleInfo.discountAmount}
                </span>
              </div>
            ) : discountPercent > 0 && (
              <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
                <span className="inline-flex items-center px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/40">
                  -{discountPercent}% OFF
                </span>
              </div>
            )}
            {/* Category Badge on Image */}
            <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20">
              <Badge className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50 shadow-lg text-xs sm:text-sm font-semibold px-3 py-1.5">
                {product.category}
              </Badge>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-5 sm:space-y-7">

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-gray-900 dark:text-white leading-[1.15] tracking-tight">
                {product.name}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">{product.description}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 px-4 py-2 rounded-full border border-amber-100 dark:border-amber-800/50">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-[18px] sm:w-[18px] fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400">5.0</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {productReviews.length} verified reviews
              </span>
            </div>

            {/* Price Card */}
            <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-7 border ${
              isPremiumFree 
                ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 border-emerald-200/80 dark:border-emerald-800/50'
                : premiumDiscountPercent > 0
                  ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 border-amber-200/80 dark:border-amber-800/50'
                  : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-gray-800/80 border-gray-200/80 dark:border-gray-700/50'
            } shadow-sm`}>
              {/* Premium Badge */}
              {(isPremiumFree || premiumDiscountPercent > 0) && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white border-0 text-xs sm:text-sm font-semibold px-3 py-1 shadow-md shadow-amber-500/20">
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    {isPremiumFree ? 'FREE for Premium' : `${premiumDiscountPercent}% Premium Discount`}
                  </Badge>
                </div>
              )}
              <div className="flex items-baseline gap-3 sm:gap-4 mb-2 flex-wrap">
                {isPremiumFree ? (
                  <span className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    FREE
                  </span>
                ) : (
                  <span className={`text-4xl sm:text-5xl md:text-6xl font-black tracking-tight ${premiumDiscountPercent > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    ₹{salePrice.toLocaleString()}
                  </span>
                )}
                {displayOriginalPrice > salePrice && (
                  <span className="text-lg sm:text-xl md:text-2xl text-gray-400 dark:text-gray-500 line-through font-medium">
                    ₹{displayOriginalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {flashSaleInfo.isOnFlashSale ? (
                <p className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
                  Flash Sale - Save ₹{flashSaleInfo.discountAmount}!
                </p>
              ) : savings > 0 && (
                <p className={`text-sm sm:text-base font-bold ${isPremiumFree || premiumDiscountPercent > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Save ₹{savings.toLocaleString()} ({discountPercent}% OFF)
                </p>
              )}
              <div className="flex items-center gap-2.5 mt-4 text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-900/40 rounded-xl px-4 py-2.5 w-fit">
                <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="font-semibold text-sm sm:text-base">{effectiveDuration} Access</span>
              </div>
            </div>

            {/* Variant Selection */}
            {product.hasVariants && product.variants && product.variants.length > 1 && (
              <div className="space-y-4">
                <label className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5 text-sm sm:text-base">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                    <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Select Plan
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        (selectedVariant?.id === variant.id)
                          ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 shadow-lg shadow-teal-500/15 ring-1 ring-teal-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/80 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                              {variant.name || variant.duration}
                            </p>
                            {variant.isDefault && (
                              <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 dark:from-purple-900/40 dark:to-violet-900/40 dark:text-purple-400 border-0 text-[10px] sm:text-xs font-semibold">
                                Most Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{variant.duration} Access</p>
                          {/* Show delivery type if different from product */}
                          {variant.deliveryType && variant.deliveryType !== product.deliveryType && (
                            <Badge className="mt-2 text-[10px] sm:text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                              {variant.deliveryType === 'COUPON_CODE' ? 'License Key' : 
                               variant.deliveryType === 'CREDENTIALS' ? 'Login Access' :
                               variant.deliveryType === 'INSTANT_KEY' ? 'Instant Key' : 'Manual Setup'}
                            </Badge>
                          )}
                          {/* Show variant features preview */}
                          {variant.features && variant.features.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Includes:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {variant.features.slice(0, 3).map((feature, idx) => (
                                  <span 
                                    key={idx} 
                                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg"
                                  >
                                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-teal-500" />
                                    <span className="truncate max-w-[80px] sm:max-w-none">{feature.length > 20 ? feature.slice(0, 20) + '...' : feature}</span>
                                  </span>
                                ))}
                                {variant.features.length > 3 && (
                                  <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
                                    +{variant.features.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {flashSaleInfo.isOnFlashSale ? (
                            <>
                              <p className="text-xs sm:text-sm text-gray-400 line-through">
                                ₹{variant.salePrice.toLocaleString()}
                              </p>
                              <p className={`text-xl sm:text-2xl font-black ${selectedVariant?.id === variant.id ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                                ₹{Math.max(0, variant.salePrice - flashSaleInfo.discountAmount).toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <>
                              {variant.originalPrice > variant.salePrice && (
                                <p className="text-xs sm:text-sm text-gray-400 line-through">
                                  ₹{variant.originalPrice.toLocaleString()}
                                </p>
                              )}
                              <p className={`text-xl sm:text-2xl font-black ${selectedVariant?.id === variant.id ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                                ₹{variant.salePrice.toLocaleString()}
                              </p>
                            </>
                          )}
                          {/* Stock indicator for variant */}
                          {variant.stockCount !== undefined && variant.stockCount > 0 && variant.stockCount <= 5 && (
                            <p className="text-[10px] sm:text-xs text-amber-600 font-medium mt-1">Only {variant.stockCount} left</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Indicator */}
            {product.stockCount !== undefined && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm ${
                product.stockCount === 0 
                  ? 'bg-red-50 border-red-200/80 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'
                  : product.stockCount <= 5 
                    ? 'bg-amber-50 border-amber-200/80 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400'
                    : 'bg-emerald-50 border-emerald-200/80 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  product.stockCount === 0 
                    ? 'bg-red-100 dark:bg-red-900/40'
                    : product.stockCount <= 5 
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : 'bg-emerald-100 dark:bg-emerald-900/40'
                }`}>
                  <Package className="h-5 w-5" />
                </div>
                <span className="font-semibold">
                  {product.stockCount === 0 
                    ? 'Out of Stock' 
                    : product.stockCount <= 5 
                      ? `Only ${product.stockCount} left in stock!`
                      : `${product.stockCount} in stock`}
                </span>
              </div>
            )}

            {/* Buy Button */}
            <Button
              onClick={handleBuyNow}
              size="lg"
              disabled={product.stockCount === 0}
              className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {product.stockCount === 0 ? (
                'Out of Stock'
              ) : user ? (
                <>
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2.5" />
                  Buy Now - ₹{salePrice.toLocaleString()}
                </>
              ) : (
                'Login to Purchase'
              )}
            </Button>

            {/* Delivery Type Info - Use variant's delivery type if selected */}
            {(() => {
              const effectiveDeliveryType = selectedVariant?.deliveryType || product.deliveryType;
              const customUserSees = (product as any).customUserSeesLabel;
              return effectiveDeliveryType && (
                <div className={`rounded-2xl overflow-hidden border ${deliveryTypeInfo[effectiveDeliveryType].color} shadow-sm`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-xl bg-white/60 dark:bg-black/20 flex-shrink-0">
                        {deliveryTypeInfo[effectiveDeliveryType].icon}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm sm:text-base block truncate">{deliveryTypeInfo[effectiveDeliveryType].label}</span>
                        <p className="text-[10px] sm:text-xs opacity-70 font-medium">Delivery Method</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                      {product.deliveryInstructions || deliveryTypeInfo[effectiveDeliveryType].description}
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-3 sm:p-4 border-t border-current/10">
                    <p className="text-[10px] sm:text-xs md:text-sm font-medium flex items-start gap-2.5">
                      <span className="text-base sm:text-lg leading-none flex-shrink-0">📋</span>
                      <span className="whitespace-pre-wrap">{customUserSees || deliveryTypeInfo[effectiveDeliveryType].userAction}</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-4 sm:p-5 border border-blue-100/80 dark:border-blue-800/40 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#0088cc] to-[#0066aa] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Have questions? We're here to help!</p>
                  <a
                    href={`https://t.me/${(settings?.telegramUsername || '@karthik_nkn').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0088cc] font-bold hover:underline text-sm sm:text-base truncate block mt-0.5"
                  >
                    Chat with us on Telegram →
                  </a>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Verified</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">100% Genuine</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Fast Delivery</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Within 2 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-10 sm:mb-16 md:mb-20">
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">What's Included</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Everything you get with this product</p>
            </div>
            {selectedVariant && selectedVariant.features && selectedVariant.features.length > 0 && (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-0 text-xs sm:text-sm flex-shrink-0 font-semibold px-3 py-1">
                {selectedVariant.name || selectedVariant.duration} Features
              </Badge>
            )}
          </div>
          {(() => {
            // Use variant features if available, otherwise use product features
            const displayFeatures = (selectedVariant?.features && selectedVariant.features.length > 0) 
              ? selectedVariant.features 
              : product.features;
            
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {displayFeatures.map((feature, index) => (
                  <div 
                    key={index} 
                    className="group flex items-start gap-3 sm:gap-4 bg-white dark:bg-gray-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/60 dark:to-emerald-900/60 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <span className="font-medium text-gray-700 dark:text-gray-200 text-sm sm:text-base leading-relaxed">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">What our customers say</p>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 px-4 py-2 rounded-full border border-amber-100 dark:border-amber-800/50">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">5.0</span>
            </div>
          </div>
          
          {/* Write Review Form */}
          {user && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700/50 mb-6 sm:mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white mb-5 text-base sm:text-lg">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 sm:h-7 sm:w-7 cursor-pointer transition-colors ${
                            star <= reviewRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">Your Review</label>
                  <Textarea
                    placeholder="Share your experience with this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl min-h-[100px] sm:min-h-[120px] resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:bg-gray-900 text-sm sm:text-base"
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold text-sm sm:text-base h-11 sm:h-12 px-6"
                >
                  {isSubmittingReview ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!user && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700/50 mb-6 sm:mb-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base font-medium">Login to share your experience</p>
              <Button
                onClick={() => navigate('/login')}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold text-sm sm:text-base px-6 h-11"
              >
                Login to Review
              </Button>
            </div>
          )}

          {/* Reviews List */}
          {productReviews.length > 0 ? (
            <div className="space-y-4 sm:space-y-5">
              {productReviews.map(review => (
                <div key={review.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white dark:border-gray-700 flex-shrink-0 shadow-md">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userName}`} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-sm sm:text-base font-bold">
                          {review.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{review.userName}</p>
                          {review.verified && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] sm:text-xs font-semibold">
                              <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl sm:rounded-2xl p-10 sm:p-14 text-center border border-gray-100 dark:border-gray-700/50">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-5">
                <Star className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg font-semibold">No reviews yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1.5">Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
