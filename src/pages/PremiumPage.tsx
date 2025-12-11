import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Upload, Loader2, Clock, X, Sparkles, Gift, Zap, Shield, Copy, QrCode, ArrowUp, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium, PREMIUM_PLANS } from '@/hooks/usePremium';
import { PremiumBadge, PremiumPendingBadge } from '@/components/shared/PremiumBadge';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';

// Payment methods will be loaded from settings

const BENEFITS = [
  { icon: Gift, title: 'Free Products', description: 'Get selected products completely free' },
  { icon: Zap, title: 'Exclusive Tricks', description: 'Access premium tricks and guides' },
  { icon: Sparkles, title: 'Special Discounts', description: 'Extra discounts on all products' },
  { icon: Shield, title: 'Priority Support', description: 'Get faster response on tickets' },
];

export default function PremiumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, membership, loading, requestPremium, fetchPendingRequest } = usePremium();
  const { settings } = useSettings();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'5_year' | '10_year' | 'lifetime' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isUpgrade, setIsUpgrade] = useState(false);

  // Calculate current plan value for upgrade pricing
  const currentPlanValue = useMemo(() => {
    if (!membership || !isPremium) return 0;
    
    // Find which plan the user has based on their membership
    const planType = membership.plan_type as keyof typeof PREMIUM_PLANS;
    if (planType && PREMIUM_PLANS[planType]) {
      return PREMIUM_PLANS[planType].price;
    }
    return 0;
  }, [membership, isPremium]);

  // Calculate upgrade price (new plan price - current plan value)
  const getUpgradePrice = (planKey: keyof typeof PREMIUM_PLANS) => {
    const newPlanPrice = PREMIUM_PLANS[planKey].price;
    const upgradePrice = Math.max(0, newPlanPrice - currentPlanValue);
    return upgradePrice;
  };

  // Check if plan is an upgrade
  const isUpgradePlan = (planKey: keyof typeof PREMIUM_PLANS) => {
    if (!isPremium || !membership) return false;
    const currentPlanType = membership.plan_type as keyof typeof PREMIUM_PLANS;
    const planOrder = ['5_year', '10_year', 'lifetime'];
    const currentIndex = planOrder.indexOf(currentPlanType);
    const newIndex = planOrder.indexOf(planKey);
    return newIndex > currentIndex;
  };

  useEffect(() => {
    const checkPending = async () => {
      if (user && !isPremium) {
        const pending = await fetchPendingRequest();
        setPendingRequest(pending);
      }
    };
    checkPending();
  }, [user, isPremium, fetchPendingRequest]);

  const handleSelectPlan = (plan: '5_year' | '10_year' | 'lifetime') => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to join premium',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setIsUpgrade(isUpgradePlan(plan));
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !paymentProof) {
      toast({
        title: 'Missing Information',
        description: 'Please upload payment screenshot',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let proofUrl = '';
      
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);
          proofUrl = urlData.publicUrl;
        }
      }

      await requestPremium(selectedPlan, 'upi', transactionId || 'N/A', proofUrl);
      
      toast({
        title: 'Request Submitted!',
        description: 'Your premium request has been submitted. Admin will verify and approve it soon.',
      });
      
      setShowPaymentModal(false);
      setSelectedPlan(null);
      setTransactionId('');
      setPaymentProof(null);
      
      const pending = await fetchPendingRequest();
      setPendingRequest(pending);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950 pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTIgMC00IDItNCAyczIgNCA0IDRjMiAwIDQtMiA0LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative px-4 py-8 sm:py-12 md:py-16 lg:py-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 mb-3 sm:mb-4 md:mb-6">
            <Crown className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4">Join Premium</h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 max-w-2xl mx-auto px-4">
            Unlock exclusive products, tricks, and special discounts
          </p>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto -mt-6 sm:-mt-8 relative z-10 pb-24">
        {/* Status Cards */}
        {isPremium && membership && (
          <Card className="mb-6 sm:mb-8 border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <PremiumBadge size="lg" expiresAt={membership.expires_at} />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2">
                    You're a premium member! Enjoy all exclusive benefits.
                  </p>
                  {membership.plan_type && membership.plan_type !== 'lifetime' && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-700">
                        Current: {PREMIUM_PLANS[membership.plan_type as keyof typeof PREMIUM_PLANS]?.name || membership.plan_type}
                      </Badge>
                      <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Upgrade available below
                      </Badge>
                    </div>
                  )}
                </div>
                <Button onClick={() => navigate('/premium/exclusive')} className="bg-amber-500 hover:bg-amber-600 w-full sm:w-auto text-sm sm:text-base">
                  View Exclusive Content
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingRequest && !isPremium && (
          <Card className="mb-6 sm:mb-8 border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 sm:p-3 rounded-full bg-yellow-200 dark:bg-yellow-800 flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-700 dark:text-yellow-300" />
                </div>
                <div>
                  <PremiumPendingBadge />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Your request is pending admin approval.
                    {pendingRequest.transaction_id && pendingRequest.transaction_id !== 'N/A' && (
                      <span className="block sm:inline"> Transaction ID: {pendingRequest.transaction_id}</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-8 sm:mb-10 md:mb-12 mt-6 sm:mt-8">
          {BENEFITS.map((benefit) => (
            <Card key={benefit.title} className="border-amber-100 dark:border-amber-900/50 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
              <CardContent className="p-3 sm:p-4 md:p-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-2 sm:mb-3">
                  <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white">{benefit.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Plans */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {(Object.entries(PREMIUM_PLANS) as [keyof typeof PREMIUM_PLANS, typeof PREMIUM_PLANS[keyof typeof PREMIUM_PLANS]][]).map(([key, plan]) => (
            <Card 
              key={key} 
              className={`relative overflow-hidden transition-all hover:shadow-xl ${
                isUpgradePlan(key)
                  ? 'border-2 border-green-400 dark:border-green-600 shadow-lg shadow-green-100 dark:shadow-green-900/20 bg-gradient-to-b from-green-50/50 to-white dark:from-green-900/20 dark:to-gray-800'
                  : key === '10_year' 
                    ? 'border-2 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-100 dark:shadow-amber-900/20 md:scale-105 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-900/20 dark:to-gray-800' 
                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {isUpgradePlan(key) && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] sm:text-xs px-2 sm:px-4 py-1 sm:py-1.5 rounded-br-lg font-bold flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  Upgrade
                </div>
              )}
              {key === '10_year' && !isUpgradePlan(key) && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs px-2 sm:px-4 py-1 sm:py-1.5 rounded-bl-lg font-bold">
                  Best Value
                </div>
              )}
              <CardHeader className="pb-2 sm:pb-3 pt-4 sm:pt-6 px-3 sm:px-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 text-base sm:text-lg md:text-xl">
                  <span className="font-bold text-gray-900 dark:text-white">{plan.name}</span>
                  <div className="flex flex-col items-end">
                    {isUpgradePlan(key) ? (
                      <>
                        <span className="text-sm text-gray-400 line-through">₹{plan.price}</span>
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">₹{getUpgradePrice(key)}</span>
                      </>
                    ) : (
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">₹{plan.price}</span>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm md:text-base mt-1 dark:text-gray-400">
                  {plan.duration ? `Valid for ${plan.duration / 365} years` : 'Never expires'}
                  {isUpgradePlan(key) && (
                    <span className="block text-green-600 font-medium mt-1">
                      Save ₹{currentPlanValue} with upgrade!
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 sm:pb-6 px-3 sm:px-6">
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />
                    </div>
                    All premium products access
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />
                    </div>
                    Exclusive tricks & guides
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />
                    </div>
                    Free products every month
                  </li>
                  {key !== '5_year' && (
                    <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />
                      </div>
                      Priority support
                    </li>
                  )}
                </ul>
                <Button 
                  className={`w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base font-semibold ${
                    key === '10_year' 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-lg shadow-amber-200' 
                      : isUpgradePlan(key)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        : ''
                  }`}
                  variant={key === '10_year' || isUpgradePlan(key) ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(key)}
                  disabled={pendingRequest || (isPremium && !isUpgradePlan(key))}
                >
                  {pendingRequest ? 'Request Pending' : 
                   isPremium && !isUpgradePlan(key) ? 'Current or Lower Plan' :
                   isUpgradePlan(key) ? (
                     <span className="flex items-center gap-1">
                       <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                       Upgrade - Pay ₹{getUpgradePrice(key)}
                     </span>
                   ) : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md mx-2 sm:mx-4 md:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              {isUpgrade ? (
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              ) : (
                <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              )}
              {isUpgrade ? 'Upgrade Premium' : 'Complete Payment'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm md:text-base">
              {isUpgrade ? (
                <span>
                  Upgrade to {selectedPlan ? PREMIUM_PLANS[selectedPlan].name : ''} Premium
                  <br />
                  <span className="text-green-600 font-semibold">
                    Pay only ₹{selectedPlan ? getUpgradePrice(selectedPlan) : 0} (₹{selectedPlan ? PREMIUM_PLANS[selectedPlan].price : 0} - ₹{currentPlanValue} current plan value)
                  </span>
                </span>
              ) : (
                `Pay ₹${selectedPlan ? PREMIUM_PLANS[selectedPlan].price : 0} to join ${selectedPlan ? PREMIUM_PLANS[selectedPlan].name : ''} Premium`
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* UPI Payment Section */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm sm:text-base">Pay via UPI</span>
              </div>
              
              {/* QR Code */}
              {settings?.qrCodeUrl && (
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-md">
                    <img 
                      src={settings.qrCodeUrl} 
                      alt="Payment QR Code" 
                      className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* UPI ID */}
              {settings?.upiId && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 border border-amber-200 dark:border-amber-700">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">UPI ID</p>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base">{settings.upiId}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(settings.upiId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast({ title: 'Copied!', description: 'UPI ID copied to clipboard' });
                    }}
                    className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />}
                  </button>
                </div>
              )}
              
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 text-center">
                Amount to Pay: <span className="font-bold text-lg">₹{selectedPlan ? (isUpgrade ? getUpgradePrice(selectedPlan) : PREMIUM_PLANS[selectedPlan].price) : 0}</span>
                {isUpgrade && selectedPlan && (
                  <span className="block text-green-600 text-[10px] mt-1">
                    (₹{PREMIUM_PLANS[selectedPlan].price} - ₹{currentPlanValue} current plan = ₹{getUpgradePrice(selectedPlan)})
                  </span>
                )}
              </p>
            </div>

            {/* Transaction ID - Optional */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Transaction ID / UTR Number <span className="text-gray-400 dark:text-gray-500 text-xs">(Optional)</span></Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID if available"
                className="mt-1"
              />
            </div>

            {/* Payment Screenshot - Required */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Payment Screenshot <span className="text-red-500">*</span></Label>
              <div className="mt-1">
                <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-all">
                  <div className="text-center">
                    {paymentProof ? (
                      <div className="flex flex-col items-center gap-2 text-green-600 dark:text-green-400">
                        <Check className="h-8 w-8" />
                        <span className="text-sm font-medium">{paymentProof.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Click to change</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-amber-400 dark:text-amber-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Click to upload screenshot</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-base font-semibold shadow-lg"
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !paymentProof}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Payment Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
