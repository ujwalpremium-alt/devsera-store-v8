import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Copy, 
  Clock, 
  Package, 
  ArrowRight, 
  Home,
  MessageCircle,
  Sparkles,
  Shield,
  Truck,
  CreditCard,
  FileCheck
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { mockSettings } from '@/data/mockData';
import { isSupabaseConfigured } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { orders, isLoading } = useOrders();
  const { settings: dbSettings } = useSettings();
  const settings = dbSettings || (!isSupabaseConfigured ? mockSettings : null);
  
  const [showConfetti, setShowConfetti] = useState(false);
  
  const order = orders.find(o => o.id === orderId);
  const productName = location.state?.productName || order?.product?.name || 'Your Product';
  const productImage = location.state?.productImage || order?.product?.image;
  const amount = location.state?.amount || order?.product?.salePrice || 0;

  useEffect(() => {
    // Trigger confetti animation on mount
    if (!showConfetti) {
      setShowConfetti(true);
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, []);

  const handleCopyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast({
        title: 'Copied!',
        description: 'Order ID copied to clipboard',
      });
    }
  };

  const estimatedDelivery = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const orderSteps = [
    { 
      id: 1, 
      title: 'Order Placed', 
      description: 'Your order has been received',
      icon: <FileCheck className="h-5 w-5" />,
      status: 'completed',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    { 
      id: 2, 
      title: 'Payment Verification', 
      description: 'We are verifying your payment',
      icon: <CreditCard className="h-5 w-5" />,
      status: 'current',
      time: 'In Progress'
    },
    { 
      id: 3, 
      title: 'Processing', 
      description: 'Preparing your credentials',
      icon: <Package className="h-5 w-5" />,
      status: 'pending',
      time: 'Pending'
    },
    { 
      id: 4, 
      title: 'Delivered', 
      description: 'Credentials sent to your account',
      icon: <Truck className="h-5 w-5" />,
      status: 'pending',
      time: `Est. ${estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline">Product</span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-emerald-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline">Checkout</span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-emerald-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Order Confirmed! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Thank you for your purchase. We're processing your order now.
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6 border-0 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-white" />
                <span className="font-bold text-white">Order Summary</span>
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                Processing
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <img
                src={productImage || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=200&q=80'}
                alt={productName}
                className="w-20 h-20 object-cover rounded-xl bg-gray-100 dark:bg-gray-700"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{productName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order?.product?.duration || 'Subscription'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount Paid</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{amount.toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Order ID */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</p>
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {orderId?.slice(0, 8)}...{orderId?.slice(-4)}
                </p>
              </div>
              <Button
                onClick={handleCopyOrderId}
                variant="outline"
                size="sm"
                className="rounded-xl border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Progress Stepper */}
        <Card className="mb-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Order Status
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="relative">
              {orderSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 mb-6 last:mb-0">
                  {/* Step indicator */}
                  <div className="relative flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      step.status === 'completed' 
                        ? 'bg-emerald-500 text-white' 
                        : step.status === 'current'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    {index < orderSteps.length - 1 && (
                      <div className={`absolute top-10 w-0.5 h-16 ${
                        step.status === 'completed' 
                          ? 'bg-emerald-500' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${
                        step.status === 'completed' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : step.status === 'current'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.title}
                      </h4>
                      <span className={`text-xs font-mono ${
                        step.status === 'completed' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : step.status === 'current'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {step.time}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      step.status === 'pending' 
                        ? 'text-gray-400 dark:text-gray-500' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estimated Delivery */}
        <Card className="mb-6 border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Estimated Delivery</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Within 2 Hours
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  By {estimatedDelivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-500" />
              What Happens Next?
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Payment Verification</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Our team will verify your payment screenshot</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Credentials Preparation</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">We'll prepare your login credentials or activation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Delivery</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You'll receive your credentials in the "My Orders" section</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/orders')}
            className="flex-1 h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25"
          >
            <Package className="h-5 w-5 mr-2" />
            Track Order
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1 h-14 text-lg font-bold rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Home className="h-5 w-5 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help?{' '}
            {settings?.telegramUsername ? (
              <a
                href={`https://t.me/${settings.telegramUsername.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0088cc] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Contact us on Telegram
              </a>
            ) : (
              <a href="/support" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Contact Support
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
