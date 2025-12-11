import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Order, OrderStatus, OrderCredentials, DeliveryType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(
        data.map((o) => ({
          id: o.id,
          userId: o.user_id,
          productId: o.product_id,
          status: o.status as OrderStatus,
          totalAmount: o.total_amount || undefined,
          paymentScreenshot: o.payment_screenshot || undefined,
          userProvidedInput: o.user_provided_input || undefined,
          credentials: o.credentials || undefined,
          cancellationReason: o.cancellation_reason || undefined,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          product: o.product ? {
            id: o.product.id,
            name: o.product.name,
            description: o.product.description,
            image: o.product.image,
            originalPrice: o.product.original_price,
            salePrice: o.product.sale_price,
            costPrice: o.product.cost_price || 0,
            duration: o.product.duration,
            features: o.product.features,
            category: o.product.category,
            deliveryType: o.product.delivery_type as DeliveryType || 'CREDENTIALS',
            deliveryInstructions: o.product.delivery_instructions,
            requiresUserInput: o.product.requires_user_input,
            userInputLabel: o.product.user_input_label,
            isActive: o.product.is_active,
          } : undefined,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (productId: string, variantId?: string, totalAmount?: number) => {
    if (!user) throw new Error('User not authenticated');

    // First verify the product exists
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, sale_price')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      throw new Error(`Product not found: ${productError.message}`);
    }

    if (!productData) {
      throw new Error('Product not found in database');
    }

    // If variant is provided, verify it exists and get variant price
    let amount = totalAmount || productData?.sale_price || 0;
    if (variantId && !totalAmount) {
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select('id, sale_price')
        .eq('id', variantId)
        .single();
      
      if (variantError) {
        console.error('Variant fetch error:', variantError);
        // Continue without variant if not found
        variantId = undefined;
      } else if (variantData) {
        amount = variantData.sale_price;
      }
    }

    const orderData: any = {
      user_id: user.id,
      product_id: productId,
      status: 'PENDING',
      total_amount: amount,
    };

    // Only add variant_id if it's valid
    if (variantId) {
      orderData.variant_id = variantId;
    }

    console.log('Creating order with data:', orderData);

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Order creation error:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
    
    await loadOrders();
    return data;
  };

  const uploadPaymentScreenshot = async (orderId: string, file: File, userProvidedInput?: string) => {
    if (!user) throw new Error('User not authenticated');

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF');
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${orderId}-${Date.now()}.${fileExt}`;
    const filePath = `payment-screenshots/${fileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('order-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('order-files')
      .getPublicUrl(filePath);

    // Update order
    const updateData: any = {
      payment_screenshot: publicUrl,
      status: 'SUBMITTED',
    };
    
    if (userProvidedInput) {
      updateData.user_provided_input = userProvidedInput;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      throw new Error(`Failed to update order: ${updateError.message}`);
    }
    
    await loadOrders();
  };

  return { orders, isLoading, error, refetch: loadOrders, createOrder, uploadPaymentScreenshot };
}

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(
        data.map((o) => ({
          id: o.id,
          userId: o.user_id,
          productId: o.product_id,
          status: o.status as OrderStatus,
          totalAmount: o.total_amount || undefined,
          paymentScreenshot: o.payment_screenshot || undefined,
          userProvidedInput: o.user_provided_input || undefined,
          credentials: o.credentials || undefined,
          cancellationReason: o.cancellation_reason || undefined,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          product: o.product ? {
            id: o.product.id,
            name: o.product.name,
            description: o.product.description,
            image: o.product.image,
            originalPrice: o.product.original_price,
            salePrice: o.product.sale_price,
            costPrice: o.product.cost_price || 0,
            duration: o.product.duration,
            features: o.product.features,
            category: o.product.category,
            deliveryType: o.product.delivery_type as DeliveryType || 'CREDENTIALS',
            deliveryInstructions: o.product.delivery_instructions,
            requiresUserInput: o.product.requires_user_input,
            userInputLabel: o.product.user_input_label,
            isActive: o.product.is_active,
          } : undefined,
          profile: o.profile ? {
            id: o.profile.id,
            email: o.profile.email,
            full_name: o.profile.full_name,
          } : undefined,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveOrder = async (orderId: string, credentials: OrderCredentials) => {
    // Get order details first
    const { data: orderData } = await supabase
      .from('orders')
      .select('user_id, product_id, variant_id, products(sale_price, use_manual_stock, manual_stock_count, delivery_type)')
      .eq('id', orderId)
      .single();

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'COMPLETED',
        credentials,
      })
      .eq('id', orderId);

    if (error) throw error;

    // Update stock based on product type
    if (orderData?.product_id && orderData?.products) {
      const product = orderData.products;
      
      if (product.use_manual_stock) {
        // Deduct from manual stock count
        const newStockCount = Math.max(0, (product.manual_stock_count || 0) - 1);
        await supabase
          .from('products')
          .update({ manual_stock_count: newStockCount })
          .eq('id', orderData.product_id);
      } else if (['INSTANT_KEY', 'COUPON_CODE', 'CREDENTIALS'].includes(product.delivery_type || '')) {
        // Mark a stock key as assigned
        const { data: availableKey } = await supabase
          .from('product_stock_keys')
          .select('id')
          .eq('product_id', orderData.product_id)
          .eq('status', 'AVAILABLE')
          .is('variant_id', orderData.variant_id || null)
          .limit(1)
          .single();

        if (availableKey) {
          await supabase
            .from('product_stock_keys')
            .update({
              status: 'ASSIGNED',
              assigned_order_id: orderId,
              used_by: orderData.user_id,
              used_at: new Date().toISOString(),
            })
            .eq('id', availableKey.id);
        }
      }
    }

    // Award loyalty points (10 points per ₹100 spent)
    if (orderData?.user_id && orderData?.products?.sale_price) {
      const pointsEarned = Math.floor(parseFloat(orderData.products.sale_price) / 10);
      
      if (pointsEarned > 0) {
        // Add point transaction
        await supabase.from('point_transactions').insert({
          user_id: orderData.user_id,
          points: pointsEarned,
          type: 'earned',
          description: 'Points earned from order',
          order_id: orderId,
        });

        // Update loyalty points
        const { data: loyaltyData } = await supabase
          .from('loyalty_points')
          .select('total_points, lifetime_points, tier')
          .eq('user_id', orderData.user_id)
          .single();

        if (loyaltyData) {
          const newTotal = loyaltyData.total_points + pointsEarned;
          const newLifetime = loyaltyData.lifetime_points + pointsEarned;
          
          let newTier = 'bronze';
          if (newLifetime >= 5000) newTier = 'platinum';
          else if (newLifetime >= 1500) newTier = 'gold';
          else if (newLifetime >= 500) newTier = 'silver';

          await supabase
            .from('loyalty_points')
            .update({
              total_points: newTotal,
              lifetime_points: newLifetime,
              tier: newTier,
            })
            .eq('user_id', orderData.user_id);
        } else {
          // Create loyalty record if doesn't exist
          await supabase.from('loyalty_points').insert({
            user_id: orderData.user_id,
            total_points: pointsEarned,
            lifetime_points: pointsEarned,
          });
        }

        // Complete referral if this is user's first order
        const { data: referralData } = await supabase
          .from('referrals')
          .select('*')
          .eq('referred_id', orderData.user_id)
          .eq('status', 'pending')
          .single();

        if (referralData) {
          // Update referral status
          await supabase
            .from('referrals')
            .update({ status: 'completed', reward_given: true })
            .eq('id', referralData.id);

          // Award referrer
          await supabase.from('point_transactions').insert({
            user_id: referralData.referrer_id,
            points: 100,
            type: 'referral',
            description: 'Referral bonus - friend made first purchase',
          });

          // Update referrer's points
          const { data: referrerLoyalty } = await supabase
            .from('loyalty_points')
            .select('total_points, lifetime_points')
            .eq('user_id', referralData.referrer_id)
            .single();

          if (referrerLoyalty) {
            await supabase
              .from('loyalty_points')
              .update({
                total_points: referrerLoyalty.total_points + 100,
                lifetime_points: referrerLoyalty.lifetime_points + 100,
              })
              .eq('user_id', referralData.referrer_id);
          }

          // Award referred user bonus
          await supabase.from('point_transactions').insert({
            user_id: orderData.user_id,
            points: 50,
            type: 'bonus',
            description: 'Welcome bonus from referral',
          });

          // Update referred user's points
          const { data: referredLoyalty } = await supabase
            .from('loyalty_points')
            .select('total_points, lifetime_points')
            .eq('user_id', orderData.user_id)
            .single();

          if (referredLoyalty) {
            await supabase
              .from('loyalty_points')
              .update({
                total_points: referredLoyalty.total_points + 50,
                lifetime_points: referredLoyalty.lifetime_points + 50,
              })
              .eq('user_id', orderData.user_id);
          }
        }
      }
    }

    await loadOrders();
  };

  const rejectOrder = async (orderId: string, reason: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason,
      })
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    await loadOrders();
  };

  return { orders, isLoading, error, refetch: loadOrders, approveOrder, rejectOrder, deleteOrder };
}
