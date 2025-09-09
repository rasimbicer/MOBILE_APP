import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase, { testConnection } from '@/lib/supabase';
import { UserProfile } from '@/types/database.types';
import { Alert } from 'react-native';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'error';
  signUp: (email: string, password: string, fullName: string, phone: string, dob: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  retryConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setConnectionStatus('connected');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return subscription;
  };

  const retryConnection = async () => {
    setConnectionStatus('connecting');
    const isConnected = await testConnection();
    
    if (isConnected) {
      setConnectionStatus('connected');
      initializeAuth();
    } else {
      setConnectionStatus('error');
      Alert.alert('Bağlantı Hatası', 'Hala bağlanılamıyor. Lütfen daha sonra tekrar deneyin.');
    }
  };

  const fetchProfile = async (userId: string) => {
    if (connectionStatus !== 'connected') return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, this is normal for new users
          console.log('Profile not found, user needs to complete onboarding');
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, dob: string) => {
    if (connectionStatus !== 'connected') {
      throw new Error('Veritabanı bağlantısı yok. Lütfen bağlantıyı kontrol edin.');
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: data.user.id,
              full_name: fullName,
              phone,
              dob,
              consent_at: new Date().toISOString(),
              locale: 'tr',
              premium_active: false,
            },
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw profileError;
        }
        
        // Fetch the created profile
        await fetchProfile(data.user.id);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (connectionStatus !== 'connected') {
      throw new Error('Veritabanı bağlantısı yok. Lütfen bağlantıyı kontrol edin.');
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    if (connectionStatus !== 'connected') {
      throw new Error('Veritabanı bağlantısı yok. Lütfen bağlantıyı kontrol edin.');
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    connectionStatus,
    signUp,
    signIn,
    signOut,
    updateProfile,
    retryConnection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}