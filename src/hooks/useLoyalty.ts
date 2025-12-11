import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface LoyaltyPoints {
  id: string;
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'bonus' | 'referral';
  description: string;
  orderId?: string;
  createdAt: string;
}

export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 5000,
};

export const TIER_BENEFITS = {
  bronze: { discount: 0, pointsMultiplier: 1 },
  silver: { discount: 5, pointsMultiplier: 1.25 },
  gold: { discount: 10, pointsMultiplier: 1.5 },
  platinum: { discount: 15, pointsMultiplier: 2 },
};

export function useLoyalty() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!isSupabaseConfigured || !user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get or create loyalty record
      let { data: loyaltyData, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create new loyalty record
        const { data: newData, error: createError } = await supabase
          .from('loyalty_points')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        loyaltyData = newData;
      } else if (error) {
        throw error;
      }

      if (loyaltyData) {
        setLoyalty({
          id: loyaltyData.id,
          userId: loyaltyData.user_id,
          totalPoints: loyaltyData.total_points,
          lifetimePoints: loyaltyData.lifetime_points,
          tier: loyaltyData.tier,
        });
      }

      // Load transactions
      const { data: txData, error: txError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) throw txError;

      setTransactions(
        txData.map((t) => ({
          id: t.id,
          userId: t.user_id,
          points: t.points,
          type: t.type,
          description: t.description,
          orderId: t.order_id,
          createdAt: t.created_at,
        }))
      );
    } catch (err) {
      console.error('Error loading loyalty data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addPoints = async (points: number, type: string, description: string, orderId?: string) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      // Add transaction
      await supabase.from('point_transactions').insert({
        user_id: user.id,
        points,
        type,
        description,
        order_id: orderId || null,
      });

      // Update total points
      const newTotal = (loyalty?.totalPoints || 0) + points;
      const newLifetime = (loyalty?.lifetimePoints || 0) + (points > 0 ? points : 0);
      
      // Calculate new tier
      let newTier = 'bronze';
      if (newLifetime >= TIER_THRESHOLDS.platinum) newTier = 'platinum';
      else if (newLifetime >= TIER_THRESHOLDS.gold) newTier = 'gold';
      else if (newLifetime >= TIER_THRESHOLDS.silver) newTier = 'silver';

      await supabase
        .from('loyalty_points')
        .update({
          total_points: newTotal,
          lifetime_points: newLifetime,
          tier: newTier,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      await loadLoyaltyData();
    } catch (err) {
      console.error('Error adding points:', err);
      throw err;
    }
  };

  const redeemPoints = async (points: number) => {
    if (!user || !loyalty || loyalty.totalPoints < points) {
      throw new Error('Insufficient points');
    }

    await addPoints(-points, 'redeemed', `Redeemed ${points} points`);
  };

  const getNextTier = () => {
    if (!loyalty) return null;
    const tiers = ['bronze', 'silver', 'gold', 'platinum'] as const;
    const currentIndex = tiers.indexOf(loyalty.tier);
    if (currentIndex >= tiers.length - 1) return null;
    const nextTier = tiers[currentIndex + 1];
    return {
      tier: nextTier,
      pointsNeeded: TIER_THRESHOLDS[nextTier] - loyalty.lifetimePoints,
    };
  };

  return {
    loyalty,
    transactions,
    isLoading,
    addPoints,
    redeemPoints,
    getNextTier,
    refetch: loadLoyaltyData,
  };
}
