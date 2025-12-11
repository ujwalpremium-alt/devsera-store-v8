import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useSettings } from '@/hooks/useSettings';
import { useCoupons } from '@/hooks/useCoupons';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/contexts/AuthContext';
import { mockProducts, mockSettings } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Upload, CheckCircle2, ArrowLeft, Info, Key, Package, UserCheck, Zap, Ticket, X, Clock, Layers, Flame, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { isSupabaseConfigured } from '@/lib/supabase';
import { DeliveryType, ProductVariant } from '@/types';
import { getFlashSaleInfoFromStorage } from '@/hooks/useFlashSale';

const deliveryTypeInfo: Record<DeliveryType, { icon: React.ReactNode; color: string }> = {
  CREDENTIALS: { icon: <Key className="h-5 w-5" />, color: 'text-blue-600' },
  COUPON_CODE: { icon: <Package className="h-5 w-5" />, color: 'text-purple-600' },
  MANUAL_ACTIVATION: { icon: <UserCheck className="h-5 w-5" />, color: 'text-green-600' },
  INSTANT_KEY: { icon: <Zap className="h-5 w-5" />, color: 'text-amber-600' }
};

export function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [flashSaleInfo, setFlashSaleInfo] = useState({ isOnFlashSale: false, discountAmount: 0 });
  
  // Variant selection
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(searchParams.get('variant'));

  const { product: dbProduct, isLoading: productLoading } = useProduct(id!);
  const { settings: dbSettings, isLoading: settingsLoading } = useSettings();
  const { createOrder, uploadPaymentScreenshot } = useOrders();
  const { validateCoupon, useCoupon, availableCoupons } = useCoupons();
  const { isPremium, premiumProducts, fetchPremiumProducts } = usePremium();

  // Use database data if available, otherwise fall back to mock data
  const product = dbProduct || (!isSupabaseConfigured ? mockProducts.find(p => p.id === id) : null);
  const settings = dbSettings || (!isSupabaseConfigured ? mockSettings : null);
  
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
  
  // Get selected variant
  const selectedVariant = product?.hasVariants && product.variants 
    ? product.variants.find(v => v.id === selectedVariantId) || product.variants.find(v => v.isDefault) || product.variants[0]
    : null;
  
  // Calculate effective price based on variant or product
  const baseEffectivePrice = selectedVariant ? selectedVariant.salePrice : (product?.salePrice || 0);
  
  // Apply premium pricing if applicable
  let premiumAdjustedPrice = baseEffectivePrice;
  let isPremiumFree = false;
  let premiumDiscountPercent = 0;
  
  if (premiumProductInfo) {
    if (premiumProductInfo.is_free_for_premium) {
      premiumAdjustedPrice = 0;
      isPremiumFree = true;
    } else if (premiumProductInfo.premium_discount_percent > 0) {
      premiumDiscountPercent = premiumProductInfo.premium_discount_percent;
      premiumAdjustedPrice = Math.round(baseEffectivePrice * (1 - premiumDiscountPercent / 100));
    }
  }
  
  // Apply flash sale discount (on top of premium pricing)
  const effectivePrice = flashSaleInfo.isOnFlashSale 
    ? Math.max(0, premiumAdjustedPrice - flashSaleInfo.discountAmount)
    : premiumAdjustedPrice;
  const effectiveOriginalPrice = flashSaleInfo.isOnFlashSale 
    ? premiumAdjustedPrice 
    : (isPremiumFree ? baseEffectivePrice : (selectedVariant ? selectedVariant.originalPrice : (product?.originalPrice || 0)));
  const effectiveDuration = selectedVariant ? selectedVariant.duration : (product?.duration || '');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; discountAmount: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Determine effective delivery type (variant's delivery type overrides product's)
  const effectiveDeliveryType = selectedVariant?.deliveryType || product?.deliveryType || 'CREDENTIALS';
  
  // Determine if user input is required based on effective delivery type
  // Only MANUAL_ACTIVATION requires user input (email/password)
  const requiresUserInput = effectiveDeliveryType === 'MANUAL_ACTIVATION' && product?.requiresUserInput;

  // Set default variant when product loads
  useEffect(() => {
    if (product?.hasVariants && product.variants && !selectedVariantId) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      if (defaultVariant) {
        setSelectedVariantId(defaultVariant.id);
      }
    }
  }, [product, selectedVariantId]);

  const orderCreatedRef = useRef(false);
  const [orderCreationAttempted, setOrderCreationAttempted] = useState(false);
  
  // Create order only once when user clicks "Place Order" button, not on page load
  // This prevents duplicate orders when user is just viewing the checkout page

  if ((productLoading || settingsLoading) && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product not found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} className="btn-gradient">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyUPI = () => {
    if (settings) {
      navigator.clipboard.writeText(settings.upiId);
      toast({
        title: 'Copied!',
        description: 'UPI ID copied to clipboard',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      toast({
        title: 'Screenshot required',
        description: 'Please upload payment screenshot',
        variant: 'destructive',
      });
      return;
    }

    // Validate user input for manual activation products
    if (requiresUserInput && !userInput.trim()) {
      toast({
        title: 'Account details required',
        description: `Please provide your ${product.userInputLabel || 'account email'}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate password for manual activation products (only if requiresPassword is true)
    if (requiresUserInput && product?.requiresPassword !== false && !userPassword.trim()) {
      toast({
        title: 'Password required',
        description: 'Please provide your account password for activation',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Validate product exists
      if (!product) {
        throw new Error('Product not found');
      }

      // Create order first if not already created
      let currentOrderId = orderId;
      const finalPrice = appliedCoupon 
        ? Math.max(0, effectivePrice - appliedCoupon.discountAmount)
        : effectivePrice;
        
      if (!currentOrderId && product && isSupabaseConfigured) {
        console.log('Creating order for product:', product.id, 'variant:', selectedVariant?.id);
        const order = await createOrder(product.id, selectedVariant?.id, finalPrice);
        currentOrderId = order.id;
        setOrderId(order.id);
        
        // Mark coupon as used if applied
        if (appliedCoupon) {
          await useCoupon(appliedCoupon.id, order.id);
        }
      }

      // Simulate upload progress
      for (let i = 0; i <= 90; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Combine email and password for storage
      const userProvidedData = requiresUserInput 
        ? JSON.stringify({ 
            email: userInput, 
            password: product?.requiresPassword !== false ? userPassword : undefined 
          })
        : userInput;

      if (isSupabaseConfigured && currentOrderId) {
        await uploadPaymentScreenshot(currentOrderId, screenshot, userProvidedData);
      }
      setUploadProgress(100);

      toast({
        title: 'Order submitted!',
        description: 'Your payment is being verified. You will receive credentials within 2 hours.',
      });

      // Navigate to order confirmation page
      setTimeout(() => {
        navigate(`/order-confirmation/${currentOrderId}`, {
          state: {
            productName: product?.name,
            productImage: product?.image,
            amount: finalPrice
          }
        });
      }, 1000);
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Order submission failed',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive',
      });
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/product/${id}`)}
          className="mb-6 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Complete Your Purchase
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Review your order and complete payment to get instant access
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-black dark:border-gray-600 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              <div className="flex items-start gap-4">
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-black dark:border-gray-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{effectiveDuration}</p>
                  {/* Premium Badge */}
                  {(isPremiumFree || premiumDiscountPercent > 0) && (
                    <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white mr-2">
                      <Crown className="h-3 w-3 mr-1" />
                      {isPremiumFree ? 'FREE for Premium' : `${premiumDiscountPercent}% Premium Discount`}
                    </div>
                  )}
                  {flashSaleInfo.isOnFlashSale && (
                    <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white">
                      <Flame className="h-3 w-3 mr-1" />
                      FLASH SALE -₹{flashSaleInfo.discountAmount}
                    </div>
                  )}
                  <div className="mt-2">
                    {effectiveOriginalPrice > effectivePrice && (
                      <span className="line-through text-gray-400 text-sm mr-2">
                        ₹{effectiveOriginalPrice.toLocaleString()}
                      </span>
                    )}
                    {isPremiumFree ? (
                      <span className="text-2xl font-bold text-green-600">FREE</span>
                    ) : (
                      <span className={`text-2xl font-bold ${flashSaleInfo.isOnFlashSale ? 'text-red-600' : premiumDiscountPercent > 0 ? 'text-amber-600' : 'text-[#0A7A7A]'}`}>
                        ₹{effectivePrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Variant Selection */}
              {product.hasVariants && product.variants && product.variants.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Select Plan
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedVariantId === variant.id
                            ? flashSaleInfo.isOnFlashSale ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md' : 'border-[#0A7A7A] bg-teal-50 dark:bg-teal-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {variant.name || variant.duration}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{variant.duration}</p>
                          </div>
                          <div className="text-right">
                            {flashSaleInfo.isOnFlashSale ? (
                              <>
                                <p className="text-xs text-gray-400 line-through">
                                  ₹{variant.salePrice.toLocaleString()}
                                </p>
                                <p className={`font-bold ${selectedVariantId === variant.id ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                  ₹{Math.max(0, variant.salePrice - flashSaleInfo.discountAmount).toLocaleString()}
                                </p>
                              </>
                            ) : (
                              <>
                                {variant.originalPrice > variant.salePrice && (
                                  <p className="text-xs text-gray-400 line-through">
                                    ₹{variant.originalPrice.toLocaleString()}
                                  </p>
                                )}
                                <p className={`font-bold ${selectedVariantId === variant.id ? 'text-[#0A7A7A] dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                                  ₹{variant.salePrice.toLocaleString()}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {variant.isDefault && (
                          <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-6">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-green-600" />
                Have a Coupon?
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-xl p-3">
                  <div>
                    <p className="font-semibold text-green-700">Coupon Applied!</p>
                    <p className="text-sm text-green-600">₹{appliedCoupon.discountAmount} discount</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="border-2 rounded-xl uppercase"
                  />
                  <Button
                    onClick={async () => {
                      if (!couponCode.trim()) return;
                      setIsValidatingCoupon(true);
                      try {
                        const coupon = await validateCoupon(couponCode);
                        setAppliedCoupon(coupon);
                        toast({ title: 'Coupon applied!', description: `₹${coupon.discountAmount} discount` });
                      } catch (error: any) {
                        toast({ title: 'Invalid coupon', description: error.message, variant: 'destructive' });
                      } finally {
                        setIsValidatingCoupon(false);
                      }
                    }}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="rounded-xl"
                  >
                    {isValidatingCoupon ? '...' : 'Apply'}
                  </Button>
                </div>
              )}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <p className="text-xs text-green-600 mt-2">
                  You have {availableCoupons.length} coupon{availableCoupons.length > 1 ? 's' : ''} available!
                </p>
              )}
            </div>

            {/* Premium Pricing Display */}
            {(isPremiumFree || premiumDiscountPercent > 0) && !appliedCoupon && !flashSaleInfo.isOnFlashSale && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  <span className="font-bold text-amber-600">Premium Member Pricing!</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Regular Price:</span>
                  <span className="text-gray-500 line-through">₹{baseEffectivePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-amber-600">
                  <span>Premium {isPremiumFree ? 'Benefit' : 'Discount'}:</span>
                  <span>{isPremiumFree ? 'FREE' : `-₹${(baseEffectivePrice - premiumAdjustedPrice).toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200">
                  <span className="font-bold text-gray-900">You Pay:</span>
                  <span className={`text-2xl font-bold ${isPremiumFree ? 'text-green-600' : 'text-amber-600'}`}>
                    {isPremiumFree ? 'FREE' : `₹${effectivePrice.toLocaleString()}`}
                  </span>
                </div>
              </div>
            )}

            {/* Flash Sale Discount Display */}
            {flashSaleInfo.isOnFlashSale && !appliedCoupon && (
              <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-600">Flash Sale Active!</span>
                </div>
                {(isPremiumFree || premiumDiscountPercent > 0) && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Regular Price:</span>
                      <span className="text-gray-500 line-through">₹{baseEffectivePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-600">
                      <span>Premium Discount:</span>
                      <span>-₹{(baseEffectivePrice - premiumAdjustedPrice).toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{(isPremiumFree || premiumDiscountPercent > 0) ? 'Premium Price:' : 'Original Price:'}</span>
                  <span className="text-gray-500 line-through">₹{premiumAdjustedPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span>Flash Sale Discount:</span>
                  <span>-₹{flashSaleInfo.discountAmount}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-red-200">
                  <span className="font-bold text-gray-900">You Pay:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ₹{effectivePrice.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Final Price */}
            {appliedCoupon && (
              <div className="bg-green-50 rounded-2xl border-2 border-green-200 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{flashSaleInfo.isOnFlashSale ? 'Flash Sale Price:' : 'Original Price:'}</span>
                  <span className="text-gray-500 line-through">₹{effectivePrice.toLocaleString()}</span>
                </div>
                {flashSaleInfo.isOnFlashSale && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Flash Sale Discount:</span>
                    <span>-₹{flashSaleInfo.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-green-600">
                  <span>Coupon Discount:</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
                  <span className="font-bold text-gray-900">Final Price:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{Math.max(0, effectivePrice - appliedCoupon.discountAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                Important Instructions
              </h3>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">1</span>
                  <span>Scan the QR code or use the UPI ID to make payment</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">2</span>
                  <span>Take a screenshot of the successful payment</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">3</span>
                  <span>Upload the screenshot below and submit</span>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">4</span>
                  <span>You'll receive credentials within 2 hours after verification</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Loading state for payment settings */}
            {!settings && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-700">Loading payment settings...</p>
              </div>
            )}
            
            {/* QR Code */}
            <div className="bg-white rounded-2xl border-2 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Scan QR Code
              </h2>
              <div className="inline-block rounded-xl overflow-hidden border-4 border-black shadow-lg">
                {settings?.qrCodeUrl && settings.qrCodeUrl.length > 0 ? (
                  <img
                    src={settings.qrCodeUrl}
                    alt="Payment QR Code"
                    className="w-64 h-64 object-contain bg-white"
                    onError={(e) => {
                      console.error('QR Code image failed to load');
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<div class="w-64 h-64 bg-gray-100 flex flex-col items-center justify-center"><p class="text-sm text-gray-500">QR Code failed to load</p></div>';
                    }}
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 flex flex-col items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">QR Code not available</p>
                    <p className="text-xs text-gray-400">Use UPI ID below</p>
                  </div>
                )}
              </div>
            </div>

            {/* UPI ID */}
            <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                Or Pay Using UPI ID
              </Label>
              <div className="flex items-center gap-2">
                <div className={`flex-1 font-mono text-lg font-bold p-4 rounded-xl border-2 ${
                  settings?.upiId && settings.upiId.length > 0
                    ? 'bg-teal-50 text-[#0A7A7A] border-teal-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {settings?.upiId && settings.upiId.length > 0 ? settings.upiId : 'Loading UPI ID...'}
                </div>
                <Button
                  onClick={handleCopyUPI}
                  disabled={!settings?.upiId || settings.upiId.length === 0}
                  variant="outline"
                  className="rounded-xl border-2 border-black hover:bg-teal-50 hover:text-[#0A7A7A] h-14 px-4"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              {settings?.upiId && settings.upiId.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Click the copy button to copy UPI ID to clipboard
                </p>
              )}
            </div>

            {/* Delivery Info */}
            {product.deliveryType && (
              <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${deliveryTypeInfo[product.deliveryType].color}`}>
                    {deliveryTypeInfo[product.deliveryType].icon}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">Delivery Method</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {product.deliveryInstructions || 'You will receive your access within 2 hours of payment verification.'}
                </p>
              </div>
            )}

            {/* Estimated Delivery Time */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Estimated Delivery</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">Within 2 Hours</p>
                </div>
              </div>
            </div>

            {/* User Input for Manual Activation */}
            {requiresUserInput && (
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-blue-800">
                    Your Account {product.requiresPassword !== false ? 'Credentials' : 'Details'} Required
                  </h3>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  {product.requiresPassword !== false 
                    ? 'We need your account credentials to activate the service on your existing account. Your credentials are securely stored and only used for activation.'
                    : 'We need your account details to activate the service on your existing account.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userInput" className="font-semibold text-blue-800">
                      {product.userInputLabel || 'Your Account Email'} *
                    </Label>
                    <Input
                      id="userInput"
                      type="email"
                      placeholder={`Enter your ${product.userInputLabel?.toLowerCase() || 'account email'}`}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="border-2 border-blue-200 rounded-xl mt-2 focus:border-blue-500"
                    />
                  </div>
                  {product.requiresPassword !== false && (
                    <div>
                      <Label htmlFor="userPassword" className="font-semibold text-blue-800">
                        Account Password *
                      </Label>
                      <Input
                        id="userPassword"
                        type="password"
                        placeholder="Enter your account password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="border-2 border-blue-200 rounded-xl mt-2 focus:border-blue-500"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        🔒 Your password is encrypted and only used for activation purposes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Screenshot */}
            <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Upload Payment Screenshot <span className="text-red-500">*</span>
              </Label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                screenshot 
                  ? 'border-emerald-400 bg-emerald-50' 
                  : 'border-gray-300 hover:border-[#0A7A7A] hover:bg-teal-50'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  {screenshot ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-300">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      </div>
                      <p className="font-semibold text-emerald-700">{screenshot.name}</p>
                      <p className="text-xs text-emerald-600">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-700">Click to upload screenshot</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center mt-2 text-gray-500">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!screenshot || isUploading || (requiresUserInput && !userInput.trim()) || (requiresUserInput && product.requiresPassword !== false && !userPassword.trim())}
              className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Place Order - {isPremiumFree ? 'FREE' : `₹${appliedCoupon 
                    ? Math.max(0, effectivePrice - appliedCoupon.discountAmount).toLocaleString()
                    : effectivePrice.toLocaleString()
                  }`}
                </>
              )}
            </Button>

            {/* Contact Support */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-center text-gray-600">
                Need help?{' '}
                {settings?.telegramUsername ? (
                  <a
                    href={`https://t.me/${settings.telegramUsername.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0088cc] font-bold hover:underline"
                  >
                    Contact {settings.telegramUsername} on Telegram
                  </a>
                ) : settings?.telegramLink ? (
                  <a
                    href={settings.telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0088cc] font-bold hover:underline"
                  >
                    Contact us on Telegram
                  </a>
                ) : settings?.contactEmail ? (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-[#0A7A7A] font-bold hover:underline"
                  >
                    Email us at {settings.contactEmail}
                  </a>
                ) : (
                  <span className="text-gray-500">Contact support</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
