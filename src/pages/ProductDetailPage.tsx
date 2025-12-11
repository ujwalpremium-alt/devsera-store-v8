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
            <Package className="h-10 w-10 text-gray-400" />
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        {/* Product Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 md:mb-16">
          {/* Image Section */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-2xl shadow-gray-200/50">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                }}
              />
            </div>
            {/* Discount Badge */}
            {flashSaleInfo.isOnFlashSale ? (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg animate-pulse">
                  <Flame className="h-4 w-4 mr-1" />
                  FLASH SALE -₹{flashSaleInfo.discountAmount}
                </span>
              </div>
            ) : discountPercent > 0 && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                  -{discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Category Badge */}
            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
              {product.category}
            </Badge>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400">{product.description}</p>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({productReviews.length} reviews)
              </span>
            </div>

            {/* Price Card */}
            <div className={`rounded-2xl p-6 border ${
              isPremiumFree 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                : premiumDiscountPercent > 0
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-100 dark:border-teal-800'
            }`}>
              {/* Premium Badge */}
              {(isPremiumFree || premiumDiscountPercent > 0) && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    {isPremiumFree ? 'FREE for Premium' : `${premiumDiscountPercent}% Premium Discount`}
                  </Badge>
                </div>
              )}
              <div className="flex items-baseline gap-3 mb-2">
                {isPremiumFree ? (
                  <span className="text-4xl md:text-5xl font-extrabold text-green-600 dark:text-green-400">
                    FREE
                  </span>
                ) : (
                  <span className={`text-4xl md:text-5xl font-extrabold ${premiumDiscountPercent > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    ₹{salePrice.toLocaleString()}
                  </span>
                )}
                {displayOriginalPrice > salePrice && (
                  <span className="text-xl text-gray-400 line-through">
                    ₹{displayOriginalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {flashSaleInfo.isOnFlashSale ? (
                <p className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Flash Sale - Save ₹{flashSaleInfo.discountAmount}!
                </p>
              ) : savings > 0 && (
                <p className={`text-lg font-semibold ${isPremiumFree || premiumDiscountPercent > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  Save ₹{savings.toLocaleString()} ({discountPercent}% OFF)
                </p>
              )}
              <div className="flex items-center gap-2 mt-4 text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{effectiveDuration} Access</span>
              </div>
            </div>

            {/* Variant Selection */}
            {product.hasVariants && product.variants && product.variants.length > 1 && (
              <div className="space-y-3">
                <label className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  Select Plan
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        (selectedVariant?.id === variant.id)
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-lg ring-2 ring-teal-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {variant.name || variant.duration}
                            </p>
                            {variant.isDefault && (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0 text-xs">
                                Most Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{variant.duration} Access</p>
                          {/* Show delivery type if different from product */}
                          {variant.deliveryType && variant.deliveryType !== product.deliveryType && (
                            <Badge className="mt-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                              {variant.deliveryType === 'COUPON_CODE' ? 'License Key' : 
                               variant.deliveryType === 'CREDENTIALS' ? 'Login Access' :
                               variant.deliveryType === 'INSTANT_KEY' ? 'Instant Key' : 'Manual Setup'}
                            </Badge>
                          )}
                          {/* Show variant features preview */}
                          {variant.features && variant.features.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Includes:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {variant.features.slice(0, 3).map((feature, idx) => (
                                  <span 
                                    key={idx} 
                                    className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md"
                                  >
                                    <Check className="h-3 w-3 text-teal-500" />
                                    {feature.length > 25 ? feature.slice(0, 25) + '...' : feature}
                                  </span>
                                ))}
                                {variant.features.length > 3 && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">
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
                              <p className="text-sm text-gray-400 line-through">
                                ₹{variant.salePrice.toLocaleString()}
                              </p>
                              <p className={`text-xl font-bold ${selectedVariant?.id === variant.id ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                ₹{Math.max(0, variant.salePrice - flashSaleInfo.discountAmount).toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <>
                              {variant.originalPrice > variant.salePrice && (
                                <p className="text-sm text-gray-400 line-through">
                                  ₹{variant.originalPrice.toLocaleString()}
                                </p>
                              )}
                              <p className={`text-xl font-bold ${selectedVariant?.id === variant.id ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                                ₹{variant.salePrice.toLocaleString()}
                              </p>
                            </>
                          )}
                          {/* Stock indicator for variant */}
                          {variant.stockCount !== undefined && variant.stockCount > 0 && variant.stockCount <= 5 && (
                            <p className="text-xs text-amber-600 mt-1">Only {variant.stockCount} left</p>
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
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                product.stockCount === 0 
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : product.stockCount <= 5 
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                    : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              }`}>
                <Package className="h-5 w-5" />
                <span className="font-medium">
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
              className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stockCount === 0 ? (
                'Out of Stock'
              ) : user ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buy Now
                </>
              ) : (
                'Login to Purchase'
              )}
            </Button>

            {/* Delivery Type Info - Use variant's delivery type if selected */}
            {(() => {
              const effectiveDeliveryType = selectedVariant?.deliveryType || product.deliveryType;
              const showUserInputNote = effectiveDeliveryType === 'MANUAL_ACTIVATION' && product.requiresUserInput;
              const customUserSees = (product as any).customUserSeesLabel;
              return effectiveDeliveryType && (
                <div className={`rounded-xl p-4 border-2 ${deliveryTypeInfo[effectiveDeliveryType].color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {deliveryTypeInfo[effectiveDeliveryType].icon}
                    <span className="font-semibold text-sm sm:text-base">{deliveryTypeInfo[effectiveDeliveryType].label}</span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">
                    {product.deliveryInstructions || deliveryTypeInfo[effectiveDeliveryType].description}
                  </p>
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 sm:p-3 mt-2">
                    <p className="text-xs sm:text-sm font-medium">
                      📋 {customUserSees || deliveryTypeInfo[effectiveDeliveryType].userAction}
                    </p>
                  </div>
                  {showUserInputNote && (
                    <p className="text-xs sm:text-sm mt-2 font-medium opacity-75 bg-yellow-100 dark:bg-yellow-900/30 p-2 sm:p-3 rounded-lg">
                      ⚠️ You'll need to provide your {product.userInputLabel || 'account details'} during checkout
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Have questions?</p>
                  <a
                    href={`https://t.me/${(settings?.telegramUsername || '@karthik_nkn').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0088cc] font-bold hover:underline"
                  >
                    Contact {settings?.telegramUsername || '@karthik_nkn'} on Telegram
                  </a>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Verified</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">100% Genuine</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Fast Delivery</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Within 2 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12 md:mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">What's Included</h2>
            {selectedVariant && selectedVariant.features && selectedVariant.features.length > 0 && (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayFeatures.map((feature, index) => (
                  <div 
                    key={index} 
                    className="group flex items-start gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{feature}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Customer Reviews</h2>
          
          {/* Write Review Form */}
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 cursor-pointer transition-colors ${
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
                  <Textarea
                    placeholder="Share your experience with this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-xl min-h-[100px] resize-none focus:border-teal-500 dark:bg-gray-900"
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold"
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
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6 text-center">
              <p className="text-gray-600 mb-3">Login to write a review</p>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="rounded-xl border-2 border-black"
              >
                Login
              </Button>
            </div>
          )}

          {/* Reviews List */}
          {productReviews.length > 0 ? (
            <div className="space-y-4">
              {productReviews.map(review => (
                <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-gray-100 dark:border-gray-700">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userName}`} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                          {review.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{review.userName}</p>
                          {review.verified && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
