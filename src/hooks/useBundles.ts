import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product } from '@/types';

export interface Bundle {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  imageUrl: string;
  isActive: boolean;
  validUntil: string | null;
  products: Product[];
  createdAt: string;
}

export function useBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bundles')
        .select(`
          *,
          bundle_products(
            product:products(*)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBundles(
        data.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          originalPrice: parseFloat(b.original_price),
          salePrice: parseFloat(b.sale_price),
          imageUrl: b.image_url || '',
          isActive: b.is_active,
          validUntil: b.valid_until,
          products: b.bundle_products?.map((bp: any) => ({
            id: bp.product.id,
            name: bp.product.name,
            description: bp.product.description,
            originalPrice: parseFloat(bp.product.original_price),
            salePrice: parseFloat(bp.product.sale_price),
            imageUrl: bp.product.image_url,
            category: bp.product.category,
            deliveryType: bp.product.delivery_type,
          })) || [],
          createdAt: b.created_at,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { bundles, isLoading, error, refetch: loadBundles };
}

export function useAdminBundles() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bundles')
        .select(`
          *,
          bundle_products(
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBundles(
        data.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          originalPrice: parseFloat(b.original_price),
          salePrice: parseFloat(b.sale_price),
          imageUrl: b.image_url || '',
          isActive: b.is_active,
          validUntil: b.valid_until,
          products: b.bundle_products?.map((bp: any) => ({
            id: bp.product.id,
            name: bp.product.name,
            description: bp.product.description,
            originalPrice: parseFloat(bp.product.original_price),
            salePrice: parseFloat(bp.product.sale_price),
            imageUrl: bp.product.image_url,
            category: bp.product.category,
            deliveryType: bp.product.delivery_type,
          })) || [],
          createdAt: b.created_at,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBundle = async (bundle: {
    name: string;
    description: string;
    originalPrice: number;
    salePrice: number;
    imageUrl: string;
    validUntil: string | null;
    productIds: string[];
  }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    const { data: bundleData, error: bundleError } = await supabase
      .from('bundles')
      .insert({
        name: bundle.name,
        description: bundle.description,
        original_price: bundle.originalPrice,
        sale_price: bundle.salePrice,
        image_url: bundle.imageUrl,
        valid_until: bundle.validUntil,
        is_active: true,
      })
      .select()
      .single();

    if (bundleError) throw bundleError;

    if (bundle.productIds.length > 0) {
      const { error: productsError } = await supabase
        .from('bundle_products')
        .insert(
          bundle.productIds.map((productId) => ({
            bundle_id: bundleData.id,
            product_id: productId,
          }))
        );

      if (productsError) throw productsError;
    }

    await loadBundles();
    return bundleData;
  };

  const updateBundle = async (
    bundleId: string,
    updates: {
      name?: string;
      description?: string;
      originalPrice?: number;
      salePrice?: number;
      imageUrl?: string;
      validUntil?: string | null;
      isActive?: boolean;
      productIds?: string[];
    }
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.originalPrice !== undefined) updateData.original_price = updates.originalPrice;
    if (updates.salePrice !== undefined) updateData.sale_price = updates.salePrice;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('bundles')
        .update(updateData)
        .eq('id', bundleId);

      if (error) throw error;
    }

    if (updates.productIds !== undefined) {
      await supabase
        .from('bundle_products')
        .delete()
        .eq('bundle_id', bundleId);

      if (updates.productIds.length > 0) {
        const { error: productsError } = await supabase
          .from('bundle_products')
          .insert(
            updates.productIds.map((productId) => ({
              bundle_id: bundleId,
              product_id: productId,
            }))
          );

        if (productsError) throw productsError;
      }
    }

    await loadBundles();
  };

  const deleteBundle = async (bundleId: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', bundleId);

    if (error) throw error;
    await loadBundles();
  };

  return { bundles, isLoading, error, refetch: loadBundles, createBundle, updateBundle, deleteBundle };
}
