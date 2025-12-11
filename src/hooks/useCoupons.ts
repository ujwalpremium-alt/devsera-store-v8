import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Coupon {
  id: string;
  userId: string;
  code: string;
  discountAmount: number;
  pointsUsed: number;
  isUsed: boolean;
  usedAt?: string;
  orderId?: string;
  expiresAt?: string;
  createdAt: string;
}

const POINTS_PER_COUPON = 5000;
const COUPON_VALUE = 100;

export function useCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCoupons();
    }
  }, [user]);

  const loadCoupons = async () => {
    if (!isSupabaseConfigured || !user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCoupons(
        data.map((c) => ({
          id: c.id,
          userId: c.user_id,
          code: c.code,
          discountAmount: parseFloat(c.discount_amount),
          pointsUsed: c.points_used,
          isUsed: c.is_used,
          usedAt: c.used_at,
          orderId: c.order_id,
          expiresAt: c.expires_at,
          createdAt: c.created_at,
        }))
      );
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SAVE100-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const redeemPointsForCoupon = async () => {
    if (!user || !isSupabaseConfigured) {
      throw new Error('User not authenticated');
    }

    // Check user's points
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from('loyalty_points')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    if (loyaltyError) throw loyaltyError;

    if (!loyaltyData || loyaltyData.total_points < POINTS_PER_COUPON) {
      throw new Error(`You need at least ${POINTS_PER_COUPON} points to redeem a coupon`);
    }

    // Generate coupon
    const couponCode = generateCouponCode();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 months validity

    const { data: couponData, error: couponError } = await supabase
      .from('coupons')
      .insert({
        user_id: user.id,
        code: couponCode,
        discount_amount: COUPON_VALUE,
        points_used: POINTS_PER_COUPON,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (couponError) throw couponError;

    // Deduct points
    await supabase
      .from('loyalty_points')
      .update({
        total_points: loyaltyData.total_points - POINTS_PER_COUPON,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Add transaction record
    await supabase.from('point_transactions').insert({
      user_id: user.id,
      points: -POINTS_PER_COUPON,
      type: 'redeemed',
      description: `Redeemed ${POINTS_PER_COUPON} points for ₹${COUPON_VALUE} coupon`,
    });

    await loadCoupons();
    return couponData;
  };

  const validateCoupon = async (code: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Service not available');
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_used', false)
      .single();

    if (error || !data) {
      throw new Error('Invalid or expired coupon code');
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('This coupon has expired');
    }

    return {
      id: data.id,
      discountAmount: parseFloat(data.discount_amount),
    };
  };

  const useCoupon = async (couponId: string, orderId: string) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        order_id: orderId,
      })
      .eq('id', couponId);

    if (error) throw error;
    await loadCoupons();
  };

  const availableCoupons = coupons.filter(c => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt) > new Date()));

  return {
    coupons,
    availableCoupons,
    isLoading,
    redeemPointsForCoupon,
    validateCoupon,
    useCoupon,
    refetch: loadCoupons,
    POINTS_PER_COUPON,
    COUPON_VALUE,
  };
}
