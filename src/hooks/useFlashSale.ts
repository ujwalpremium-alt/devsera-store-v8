import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface FlashSaleProduct {
  productId: string;
  discountAmount: number;
}

export interface FlashSaleConfig {
  enabled: boolean;
  duration_hours: number;
  min_discount_percent: number;
  max_products: number;
  product_ids: string[];
  flash_sale_products: FlashSaleProduct[];
  end_time?: string;
}

const DEFAULT_CONFIG: FlashSaleConfig = {
  enabled: false,
  duration_hours: 6,
  min_discount_percent: 10,
  max_products: 5,
  product_ids: [],
  flash_sale_products: [],
  end_time: undefined
};

// Storage key for localStorage fallback
const FLASH_SALE_STORAGE_KEY = 'flashSaleConfig';

export function useFlashSale() {
  const [config, setConfig] = useState<FlashSaleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper to load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    const savedConfig = localStorage.getItem(FLASH_SALE_STORAGE_KEY);
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch {
        setConfig(DEFAULT_CONFIG);
      }
    } else {
      setConfig(DEFAULT_CONFIG);
    }
  }, []);

  // Load flash sale config
  const loadConfig = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        // Load from Supabase settings table
        const { data, error: fetchError } = await supabase
          .from('settings')
          .select('flash_sale_config')
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          // Silently fallback to localStorage on network errors (no console.error)
          loadFromLocalStorage();
          return;
        }
        
        if (data?.flash_sale_config) {
          setConfig(data.flash_sale_config as FlashSaleConfig);
          // Also sync to localStorage for components that read from there
          localStorage.setItem(FLASH_SALE_STORAGE_KEY, JSON.stringify(data.flash_sale_config));
        } else {
          // No config in database, check localStorage
          loadFromLocalStorage();
        }
      } else {
        // Not connected to Supabase, use localStorage
        loadFromLocalStorage();
      }
    } catch {
      // Silently fallback to localStorage on any error
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocalStorage]);

  // Save flash sale config
  const saveConfig = useCallback(async (newConfig: FlashSaleConfig) => {
    try {
      // Always save to localStorage for immediate access
      localStorage.setItem(FLASH_SALE_STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);

      if (isSupabaseConfigured) {
        // Save to Supabase settings table
        // First check if settings row exists
        const { data: existingSettings } = await supabase
          .from('settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existingSettings?.id) {
          // Update existing settings
          const { error: updateError } = await supabase
            .from('settings')
            .update({ 
              flash_sale_config: newConfig,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSettings.id);

          if (updateError) {
            console.error('Error updating flash sale config:', updateError);
            throw updateError;
          }
        } else {
          // Insert new settings row with flash sale config
          const { error: insertError } = await supabase
            .from('settings')
            .insert({
              flash_sale_config: newConfig,
              upi_id: '',
              qr_code_url: '',
              telegram_link: '',
              contact_email: '',
              contact_phone: ''
            });

          if (insertError) {
            console.error('Error inserting flash sale config:', insertError);
            throw insertError;
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error saving flash sale config:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  // Check if flash sale is expired
  const isExpired = useCallback(() => {
    if (!config?.end_time) return true;
    return new Date() > new Date(config.end_time);
  }, [config?.end_time]);

  // Check if flash sale is active
  const isActive = useCallback(() => {
    return config?.enabled && !isExpired();
  }, [config?.enabled, isExpired]);

  // Get flash sale info for a specific product
  const getFlashSaleInfo = useCallback((productId: string): { isOnFlashSale: boolean; discountAmount: number } => {
    if (!config?.enabled || isExpired()) {
      return { isOnFlashSale: false, discountAmount: 0 };
    }

    const flashProduct = config.flash_sale_products?.find(fp => fp.productId === productId);
    if (!flashProduct) {
      return { isOnFlashSale: false, discountAmount: 0 };
    }

    return { isOnFlashSale: true, discountAmount: flashProduct.discountAmount };
  }, [config, isExpired]);

  // Initial load
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Set up real-time subscription for Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('flash_sale_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'settings'
        },
        (payload) => {
          if (payload.new?.flash_sale_config) {
            const newConfig = payload.new.flash_sale_config as FlashSaleConfig;
            setConfig(newConfig);
            localStorage.setItem(FLASH_SALE_STORAGE_KEY, JSON.stringify(newConfig));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Poll for updates every 30 seconds as backup (reduced frequency to avoid network errors)
  useEffect(() => {
    const interval = setInterval(() => {
      loadConfig();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    saveConfig,
    loadConfig,
    isExpired,
    isActive,
    getFlashSaleInfo
  };
}

// Helper function for components that need to check flash sale status without the hook
export function getFlashSaleInfoFromStorage(productId: string): { isOnFlashSale: boolean; discountAmount: number } {
  try {
    const savedConfig = localStorage.getItem(FLASH_SALE_STORAGE_KEY);
    if (!savedConfig) return { isOnFlashSale: false, discountAmount: 0 };
    
    const config: FlashSaleConfig = JSON.parse(savedConfig);
    
    if (!config.enabled || !config.end_time) return { isOnFlashSale: false, discountAmount: 0 };
    
    const endTime = new Date(config.end_time).getTime();
    if (Date.now() >= endTime) return { isOnFlashSale: false, discountAmount: 0 };
    
    const flashProduct = config.flash_sale_products?.find(fp => fp.productId === productId);
    if (!flashProduct) return { isOnFlashSale: false, discountAmount: 0 };
    
    return { isOnFlashSale: true, discountAmount: flashProduct.discountAmount };
  } catch {
    return { isOnFlashSale: false, discountAmount: 0 };
  }
}
