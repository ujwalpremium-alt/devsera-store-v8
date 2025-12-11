import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationPreferences {
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  pushOrderUpdates: boolean;
  pushPromotions: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailOrderUpdates: true,
    emailPromotions: true,
    pushOrderUpdates: true,
    pushPromotions: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if (user) {
      loadPreferences();
      checkPushStatus();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!isSupabaseConfigured || !user) {
      setIsLoading(false);
      return;
    }

    try {
      let { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create default preferences
        const { data: newData, error: createError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        data = newData;
      } else if (error) {
        throw error;
      }

      if (data) {
        setPreferences({
          emailOrderUpdates: data.email_order_updates,
          emailPromotions: data.email_promotions,
          pushOrderUpdates: data.push_order_updates,
          pushPromotions: data.push_promotions,
        });
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPushStatus = async () => {
    if (!pushSupported) return;
    
    const permission = Notification.permission;
    setPushEnabled(permission === 'granted');
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user || !isSupabaseConfigured) return;

    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    try {
      await supabase
        .from('notification_preferences')
        .update({
          email_order_updates: updated.emailOrderUpdates,
          email_promotions: updated.emailPromotions,
          push_order_updates: updated.pushOrderUpdates,
          push_promotions: updated.pushPromotions,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    setPushEnabled(permission === 'granted');
    
    if (permission === 'granted') {
      await updatePreferences({ pushOrderUpdates: true });
    }
    
    return permission === 'granted';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!pushEnabled) return;
    
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  };

  return {
    preferences,
    isLoading,
    pushSupported,
    pushEnabled,
    updatePreferences,
    requestPushPermission,
    showNotification,
    refetch: loadPreferences,
  };
}
