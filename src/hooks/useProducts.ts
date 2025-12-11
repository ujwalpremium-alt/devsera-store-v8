import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Product, DeliveryType, ProductVariant } from '@/types';
import { mockProducts } from '@/data/mockData';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!isSupabaseConfigured) {
      setProducts(mockProducts);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts = data.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        originalPrice: p.original_price,
        salePrice: p.sale_price,
        costPrice: p.cost_price || 0,
        duration: p.duration,
        features: p.features,
        category: p.category,
        deliveryType: (p.delivery_type as DeliveryType) || 'CREDENTIALS',
        deliveryInstructions: p.delivery_instructions,
        requiresUserInput: p.requires_user_input,
        userInputLabel: p.user_input_label,
        requiresPassword: p.requires_password !== false,
        isActive: p.is_active ?? true,
        hasVariants: p.has_variants || false,
        scheduledStart: p.scheduled_start,
        scheduledEnd: p.scheduled_end,
        lowStockAlert: p.low_stock_alert,
        useManualStock: p.use_manual_stock || false,
        manualStockCount: p.manual_stock_count || 0,
      }));

      // Load variants and stock counts for products
      for (const product of mappedProducts) {
        // Load stock count
        if (product.useManualStock) {
          product.stockCount = product.manualStockCount || 0;
        } else if (product.deliveryType === 'INSTANT_KEY' || product.deliveryType === 'COUPON_CODE' || product.deliveryType === 'CREDENTIALS' || product.deliveryType === 'MANUAL_ACTIVATION') {
          const { count } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)
            .eq('status', 'AVAILABLE');
          product.stockCount = count || 0;
        }

        // Load variants
        if (product.hasVariants) {
          const { data: variantsData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id)
            .order('sort_order', { ascending: true });
          
          if (variantsData) {
            product.variants = variantsData.map(v => ({
              id: v.id,
              productId: v.product_id,
              name: v.name,
              duration: v.duration,
              originalPrice: v.original_price,
              salePrice: v.sale_price,
              stockCount: v.stock_count || 0,
              isDefault: v.is_default,
              sortOrder: v.sort_order,
              deliveryType: (v.delivery_type as DeliveryType) || undefined,
              features: v.features || undefined,
              createdAt: v.created_at,
              updatedAt: v.updated_at
            }));
          }
        }
      }

      setProducts(mappedProducts);
    } catch (err) {
      setError(err as Error);
      // Fallback to mock data on error
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  };

  return { products, isLoading, error, refetch: loadProducts };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!isSupabaseConfigured) {
      const mockProduct = mockProducts.find(p => p.id === id);
      setProduct(mockProduct || null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          description: data.description,
          image: data.image,
          originalPrice: data.original_price,
          salePrice: data.sale_price,
          costPrice: data.cost_price || 0,
          duration: data.duration,
          features: data.features,
          category: data.category,
          deliveryType: (data.delivery_type as DeliveryType) || 'CREDENTIALS',
          deliveryInstructions: data.delivery_instructions,
          requiresUserInput: data.requires_user_input,
          userInputLabel: data.user_input_label,
          requiresPassword: data.requires_password !== false,
          isActive: data.is_active ?? true,
          hasVariants: data.has_variants || false,
          scheduledStart: data.scheduled_start,
          scheduledEnd: data.scheduled_end,
          lowStockAlert: data.low_stock_alert,
          useManualStock: data.use_manual_stock || false,
          manualStockCount: data.manual_stock_count || 0,
        };

        // Load stock count
        if (mappedProduct.useManualStock) {
          mappedProduct.stockCount = mappedProduct.manualStockCount || 0;
        } else if (mappedProduct.deliveryType === 'INSTANT_KEY' || mappedProduct.deliveryType === 'COUPON_CODE' || mappedProduct.deliveryType === 'CREDENTIALS' || mappedProduct.deliveryType === 'MANUAL_ACTIVATION') {
          const { count } = await supabase
            .from('product_stock_keys')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', mappedProduct.id)
            .eq('status', 'AVAILABLE');
          mappedProduct.stockCount = count || 0;
        }

        // Load variants if product has variants
        if (mappedProduct.hasVariants) {
          const { data: variantsData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', id)
            .order('sort_order', { ascending: true });
          
          if (variantsData) {
            mappedProduct.variants = variantsData.map(v => ({
              id: v.id,
              productId: v.product_id,
              name: v.name,
              duration: v.duration,
              originalPrice: v.original_price,
              salePrice: v.sale_price,
              stockCount: v.stock_count || 0,
              isDefault: v.is_default,
              sortOrder: v.sort_order,
              deliveryType: (v.delivery_type as DeliveryType) || undefined,
              features: v.features || undefined,
              createdAt: v.created_at,
              updatedAt: v.updated_at
            }));
          }
        }

        setProduct(mappedProduct);
      }
    } catch (err) {
      setError(err as Error);
      // Fallback to mock data on error
      const mockProduct = mockProducts.find(p => p.id === id);
      setProduct(mockProduct || null);
    } finally {
      setIsLoading(false);
    }
  };

  return { product, isLoading, error, refetch: loadProduct };
}
