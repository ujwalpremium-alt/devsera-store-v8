import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@/types';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Use localStorage for mock auth
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setProfile({
          id: parsedUser.id,
          email: parsedUser.email,
          full_name: parsedUser.name,
          role: parsedUser.role,
        });
      }
      setIsLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist or can't be read, get user info from auth
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const userEmail = authData.user.email || '';
          const userName = authData.user.user_metadata?.name || userEmail.split('@')[0];
          
          // Try to upsert profile (insert or update if exists)
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userEmail,
              full_name: userName,
              role: 'user',
            }, { onConflict: 'id' })
            .select()
            .single();
          
          if (upsertError) {
            // Even if upsert fails, set user from auth data
            setUser({
              id: userId,
              email: userEmail,
              name: userName,
              role: 'user',
            });
            setProfile({
              id: userId,
              email: userEmail,
              full_name: userName,
              role: 'user',
            });
          } else if (newProfile) {
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.full_name || userName,
              role: newProfile.role as 'user' | 'admin',
              admin_role: newProfile.admin_role,
              is_active: newProfile.is_active,
            });
            setProfile({
              id: newProfile.id,
              email: newProfile.email,
              full_name: newProfile.full_name || userName,
              role: newProfile.role,
              avatar_url: newProfile.avatar_url,
            });
          }
        }
        setIsLoading(false);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.full_name || data.name || data.email?.split('@')[0] || '',
          role: data.role as 'user' | 'admin',
          admin_role: data.admin_role,
          is_active: data.is_active,
        });
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name || data.name,
          role: data.role,
          avatar_url: data.avatar_url,
        });
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Mock login - check for admin email
      const isAdmin = email === 'admin@devsera.store';
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: isAdmin ? 'admin' : 'user',
        admin_role: isAdmin ? 'super_admin' : undefined,
        is_active: true,
      };
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.name,
        role: mockUser.role,
      });
      localStorage.setItem('user', JSON.stringify(mockUser));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Immediately load user profile after successful login
    if (data.user) {
      await loadUserProfile(data.user.id);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) {
      // Mock registration
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: 'user',
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user',
        },
      },
    });

    if (error) throw error;

    // If user was created, manually create profile if trigger didn't work
    if (data.user) {
      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // If no profile exists, create one
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: name,
              role: 'user',
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }

        // Set user immediately for better UX
        setUser({
          id: data.user.id,
          email: email,
          name: name,
          role: 'user',
        });
      } catch (profileErr) {
        console.error('Profile creation error:', profileErr);
      }
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      localStorage.removeItem('user');
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
