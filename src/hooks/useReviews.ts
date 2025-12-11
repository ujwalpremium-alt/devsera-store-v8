import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  userId: string;
  productId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
}

export function useReviews(productId?: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  const loadReviews = async () => {
    if (!isSupabaseConfigured || !productId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(
        data.map((r) => ({
          id: r.id,
          userId: r.user_id,
          productId: r.product_id,
          userName: r.profile?.name || 'Anonymous',
          userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.profile?.name}`,
          rating: r.rating,
          comment: r.comment,
          verified: r.verified,
          createdAt: r.created_at,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createReview = async (rating: number, comment: string) => {
    if (!user) throw new Error('User not authenticated');
    if (!productId) throw new Error('Product ID required');

    if (!isSupabaseConfigured) {
      const newReview: Review = {
        id: `REVIEW-${Date.now()}`,
        userId: user.id,
        productId,
        userName: user.name,
        userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        rating,
        comment,
        verified: false,
        createdAt: new Date().toISOString(),
      };
      setReviews([newReview, ...reviews]);
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: productId,
        rating,
        comment,
      });

    if (error) throw error;
    await loadReviews();
  };

  const deleteReview = async (reviewId: string) => {
    if (!isSupabaseConfigured) {
      setReviews(reviews.filter(r => r.id !== reviewId));
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    await loadReviews();
  };

  return { reviews, isLoading, error, refetch: loadReviews, createReview, deleteReview };
}

export function useAllReviews() {
  const [reviews, setReviews] = useState<(Review & { productName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles(name, email),
          product:products(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(
        data.map((r) => ({
          id: r.id,
          userId: r.user_id,
          productId: r.product_id,
          productName: r.product?.name,
          userName: r.profile?.name || 'Anonymous',
          userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.profile?.name}`,
          rating: r.rating,
          comment: r.comment,
          verified: r.verified,
          createdAt: r.created_at,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!isSupabaseConfigured) {
      setReviews(reviews.filter(r => r.id !== reviewId));
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    await loadAllReviews();
  };

  const verifyReview = async (reviewId: string, verified: boolean) => {
    if (!isSupabaseConfigured) {
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, verified } : r));
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .update({ verified })
      .eq('id', reviewId);

    if (error) throw error;
    await loadAllReviews();
  };

  return { reviews, isLoading, error, refetch: loadAllReviews, deleteReview, verifyReview };
}
