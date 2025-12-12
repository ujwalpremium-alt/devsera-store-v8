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
import { checkRateLimit, formatTimeRemaining } from '@/utils/rateLimiter';

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
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading checkout...</p>
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
    // Check rate limit for order submissions
    const rateLimit = checkRateLimit('order-submit', 3, 300000); // 3 orders per 5 minutes
    if (rateLimit.isLimited) {
      toast({
        title: 'Too many orders',
        description: `Please wait ${formatTimeRemaining(rateLimit.resetIn)} before placing another order.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Comprehensive validation
    const errors: string[] = [];
    
    if (!screenshot) {
      errors.push('Payment screenshot is required');
    }
    
    // Validate file size (max 10MB)
    if (screenshot && screenshot.size > 10 * 1024 * 1024) {
      errors.push('Screenshot file size must be less than 10MB');
    }
    
    // Validate file type
    if (screenshot && !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(screenshot.type)) {
      errors.push('Please upload a valid image file (JPG, PNG, WebP, or GIF)');
    }

    // Validate user input for manual activation products
    if (requiresUserInput && !userInput.trim()) {
      errors.push(`Please provide your ${product?.userInputLabel || 'account email'}`);
    }
    
    // Validate email format if it looks like an email field
    if (requiresUserInput && userInput.trim() && product?.userInputLabel?.toLowerCase().includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput.trim())) {
        errors.push('Please enter a valid email address');
      }
    }

    // Validate password for manual activation products (only if requiresPassword is true)
    if (requiresUserInput && product?.requiresPassword !== false && !userPassword.trim()) {
      errors.push('Account password is required for activation');
    }
    
    // Validate password length
    if (requiresUserInput && product?.requiresPassword !== false && userPassword.trim() && userPassword.length < 4) {
      errors.push('Password seems too short. Please verify your password.');
    }

    // Show all validation errors
    if (errors.length > 0) {
      toast({
        title: 'Please fix the following issues',
        description: errors.join('. '),
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Validate product exists
      if (!product) {
        throw new Error('Product not found. Please go back and try again.');
      }
      
      // Check if product is in stock
      const showStock = product.useManualStock || 
        product.deliveryType === 'INSTANT_KEY' || 
        product.deliveryType === 'COUPON_CODE' || 
        product.deliveryType === 'CREDENTIALS' ||
        product.deliveryType === 'MANUAL_ACTIVATION';
      
      if (showStock && product.stockCount !== undefined && product.stockCount === 0) {
        throw new Error('This product is currently out of stock. Please try again later.');
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

      // Simulate upload progress with smoother animation
      for (let i = 0; i <= 90; i += 5) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Combine email and password for storage
      const userProvidedData = requiresUserInput 
        ? JSON.stringify({ 
            email: userInput.trim(), 
            password: product?.requiresPassword !== false ? userPassword : undefined 
          })
        : userInput.trim();

      if (isSupabaseConfigured && currentOrderId) {
        await uploadPaymentScreenshot(currentOrderId, screenshot, userProvidedData);
      }
      setUploadProgress(100);

      toast({
        title: '🎉 Order submitted successfully!',
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
      }, 800);
    } catch (error: any) {
      console.error('Order submission error:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Please try again or contact support';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('storage') || error.message?.includes('upload')) {
        errorMessage = 'Failed to upload screenshot. Please try a smaller file or different format.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Order submission failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-20 md:pb-0">
      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(`/product/${id}`)}
              className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Product</span>
              <span className="sm:hidden">Back</span>
            </Button>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Step 1 of 2</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Secure Payment Gateway</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
            Complete Your Order
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            You're one step away from instant access. Review your order and complete the payment securely.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Payment Section (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Payment Details
                </h2>
                <p className="text-blue-100 text-sm mt-1">Scan QR or use UPI ID to complete payment</p>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-20" />
                      <div className="relative bg-white dark:bg-gray-900 p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl">
                        {settings?.qrCodeUrl && settings.qrCodeUrl.length > 0 ? (
                          <img
                            src={settings.qrCodeUrl}
                            alt="Payment QR Code"
                            className="w-48 h-48 md:w-56 md:h-56 object-contain"
                            onError={(e) => {
                              console.error('QR Code image failed to load');
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-48 h-48 md:w-56 md:h-56 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center rounded-xl">
                            <Package className="h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">QR Code not available</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Scan with any UPI app
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        GPay, PhonePe, Paytm, etc.
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex flex-col justify-center space-y-5">
                    {/* Amount Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Total Amount</p>
                        {appliedCoupon && (
                          <Badge className="bg-green-500 text-white text-xs">
                            Coupon Applied
                          </Badge>
                        )}
                      </div>
                      <p className="text-4xl font-bold text-gray-900 dark:text-white">
                        {isPremiumFree ? (
                          <span className="text-green-600 dark:text-green-400">FREE</span>
                        ) : (
                          `₹${appliedCoupon 
                            ? Math.max(0, effectivePrice - appliedCoupon.discountAmount).toLocaleString()
                            : effectivePrice.toLocaleString()
                          }`
                        )}
                      </p>
                      {appliedCoupon && !isPremiumFree && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="line-through">₹{effectivePrice.toLocaleString()}</span>
                          <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                            Saved ₹{appliedCoupon.discountAmount.toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* UPI ID */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                        UPI ID
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-sm font-semibold p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 truncate">
                          {settings?.upiId && settings.upiId.length > 0 ? settings.upiId : 'Loading...'}
                        </div>
                        <Button
                          onClick={handleCopyUPI}
                          disabled={!settings?.upiId || settings.upiId.length === 0}
                          size="lg"
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 shadow-lg shadow-blue-500/30"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Estimated Delivery */}
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Delivery Time</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Within 2 Hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
              <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-sm">💡</span>
                How to Complete Payment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '1', text: 'Scan QR code or copy UPI ID', tip: 'Use any UPI app' },
                  { step: '2', text: 'Pay the exact amount shown', tip: 'Double-check amount' },
                  { step: '3', text: 'Take a clear screenshot', tip: 'Show transaction ID' },
                  { step: '4', text: 'Upload screenshot & submit', tip: 'Wait for confirmation' }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 bg-white/60 dark:bg-gray-800/60 rounded-xl p-3">
                    <span className="w-7 h-7 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-900 dark:text-amber-200 flex-shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <span className="text-sm text-amber-900 dark:text-amber-200 font-medium">{item.text}</span>
                      <p className="text-xs text-amber-700/70 dark:text-amber-300/70 mt-0.5">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
                <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> Make sure your screenshot clearly shows the payment confirmation with transaction ID. 
                    Orders are typically processed within 1-2 hours during business hours.
                  </span>
                </p>
              </div>
            </div>

            {/* User Input for Manual Activation */}
            {requiresUserInput && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-blue-800 dark:text-blue-300">
                    Your Account {product.requiresPassword !== false ? 'Credentials' : 'Details'} Required
                  </h3>
                </div>
                
                {/* Show custom requirements message if set by admin */}
                {product.customUserSeesLabel && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                      {product.customUserSeesLabel}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  {product.requiresPassword !== false 
                    ? 'We need your account credentials to activate the service on your existing account.'
                    : 'We need your account details to activate the service on your existing account.'}
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userInput" className="font-semibold text-blue-800 dark:text-blue-300">
                      {product.userInputLabel || 'Your Account Email'} *
                    </Label>
                    <Input
                      id="userInput"
                      type="email"
                      placeholder={`Enter your ${product.userInputLabel?.toLowerCase() || 'account email'}`}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="border-2 border-blue-200 dark:border-blue-700 rounded-xl mt-2 focus:border-blue-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                  {product.requiresPassword !== false && (
                    <div>
                      <Label htmlFor="userPassword" className="font-semibold text-blue-800 dark:text-blue-300">
                        Account Password *
                      </Label>
                      <Input
                        id="userPassword"
                        type="password"
                        placeholder="Enter your account password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="border-2 border-blue-200 dark:border-blue-700 rounded-xl mt-2 focus:border-blue-500 bg-white dark:bg-gray-800"
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        🔒 Your password is encrypted and only used for activation purposes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload Screenshot */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg shadow-gray-100/50 dark:shadow-none">
              <Label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block flex items-center gap-2">
                <Upload className="h-4 w-4 text-teal-500" />
                Upload Payment Screenshot <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Take a clear screenshot showing the payment confirmation with transaction ID visible
              </p>
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                screenshot 
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/10'
              }`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  {screenshot ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">{screenshot.name}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Click to change file</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Drop your screenshot here</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center mt-2 text-gray-500 dark:text-gray-400">
                    Processing... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button - Mobile */}
            <div className="lg:hidden">
              <Button
                onClick={handleSubmit}
                disabled={!screenshot || isUploading || (requiresUserInput && !userInput.trim()) || (requiresUserInput && product.requiresPassword !== false && !userPassword.trim())}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Complete Order
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Order Summary Card */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600 p-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </h2>
                </div>
                
                <div className="p-5">
                  {/* Product Info */}
                  <div className="flex gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80'}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-xl bg-gray-100 dark:bg-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{effectiveDuration}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(isPremiumFree || premiumDiscountPercent > 0) && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            {isPremiumFree ? 'FREE' : `${premiumDiscountPercent}% OFF`}
                          </Badge>
                        )}
                        {flashSaleInfo.isOnFlashSale && (
                          <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white border-0 text-xs">
                            <Flame className="h-3 w-3 mr-1" />
                            FLASH SALE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Variant Selection */}
                  {product.hasVariants && product.variants && product.variants.length > 1 && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Label className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3 text-sm">
                        <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Select Plan
                      </Label>
                      <div className="space-y-2">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariantId(variant.id)}
                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                              selectedVariantId === variant.id
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  selectedVariantId === variant.id 
                                    ? 'border-teal-500 bg-teal-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {selectedVariantId === variant.id && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {variant.name || variant.duration}
                                  </p>
                                  {variant.isDefault && (
                                    <span className="text-xs text-purple-600 dark:text-purple-400">Popular</span>
                                  )}
                                </div>
                              </div>
                              <p className={`font-bold ${selectedVariantId === variant.id ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                                ₹{flashSaleInfo.isOnFlashSale 
                                  ? Math.max(0, variant.salePrice - flashSaleInfo.discountAmount).toLocaleString()
                                  : variant.salePrice.toLocaleString()
                                }
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span>₹{effectiveOriginalPrice.toLocaleString()}</span>
                    </div>
                    {effectiveOriginalPrice > effectivePrice && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-₹{(effectiveOriginalPrice - effectivePrice).toLocaleString()}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Coupon</span>
                        <span>-₹{appliedCoupon.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span className={isPremiumFree ? 'text-green-600' : flashSaleInfo.isOnFlashSale ? 'text-red-600' : 'text-teal-600'}>
                        {isPremiumFree ? 'FREE' : `₹${appliedCoupon 
                          ? Math.max(0, effectivePrice - appliedCoupon.discountAmount).toLocaleString()
                          : effectivePrice.toLocaleString()
                        }`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                  <Ticket className="h-4 w-4 text-green-600" />
                  Have a Coupon?
                </h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3">
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Coupon Applied!</p>
                      <p className="text-xs text-green-600 dark:text-green-500">₹{appliedCoupon.discountAmount} off</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="border rounded-xl uppercase text-sm h-10"
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
                      size="sm"
                      className="rounded-xl h-10 px-4"
                    >
                      {isValidatingCoupon ? '...' : 'Apply'}
                    </Button>
                  </div>
                )}
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    {availableCoupons.length} coupon{availableCoupons.length > 1 ? 's' : ''} available!
                  </p>
                )}
              </div>

              {/* Delivery Info */}
              {product.deliveryType && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      product.deliveryType === 'CREDENTIALS' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      product.deliveryType === 'COUPON_CODE' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      product.deliveryType === 'INSTANT_KEY' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <div className={deliveryTypeInfo[product.deliveryType].color}>
                        {deliveryTypeInfo[product.deliveryType].icon}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Delivery Method</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.customUserSeesLabel || (
                          product.deliveryType === 'CREDENTIALS' ? 'Login credentials' :
                          product.deliveryType === 'COUPON_CODE' ? 'Activation code' :
                          product.deliveryType === 'INSTANT_KEY' ? 'Instant delivery' :
                          'Manual activation'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button - Desktop */}
              <div className="hidden lg:block">
                <Button
                  onClick={handleSubmit}
                  disabled={!screenshot || isUploading || (requiresUserInput && !userInput.trim()) || (requiresUserInput && product.requiresPassword !== false && !userPassword.trim())}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Complete Order
                    </>
                  )}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Package className="h-3 w-3 text-purple-500" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Contact Support */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Need help?{' '}
                  {settings?.telegramUsername ? (
                    <a
                      href={`https://t.me/${settings.telegramUsername.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
                    >
                      Contact Support
                    </a>
                  ) : (
                    <span className="text-teal-600 dark:text-teal-400 font-medium">Contact Support</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
