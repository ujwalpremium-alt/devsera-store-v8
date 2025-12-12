import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLoyalty, TIER_BENEFITS } from '@/hooks/useLoyalty';
import { useReferral } from '@/hooks/useReferral';
import { useOrders } from '@/hooks/useOrders';
import { useNotifications } from '@/hooks/useNotifications';
import { useCoupons } from '@/hooks/useCoupons';
import { usePremium } from '@/hooks/usePremium';
import { PremiumBadge, PremiumPendingBadge } from '@/components/shared/PremiumBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  User,
  Mail,
  Phone,
  Gift,
  Star,
  Crown,
  Trophy,
  Coins,
  ShoppingBag,
  Settings,
  Bell,
  Share2,
  Copy,
  Check,
  Edit,
  Save,
  Ticket,
  TrendingUp,
  Calendar,
  Package,
  Shield,
  LayoutDashboard,
  Heart,
} from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { loyalty, transactions, getNextTier } = useLoyalty();
  const { referralCode, stats: referralStats, copyReferralLink, REFERRAL_REWARD_POINTS } = useReferral();
  const { orders } = useOrders();
  const { preferences, updatePreferences, pushSupported, pushEnabled, requestPushPermission } = useNotifications();
  const { availableCoupons, POINTS_PER_COUPON } = useCoupons();
  const { isPremium, membership, fetchPendingRequest } = usePremium();
  const { wishlist } = useWishlist();
  const [pendingPremium, setPendingPremium] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: '',
      });
      loadPhone();
      // Check for pending premium request
      const checkPending = async () => {
        const pending = await fetchPendingRequest();
        setPendingPremium(pending);
      };
      checkPending();
    }
  }, [user, fetchPendingRequest]);

  const loadPhone = async () => {
    if (!user || !isSupabaseConfigured) return;
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();
    if (data?.phone) {
      setProfileData(prev => ({ ...prev, phone: data.phone }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !isSupabaseConfigured) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.name,
          name: profileData.name,
          phone: profileData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
    if (tier === 'platinum') return <Crown className="h-5 w-5" />;
    if (tier === 'gold') return <Trophy className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'SUBMITTED').length;
  const nextTier = getNextTier();

  // Calculate redeemable coupons (5000 points = ₹100 off)
  const redeemableCoupons = Math.floor((loyalty?.totalPoints || 0) / 5000);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 pb-20 md:pb-0">
        <Card className="max-w-md w-full dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <User className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please login to view your profile</p>
            <Button onClick={() => navigate('/login')} className="rounded-xl w-full">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6 border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className={`h-24 md:h-32 bg-gradient-to-r ${getTierColor(loyalty?.tier || 'bronze')}`}></div>
          <CardContent className="relative px-4 md:px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                <AvatarFallback className="text-2xl md:text-4xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                  {user.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPremium && membership && (
                      <PremiumBadge size="md" expiresAt={membership.expires_at} />
                    )}
                    {!isPremium && pendingPremium && (
                      <PremiumPendingBadge />
                    )}
                    <Badge className={`bg-gradient-to-r ${getTierColor(loyalty?.tier || 'bronze')} text-white capitalize`}>
                      {getTierIcon(loyalty?.tier || 'bronze')}
                      <span className="ml-1">{loyalty?.tier || 'Bronze'} Member</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Dashboard Link - Only for Admins */}
        {user.role === 'admin' && (
          <Card className="mb-6 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                      Admin Access
                      <Badge className="bg-purple-600 text-white text-xs">{user.admin_role || 'Admin'}</Badge>
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Manage products, orders, customers and more</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/admin')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl w-full md:w-auto shadow-lg"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Go to Admin Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <Card className="border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-3 md:p-4 text-center">
              <Coins className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mx-auto mb-1 md:mb-2" />
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{loyalty?.totalPoints || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-3 md:p-4 text-center">
              <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-teal-500 mx-auto mb-1 md:mb-2" />
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{completedOrders}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
            </CardContent>
          </Card>
          <Card 
            className="border-2 border-pink-100 dark:border-pink-900/50 dark:bg-gray-800 cursor-pointer hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
            onClick={() => navigate('/wishlist')}
          >
            <CardContent className="p-3 md:p-4 text-center">
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-pink-500 mx-auto mb-1 md:mb-2" />
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{wishlist.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Wishlist</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-3 md:p-4 text-center">
              <Share2 className="h-6 w-6 md:h-8 md:w-8 text-purple-500 mx-auto mb-1 md:mb-2" />
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{referralStats.completedReferrals}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Referrals</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-3 md:p-4 text-center">
              <Gift className="h-6 w-6 md:h-8 md:w-8 text-pink-500 mx-auto mb-1 md:mb-2" />
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{redeemableCoupons}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Coupons</p>
            </CardContent>
          </Card>
        </div>

        {/* Redeemable Coupons Alert */}
        {redeemableCoupons > 0 && (
          <Card className="mb-6 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Gift className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-300">You have {redeemableCoupons} coupon{redeemableCoupons > 1 ? 's' : ''} available!</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Each coupon gives ₹100 off on your next order</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/rewards')}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl w-full md:w-auto"
                >
                  Redeem Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier Progress */}
        {nextTier && (
          <Card className="mb-6 border-2 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress to {nextTier.tier}</span>
                <span className="text-sm font-semibold text-purple-600">{nextTier.pointsNeeded} points to go</span>
              </div>
              <Progress 
                value={((loyalty?.lifetimePoints || 0) / (loyalty?.lifetimePoints || 0 + nextTier.pointsNeeded)) * 100} 
                className="h-2"
              />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 h-auto p-1 flex-wrap rounded-xl w-full grid grid-cols-4">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <User className="h-4 w-4 mr-1 hidden md:block" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <ShoppingBag className="h-4 w-4 mr-1 hidden md:block" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <Gift className="h-4 w-4 mr-1 hidden md:block" />
              Rewards
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white font-semibold rounded-lg text-xs md:text-sm"
            >
              <Settings className="h-4 w-4 mr-1 hidden md:block" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-2 border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="mt-1 border-2 rounded-xl"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{user.name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Email Address</Label>
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="mt-1 border-2 rounded-xl"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profileData.phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400">Member Since</Label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
                    <Button onClick={() => navigate('/')} variant="outline" className="mt-4 rounded-xl">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {orders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-800 gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm md:text-base">{order.product?.name || 'Product'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-3">
                          <Badge
                            className={
                              order.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }
                          >
                            {order.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/orders')}
                            className="text-teal-600"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {orders.length > 0 && (
                  <Button
                    onClick={() => navigate('/orders')}
                    variant="outline"
                    className="w-full mt-4 rounded-xl"
                  >
                    View All Orders
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <div className="space-y-4">
              {/* Points Card */}
              <Card className={`border-0 bg-gradient-to-br ${getTierColor(loyalty?.tier || 'bronze')} text-white`}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-white/80 text-sm">Available Points</p>
                      <p className="text-3xl md:text-4xl font-bold">{loyalty?.totalPoints || 0}</p>
                      <p className="text-white/80 text-sm mt-1">
                        = ₹{Math.floor((loyalty?.totalPoints || 0) / 50)} value
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 md:p-4">
                      <p className="text-white/80 text-xs">Tier Benefits</p>
                      <p className="font-semibold">{TIER_BENEFITS[loyalty?.tier || 'bronze'].discount}% discount</p>
                      <p className="text-sm">{TIER_BENEFITS[loyalty?.tier || 'bronze'].pointsMultiplier}x points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral Code */}
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-purple-800">Your Referral Code</p>
                      <p className="text-2xl font-bold text-purple-600 tracking-wider">
                        {referralCode?.code || '------'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyCode}
                        variant="outline"
                        className="border-2 border-purple-500 text-purple-600 rounded-xl flex-1 md:flex-none"
                      >
                        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy
                      </Button>
                      <Button
                        onClick={() => copyReferralLink()}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex-1 md:flex-none"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 mt-2">
                    Earn {REFERRAL_REWARD_POINTS} points for each friend who makes a purchase!
                  </p>
                </CardContent>
              </Card>

              <Button
                onClick={() => navigate('/rewards')}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                View Full Rewards Dashboard
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pushSupported && !pushEnabled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-700 mb-2">Enable push notifications for instant updates</p>
                    <Button onClick={requestPushPermission} size="sm" className="rounded-xl">
                      <Bell className="h-4 w-4 mr-1" />
                      Enable
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-medium text-sm md:text-base">Order Updates</p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Get notified about order status</p>
                  </div>
                  <Switch
                    checked={preferences.emailOrderUpdates}
                    onCheckedChange={(checked) => updatePreferences({ emailOrderUpdates: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-medium text-sm md:text-base">Promotions</p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Receive special offers</p>
                  </div>
                  <Switch
                    checked={preferences.emailPromotions}
                    onCheckedChange={(checked) => updatePreferences({ emailPromotions: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate('/support')}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Support Tickets
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate('/contact')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
