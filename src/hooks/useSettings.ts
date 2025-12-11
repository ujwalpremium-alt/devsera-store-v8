import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Settings } from '@/types';
import { mockSettings } from '@/data/mockData';

// Local storage key for settings
const SETTINGS_STORAGE_KEY = 'devsera_settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!isSupabaseConfigured) {
      // Load from localStorage or use mock data
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        setSettings(mockSettings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mockSettings));
      }
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setSettings({
          upiId: data.upi_id || '',
          qrCodeUrl: data.qr_code_url || '',
          telegramLink: data.telegram_link || '',
          telegramUsername: data.telegram_username || '@karthik_nkn',
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
        });
      } else {
        // No settings row exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert({
            upi_id: 'yourname@upi',
            qr_code_url: '',
            telegram_link: '',
            telegram_username: '@karthik_nkn',
            contact_email: '',
            contact_phone: '',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (newData) {
          setSettingsId(newData.id);
          setSettings({
            upiId: newData.upi_id || '',
            qrCodeUrl: newData.qr_code_url || '',
            telegramLink: newData.telegram_link || '',
            telegramUsername: newData.telegram_username || '@karthik_nkn',
            contactEmail: newData.contact_email || '',
            contactPhone: newData.contact_phone || '',
          });
        }
      }
    } catch (err) {
      // Silently fallback to local storage on any error
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      setSettings(storedSettings ? JSON.parse(storedSettings) : mockSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Settings) => {
    
    if (!isSupabaseConfigured) {
      // Save to localStorage
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      return;
    }

    try {
      // Build update object with only defined values
      const updateData: Record<string, any> = {};
      
      if (newSettings.upiId !== undefined) {
        updateData.upi_id = newSettings.upiId;
      }
      if (newSettings.qrCodeUrl !== undefined) {
        updateData.qr_code_url = newSettings.qrCodeUrl;
      }
      if (newSettings.telegramLink !== undefined) {
        updateData.telegram_link = newSettings.telegramLink;
      }
      if (newSettings.telegramUsername !== undefined) {
        updateData.telegram_username = newSettings.telegramUsername;
      }
      if (newSettings.contactEmail !== undefined) {
        updateData.contact_email = newSettings.contactEmail;
      }
      if (newSettings.contactPhone !== undefined) {
        updateData.contact_phone = newSettings.contactPhone;
      }
      
      updateData.updated_at = new Date().toISOString();

      if (settingsId) {
        // Update existing settings
        const { error } = await supabase
          .from('settings')
          .update(updateData)
          .eq('id', settingsId);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
      } else {
        // Insert new settings if no ID
        const { data, error } = await supabase
          .from('settings')
          .insert({
            upi_id: newSettings.upiId || '',
            qr_code_url: newSettings.qrCodeUrl || '',
            telegram_link: newSettings.telegramLink || '',
            telegram_username: newSettings.telegramUsername || '@karthik_nkn',
            contact_email: newSettings.contactEmail || '',
            contact_phone: newSettings.contactPhone || '',
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      setSettings(newSettings);
      
      // Reload settings to ensure we have the latest data
      await loadSettings();
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  const uploadQrCode = async (file: File): Promise<string> => {
    // Always use base64 for simplicity - works without storage bucket setup
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  return { settings, isLoading, error, refetch: loadSettings, updateSettings, uploadQrCode };
}
