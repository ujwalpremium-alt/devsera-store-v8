import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  uses: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: 'pending' | 'completed';
  rewardGiven: boolean;
  createdAt: string;
  referredName?: string;
}

const REFERRAL_REWARD_POINTS = 100;
const REFERRED_BONUS_POINTS = 50;

export function useReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0,
  });

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const generateCode = (userId: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `REF${code}`;
  };

  const loadReferralData = async () => {
    if (!isSupabaseConfigured || !user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get or create referral code
      let { data: codeData, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create new referral code
        const newCode = generateCode(user.id);
        const { data: newData, error: createError } = await supabase
          .from('referral_codes')
          .insert({ user_id: user.id, code: newCode })
          .select()
          .single();

        if (createError) throw createError;
        codeData = newData;
      } else if (error) {
        throw error;
      }

      if (codeData) {
        setReferralCode({
          id: codeData.id,
          userId: codeData.user_id,
          code: codeData.code,
          uses: codeData.uses,
          createdAt: codeData.created_at,
        });
      }

      // Load referrals
      const { data: refData, error: refError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:profiles!referrals_referred_id_fkey(full_name, name, email)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (refError) throw refError;

      const mappedReferrals = refData.map((r) => ({
        id: r.id,
        referrerId: r.referrer_id,
        referredId: r.referred_id,
        referralCode: r.referral_code,
        status: r.status,
        rewardGiven: r.reward_given,
        createdAt: r.created_at,
        referredName: r.referred?.full_name || r.referred?.name || r.referred?.email?.split('@')[0] || 'Unknown',
      }));

      setReferrals(mappedReferrals);

      // Calculate stats
      const completed = mappedReferrals.filter(r => r.status === 'completed').length;
      setStats({
        totalReferrals: mappedReferrals.length,
        completedReferrals: completed,
        pendingReferrals: mappedReferrals.filter(r => r.status === 'pending').length,
        totalEarned: completed * REFERRAL_REWARD_POINTS,
      });
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!user || !isSupabaseConfigured) {
      throw new Error('User not authenticated');
    }

    // Check if code exists
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (codeError || !codeData) {
      throw new Error('Invalid referral code');
    }

    // Can't use own code
    if (codeData.user_id === user.id) {
      throw new Error('Cannot use your own referral code');
    }

    // Check if already referred
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', user.id)
      .single();

    if (existingRef) {
      throw new Error('You have already used a referral code');
    }

    // Create referral
    const { error: refError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: codeData.user_id,
        referred_id: user.id,
        referral_code: code.toUpperCase(),
        status: 'pending',
      });

    if (refError) throw refError;

    // Update code uses
    await supabase
      .from('referral_codes')
      .update({ uses: codeData.uses + 1 })
      .eq('id', codeData.id);

    return { referrerId: codeData.user_id, bonusPoints: REFERRED_BONUS_POINTS };
  };

  const completeReferral = async (referredUserId: string) => {
    if (!isSupabaseConfigured) return;

    // Find the referral
    const { data: refData, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', referredUserId)
      .eq('status', 'pending')
      .single();

    if (error || !refData) return;

    // Update referral status
    await supabase
      .from('referrals')
      .update({ status: 'completed', reward_given: true })
      .eq('id', refData.id);

    // Add points to referrer
    await supabase.from('point_transactions').insert({
      user_id: refData.referrer_id,
      points: REFERRAL_REWARD_POINTS,
      type: 'referral',
      description: 'Referral bonus - friend made first purchase',
    });

    // Update referrer's total points
    const { data: loyaltyData } = await supabase
      .from('loyalty_points')
      .select('total_points, lifetime_points')
      .eq('user_id', refData.referrer_id)
      .single();

    if (loyaltyData) {
      await supabase
        .from('loyalty_points')
        .update({
          total_points: loyaltyData.total_points + REFERRAL_REWARD_POINTS,
          lifetime_points: loyaltyData.lifetime_points + REFERRAL_REWARD_POINTS,
        })
        .eq('user_id', refData.referrer_id);
    }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/register?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    return link;
  };

  return {
    referralCode,
    referrals,
    stats,
    isLoading,
    applyReferralCode,
    completeReferral,
    copyReferralLink,
    refetch: loadReferralData,
    REFERRAL_REWARD_POINTS,
    REFERRED_BONUS_POINTS,
  };
}
