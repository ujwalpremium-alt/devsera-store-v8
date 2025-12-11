import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift,
  Users,
  Coins,
  Crown,
  Trophy,
  Star,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface LoyaltyUser {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalPoints: number;
  lifetimePoints: number;
  tier: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalPointsAwarded: number;
}

export function RewardsManager() {
  const { toast } = useToast();
  const [loyaltyUsers, setLoyaltyUsers] = useState<LoyaltyUser[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalPointsAwarded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    bronzeUsers: 0,
    silverUsers: 0,
    goldUsers: 0,
    platinumUsers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      // Load loyalty users
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          profile:profiles(full_name, name, email)
        `)
        .order('lifetime_points', { ascending: false });

      if (loyaltyError) throw loyaltyError;

      const mappedUsers = loyaltyData.map((l) => ({
        id: l.id,
        userId: l.user_id,
        userName: l.profile?.full_name || l.profile?.name || l.profile?.email?.split('@')[0] || 'Unknown',
        userEmail: l.profile?.email || '',
        totalPoints: l.total_points,
        lifetimePoints: l.lifetime_points,
        tier: l.tier,
      }));

      setLoyaltyUsers(mappedUsers);

      // Calculate stats
      setTotalStats({
        totalUsers: mappedUsers.length,
        totalPoints: mappedUsers.reduce((sum, u) => sum + u.lifetimePoints, 0),
        bronzeUsers: mappedUsers.filter(u => u.tier === 'bronze').length,
        silverUsers: mappedUsers.filter(u => u.tier === 'silver').length,
        goldUsers: mappedUsers.filter(u => u.tier === 'gold').length,
        platinumUsers: mappedUsers.filter(u => u.tier === 'platinum').length,
      });

      // Load referral stats
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('*');

      if (referralError) throw referralError;

      const completed = referralData.filter(r => r.status === 'completed').length;
      setReferralStats({
        totalReferrals: referralData.length,
        completedReferrals: completed,
        pendingReferrals: referralData.filter(r => r.status === 'pending').length,
        totalPointsAwarded: completed * 150, // 100 for referrer + 50 for referred
      });
    } catch (err) {
      console.error('Error loading rewards data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    if (tier === 'platinum') return <Crown className="h-4 w-4 text-purple-500" />;
    if (tier === 'gold') return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (tier === 'silver') return <Star className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
    return <Star className="h-4 w-4 text-amber-600" />;
  };

  const getTierBadge = (tier: string) => {
    const styles = {
      bronze: 'bg-amber-100 text-amber-700',
      silver: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      gold: 'bg-yellow-100 text-yellow-700',
      platinum: 'bg-purple-100 text-purple-700',
    };
    return (
      <Badge className={`${styles[tier as keyof typeof styles]} capitalize`}>
        {getTierIcon(tier)}
        <span className="ml-1">{tier}</span>
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards & Referrals Management
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-2 border-black"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white">
            <Coins className="h-6 w-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{totalStats.totalPoints.toLocaleString()}</p>
            <p className="text-sm opacity-80">Total Points Earned</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-4 text-white">
            <Users className="h-6 w-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{totalStats.totalUsers}</p>
            <p className="text-sm opacity-80">Loyalty Members</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
            <TrendingUp className="h-6 w-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{referralStats.completedReferrals}</p>
            <p className="text-sm opacity-80">Successful Referrals</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white">
            <Gift className="h-6 w-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{referralStats.totalPointsAwarded.toLocaleString()}</p>
            <p className="text-sm opacity-80">Referral Points Given</p>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-center">
            <Star className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-700">{totalStats.bronzeUsers}</p>
            <p className="text-xs text-amber-600">Bronze</p>
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-center">
            <Star className="h-5 w-5 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{totalStats.silverUsers}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Silver</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center">
            <Trophy className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-yellow-700">{totalStats.goldUsers}</p>
            <p className="text-xs text-yellow-600">Gold</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
            <Crown className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-purple-700">{totalStats.platinumUsers}</p>
            <p className="text-xs text-purple-600">Platinum</p>
          </div>
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="border-2 border-black bg-white">
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white font-semibold"
            >
              <Users className="h-4 w-4 mr-1" />
              Top Members
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white font-semibold"
            >
              <Gift className="h-4 w-4 mr-1" />
              Referral Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading members...</p>
              </div>
            ) : loyaltyUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No loyalty members yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {loyaltyUsers.slice(0, 20).map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{user.userName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{user.lifetimePoints.toLocaleString()} pts</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Available: {user.totalPoints}</p>
                      </div>
                      {getTierBadge(user.tier)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="referrals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-blue-600">{referralStats.totalReferrals}</p>
                <p className="text-sm text-blue-700 mt-1">Total Referrals</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-green-600">{referralStats.completedReferrals}</p>
                <p className="text-sm text-green-700 mt-1">Completed</p>
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-amber-600">{referralStats.pendingReferrals}</p>
                <p className="text-sm text-amber-700 mt-1">Pending</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold mb-2">Referral Program Details</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Referrer earns <span className="font-semibold text-purple-600">100 points</span> when friend makes first purchase</li>
                <li>• Referred user gets <span className="font-semibold text-pink-600">50 bonus points</span></li>
                <li>• No limit on number of referrals</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
