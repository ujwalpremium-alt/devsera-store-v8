import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PremiumMembership, PremiumProduct, PremiumContent } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const PREMIUM_PLANS = {
  '5_year': { name: '5 Years', price: 500, duration: 5 * 365 },
  '10_year': { name: '10 Years', price: 800, duration: 10 * 365 },
  'lifetime': { name: 'Lifetime', price: 1500, duration: null },
} as const;

export function usePremium() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<PremiumMembership | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PremiumMembership[]>([]);
  const [allMemberships, setAllMemberships] = useState<PremiumMembership[]>([]);
  const [premiumProducts, setPremiumProducts] = useState<PremiumProduct[]>([]);
  const [premiumContent, setPremiumContent] = useState<PremiumContent[]>([]);

  const fetchMembership = useCallback(async () => {
    if (!user) {
      setMembership(null);
      setIsPremium(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('premium_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching membership:', error);
      }

      setMembership(data);
      setIsPremium(!!data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPendingRequest = useCallback(async () => {
    if (!user) return null;

    const { data } = await supabase
      .from('premium_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  }, [user]);

  const fetchAllMemberships = useCallback(async () => {
    const { data, error } = await supabase
      .from('premium_memberships')
      .select('*, profiles:user_id(id, email, name, full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all memberships:', error);
      return;
    }

    setAllMemberships(data || []);
    setPendingRequests(data?.filter(m => m.status === 'pending') || []);
  }, []);

  const fetchPremiumProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('premium_products')
      .select('*, products(*)');

    if (error) {
      console.error('Error fetching premium products:', error);
      return;
    }

    setPremiumProducts(data || []);
  }, []);

  const fetchPremiumContent = useCallback(async () => {
    const { data, error } = await supabase
      .from('premium_content')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching premium content:', error);
      return;
    }

    setPremiumContent(data || []);
  }, []);

  const requestPremium = async (
    planType: 'lifetime' | '5_year' | '10_year',
    paymentMethod: string,
    transactionId: string,
    paymentProofUrl?: string
  ) => {
    if (!user) throw new Error('Must be logged in');

    const plan = PREMIUM_PLANS[planType];
    
    const { data, error } = await supabase
      .from('premium_memberships')
      .insert({
        user_id: user.id,
        plan_type: planType,
        price_paid: plan.price,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        payment_proof_url: paymentProofUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const approveMembership = async (membershipId: string, adminId: string) => {
    const membership = allMemberships.find(m => m.id === membershipId);
    if (!membership) throw new Error('Membership not found');

    const plan = PREMIUM_PLANS[membership.plan_type];
    const expiresAt = plan.duration 
      ? new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('premium_memberships')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminId,
        expires_at: expiresAt,
      })
      .eq('id', membershipId);

    if (error) throw error;
    await fetchAllMemberships();
  };

  const rejectMembership = async (membershipId: string, reason: string) => {
    const { error } = await supabase
      .from('premium_memberships')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', membershipId);

    if (error) throw error;
    await fetchAllMemberships();
  };

  const revokeMembership = async (membershipId: string, reason: string) => {
    const { error } = await supabase
      .from('premium_memberships')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoke_reason: reason,
      })
      .eq('id', membershipId);

    if (error) throw error;
    await fetchAllMemberships();
  };

  const deleteMembership = async (membershipId: string) => {
    const { error } = await supabase
      .from('premium_memberships')
      .delete()
      .eq('id', membershipId);

    if (error) throw error;
    await fetchAllMemberships();
  };

  const extendMembership = async (membershipId: string, additionalDays: number) => {
    const membership = allMemberships.find(m => m.id === membershipId);
    if (!membership) throw new Error('Membership not found');

    let newExpiresAt: string | null = null;
    if (membership.expires_at) {
      const currentExpiry = new Date(membership.expires_at);
      currentExpiry.setDate(currentExpiry.getDate() + additionalDays);
      newExpiresAt = currentExpiry.toISOString();
    } else if (additionalDays > 0) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + additionalDays);
      newExpiresAt = newExpiry.toISOString();
    }

    const { error } = await supabase
      .from('premium_memberships')
      .update({
        expires_at: newExpiresAt,
      })
      .eq('id', membershipId);

    if (error) throw error;
    await fetchAllMemberships();
  };

  const addPremiumProduct = async (
    productId: string,
    isFreeForPremium: boolean,
    premiumDiscountPercent: number,
    premiumOnly: boolean
  ) => {
    const { error } = await supabase
      .from('premium_products')
      .upsert({
        product_id: productId,
        is_free_for_premium: isFreeForPremium,
        premium_discount_percent: premiumDiscountPercent,
        premium_only: premiumOnly,
      });

    if (error) throw error;
    await fetchPremiumProducts();
  };

  const removePremiumProduct = async (premiumProductId: string) => {
    const { error } = await supabase
      .from('premium_products')
      .delete()
      .eq('id', premiumProductId);

    if (error) throw error;
    await fetchPremiumProducts();
  };

  const addPremiumContent = async (content: Omit<PremiumContent, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase
      .from('premium_content')
      .insert(content);

    if (error) throw error;
    await fetchPremiumContent();
  };

  const updatePremiumContent = async (contentId: string, updates: Partial<PremiumContent>) => {
    const { error } = await supabase
      .from('premium_content')
      .update(updates)
      .eq('id', contentId);

    if (error) throw error;
    await fetchPremiumContent();
  };

  const deletePremiumContent = async (contentId: string) => {
    const { error } = await supabase
      .from('premium_content')
      .delete()
      .eq('id', contentId);

    if (error) throw error;
    await fetchPremiumContent();
  };

  const checkCouponUsage = async (couponContentId: string, productId: string) => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('premium_coupon_usage')
      .select('id')
      .eq('user_id', user.id)
      .eq('coupon_content_id', couponContentId)
      .eq('product_id', productId)
      .single();
    
    return !!data;
  };

  const markCouponUsed = async (couponContentId: string, productId: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const { error } = await supabase
      .from('premium_coupon_usage')
      .insert({
        user_id: user.id,
        coupon_content_id: couponContentId,
        product_id: productId,
      });
    
    if (error && error.code !== '23505') throw error; // Ignore duplicate key error
  };

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return {
    membership,
    isPremium,
    loading,
    pendingRequests,
    allMemberships,
    premiumProducts,
    premiumContent,
    fetchMembership,
    fetchPendingRequest,
    fetchAllMemberships,
    fetchPremiumProducts,
    fetchPremiumContent,
    requestPremium,
    approveMembership,
    rejectMembership,
    revokeMembership,
    deleteMembership,
    extendMembership,
    addPremiumProduct,
    removePremiumProduct,
    addPremiumContent,
    updatePremiumContent,
    deletePremiumContent,
    checkCouponUsage,
    markCouponUsed,
    PREMIUM_PLANS,
  };
}
