import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLoyalty, TIER_THRESHOLDS, TIER_BENEFITS } from '@/hooks/useLoyalty';
import { useReferral } from '@/hooks/useReferral';
import { useNotifications } from '@/hooks/useNotifications';
import { useCoupons } from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Gift,
  Star,
  Users,
  Copy,
  Check,
  Crown,
  Sparkles,
  TrendingUp,
  Bell,
  Mail,
  Smartphone,
  ArrowRight,
  Trophy,
  Coins,
  Share2,
  Clock,
  Ticket,
} from 'lucide-react';

export function RewardsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { loyalty, transactions, isLoading: loyaltyLoading, getNextTier, refetch: refetchLoyalty } = useLoyalty();
  const { 
    referralCode, 
    referrals, 
    stats: referralStats, 
    isLoading: referralLoading,
    copyReferralLink,
    applyReferralCode,
    REFERRAL_REWARD_POINTS,
    REFERRED_BONUS_POINTS,
  } = useReferral();
  const {
    availableCoupons,
    redeemPointsForCoupon,
    POINTS_PER_COUPON,
    COUPON_VALUE,
  } = useCoupons();
  const {
    preferences,
    pushSupported,
    pushEnabled,
    updatePreferences,
    requestPushPermission,
  } = useNotifications();

  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemCoupon = async () => {
    if ((loyalty?.totalPoints || 0) < POINTS_PER_COUPON) {
      toast({
        title: 'Insufficient points',
        description: `You need ${POINTS_PER_COUPON} points to redeem a coupon`,
        variant: 'destructive',
      });
      return;
    }

    setIsRedeeming(true);
    try {
      await redeemPointsForCoupon();
      await refetchLoyalty();
      toast({
        title: 'Coupon created!',
        description: `You've redeemed ${POINTS_PER_COUPON} points for a ₹${COUPON_VALUE} discount coupon`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Apply pending referral code from registration
  useEffect(() => {
    const pendingCode = localStorage.getItem('pendingReferralCode');
    if (pendingCode && user) {
      setReferralInput(pendingCode);
      localStorage.removeItem('pendingReferralCode');
      // Auto-apply the code
      handleApplyCodeAuto(pendingCode);
    }
  }, [user]);

  const handleApplyCodeAuto = async (code: string) => {
    try {
      await applyReferralCode(code);
      toast({
        title: 'Referral code applied!',
        description: `You'll receive ${REFERRED_BONUS_POINTS} bonus points after your first purchase.`,
      });
      setReferralInput('');
    } catch (error: any) {
      // Silently fail for auto-apply
      console.log('Auto-apply referral failed:', error.message);
    }
  };

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      toast({ title: 'Referral code copied!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const link = copyReferralLink();
    if (link) {
      toast({ title: 'Referral link copied!' });
    }
  };

  const handleApplyCode = async () => {
    if (!referralInput.trim()) return;
    
    setIsApplying(true);
    try {
      await applyReferralCode(referralInput);
      toast({
        title: 'Referral code applied!',
        description: `You'll receive ${REFERRED_BONUS_POINTS} bonus points after your first purchase.`,
      });
      setReferralInput('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      const granted = await requestPushPermission();
      if (granted) {
        toast({ title: 'Push notifications enabled!' });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not enable push notifications',
        variant: 'destructive',
      });
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-gray-400 to-gray-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getTierIcon = (tier: string) => {
    if (tier === 'platinum') return <Crown className="h-6 w-6" />;
    if (tier === 'gold') return <Trophy className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const nextTier = getNextTier();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center pb-20 md:pb-0">
        <Card className="max-w-md w-full mx-4 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <Gift className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please login to access rewards and referrals</p>
            <Button onClick={() => navigate('/login')} className="rounded-xl">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Gift className="h-4 w-4" />
            Rewards & Referrals
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Earn Rewards, Share & Save
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Earn points on every purchase and get exclusive discounts
          </p>
        </div>

        {/* Loyalty Card */}
        <Card className={`mb-8 border-0 shadow-xl overflow-hidden bg-gradient-to-br ${getTierColor(loyalty?.tier || 'bronze')} text-white`}>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    {getTierIcon(loyalty?.tier || 'bronze')}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Your Tier</p>
                    <p className="text-2xl font-bold capitalize">{loyalty?.tier || 'Bronze'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-white/80 text-sm">Available Points</p>
                    <p className="text-3xl font-bold">{loyalty?.totalPoints || 0}</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Lifetime Points</p>
                    <p className="text-xl font-semibold">{loyalty?.lifetimePoints || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white/80 text-sm mb-2">Your Benefits</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>{TIER_BENEFITS[loyalty?.tier || 'bronze'].discount}% discount on orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{TIER_BENEFITS[loyalty?.tier || 'bronze'].pointsMultiplier}x points multiplier</span>
                  </div>
                </div>
              </div>
            </div>

            {nextTier && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Progress to {nextTier.tier}</span>
                  <span className="text-sm font-semibold">{nextTier.pointsNeeded} points to go</span>
                </div>
                <Progress 
                  value={((loyalty?.lifetimePoints || 0) / TIER_THRESHOLDS[nextTier.tier as keyof typeof TIER_THRESHOLDS]) * 100} 
                  className="h-2 bg-white/20"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="referral" className="space-y-6">
          <TabsList className="bg-white border-2 border-gray-200 h-auto p-1.5 rounded-xl w-full grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger
              value="referral"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <Share2 className="h-4 w-4 mr-1 md:mr-1.5" />
              Referrals
            </TabsTrigger>
            <TabsTrigger
              value="coupons"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <Ticket className="h-4 w-4 mr-1 md:mr-1.5" />
              Coupons
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <Clock className="h-4 w-4 mr-1 md:mr-1.5" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <Bell className="h-4 w-4 mr-1 md:mr-1.5" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Referral Tab */}
          <TabsContent value="referral" className="space-y-6">
            {/* Referral Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{referralStats.totalReferrals}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Referrals</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 text-center">
                  <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{referralStats.completedReferrals}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{referralStats.pendingReferrals}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 text-center">
                  <Coins className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{referralStats.totalEarned}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Points Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Your Referral Code */}
            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  Your Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border-2 border-purple-200 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-purple-600 tracking-wider">
                      {referralCode?.code || '------'}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 rounded-xl h-14"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Referral Link
                </Button>
                <div className="bg-white rounded-xl p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Share your code and earn <span className="font-bold text-purple-600">{REFERRAL_REWARD_POINTS} points</span> when your friend makes their first purchase!
                    <br />
                    Your friend gets <span className="font-bold text-pink-600">{REFERRED_BONUS_POINTS} bonus points</span> too!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Apply Referral Code */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Have a Referral Code?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter referral code"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                    className="border-2 rounded-xl uppercase"
                  />
                  <Button
                    onClick={handleApplyCode}
                    disabled={isApplying || !referralInput.trim()}
                    className="rounded-xl"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Referral List */}
            {referrals.length > 0 && (
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Your Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referrals.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{ref.referredName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            ref.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }
                        >
                          {ref.status === 'completed' ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              +{REFERRAL_REWARD_POINTS} pts
                            </>
                          ) : (
                            'Pending'
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6">
            {/* Redeem Points Card */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Ticket className="h-5 w-5" />
                  Redeem Points for Coupons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-green-700 mb-2">
                      Convert <span className="font-bold">{POINTS_PER_COUPON} points</span> into a <span className="font-bold">₹{COUPON_VALUE} discount coupon</span>
                    </p>
                    <p className="text-sm text-green-600">
                      Your available points: <span className="font-bold">{loyalty?.totalPoints || 0}</span>
                    </p>
                  </div>
                  <Button
                    onClick={handleRedeemCoupon}
                    disabled={isRedeeming || (loyalty?.totalPoints || 0) < POINTS_PER_COUPON}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl w-full md:w-auto"
                  >
                    {isRedeeming ? 'Redeeming...' : (
                      <>
                        <Gift className="h-4 w-4 mr-2" />
                        Redeem Coupon
                      </>
                    )}
                  </Button>
                </div>
                {(loyalty?.totalPoints || 0) < POINTS_PER_COUPON && (
                  <p className="text-sm text-amber-600 mt-3">
                    You need {POINTS_PER_COUPON - (loyalty?.totalPoints || 0)} more points to redeem a coupon
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Available Coupons */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Your Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                {availableCoupons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No coupons available</p>
                    <p className="text-sm">Redeem your points to get discount coupons!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 border-dashed rounded-xl gap-3"
                      >
                        <div>
                          <p className="text-2xl font-bold text-green-600 tracking-wider">{coupon.code}</p>
                          <p className="text-sm text-green-700">₹{coupon.discountAmount} off on your next order</p>
                          {coupon.expiresAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast({ title: 'Coupon code copied!' });
                          }}
                          className="border-2 border-green-500 text-green-600 rounded-xl"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Code
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points History Tab */}
          <TabsContent value="history">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Points History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Coins className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No transactions yet</p>
                    <p className="text-sm">Make a purchase to start earning points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.points > 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}
                          >
                            {tx.points > 0 ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowRight className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{tx.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-bold text-lg ${
                            tx.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Push Notifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push Notifications
                  </h3>
                  {pushSupported ? (
                    <>
                      {!pushEnabled ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-700 mb-3">
                            Enable push notifications to get instant updates about your orders
                          </p>
                          <Button onClick={handleEnablePush} className="rounded-xl">
                            <Bell className="h-4 w-4 mr-2" />
                            Enable Push Notifications
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium">Order Updates</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about order status changes</p>
                            </div>
                            <Switch
                              checked={preferences.pushOrderUpdates}
                              onCheckedChange={(checked) =>
                                updatePreferences({ pushOrderUpdates: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-medium">Promotions</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Receive special offers and deals</p>
                            </div>
                            <Switch
                              checked={preferences.pushPromotions}
                              onCheckedChange={(checked) =>
                                updatePreferences({ pushPromotions: checked })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Push notifications are not supported in your browser
                      </p>
                    </div>
                  )}
                </div>

                {/* Email Notifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive emails about your orders</p>
                      </div>
                      <Switch
                        checked={preferences.emailOrderUpdates}
                        onCheckedChange={(checked) =>
                          updatePreferences({ emailOrderUpdates: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">Promotions & Offers</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about deals and discounts</p>
                      </div>
                      <Switch
                        checked={preferences.emailPromotions}
                        onCheckedChange={(checked) =>
                          updatePreferences({ emailPromotions: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="mt-8 border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-center">How Rewards Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-purple-600">1</span>
                </div>
                <h3 className="font-semibold mb-1">Shop</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Earn 10 points for every ₹100 spent</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-pink-600">2</span>
                </div>
                <h3 className="font-semibold mb-1">Refer</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Earn {REFERRAL_REWARD_POINTS} points per referral</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-amber-600">3</span>
                </div>
                <h3 className="font-semibold mb-1">Level Up</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Unlock higher tiers for better rewards</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-green-600">4</span>
                </div>
                <h3 className="font-semibold mb-1">Redeem</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use points for discounts on orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
