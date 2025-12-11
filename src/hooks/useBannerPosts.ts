import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface BannerPost {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  button_text: string;
  button_link: string;
  gradient: string;
  icon_type: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useBannerPosts() {
  const [banners, setBanners] = useState<BannerPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('banner_posts')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { banners, isLoading, refetch: loadBanners };
}

export function useAdminBannerPosts() {
  const [banners, setBanners] = useState<BannerPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllBanners();
  }, []);

  const loadAllBanners = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('banner_posts')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBanner = async (banner: Partial<BannerPost>) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('banner_posts')
      .insert({
        title: banner.title,
        subtitle: banner.subtitle,
        description: banner.description,
        button_text: banner.button_text || 'Shop Now',
        button_link: banner.button_link || '/',
        gradient: banner.gradient || 'from-teal-600 via-teal-700 to-emerald-800',
        icon_type: banner.icon_type || 'sparkles',
        image_url: banner.image_url,
        is_active: banner.is_active ?? true,
        display_order: banner.display_order || 0,
        start_date: banner.start_date,
        end_date: banner.end_date,
      });

    if (error) throw error;
    await loadAllBanners();
  };

  const updateBanner = async (id: string, updates: Partial<BannerPost>) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('banner_posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await loadAllBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('banner_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadAllBanners();
  };

  const reorderBanners = async (orderedIds: string[]) => {
    if (!isSupabaseConfigured) return;

    const updates = orderedIds.map((id, index) => ({
      id,
      display_order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('banner_posts')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    await loadAllBanners();
  };

  const toggleBannerStatus = async (id: string, isActive: boolean) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('banner_posts')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await loadAllBanners();
  };

  return {
    banners,
    isLoading,
    refetch: loadAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
    toggleBannerStatus,
  };
}
