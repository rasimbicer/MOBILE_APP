import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ve Anon Key eksik! Lütfen .env dosyasını kontrol edin.');
  console.log('Gerekli değişkenler:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-app',
    },
  },
});

// Test bağlantısı
export const testConnection = async () => {
  try {
    // Test basic connection first
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth test failed:', authError);
      return false;
    }

    // Test if tables exist by trying to query user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1);
      
    if (error) {
      if (error.code === '42P01') {
        console.error('Tablolar mevcut değil. Migration çalıştırılmalı:', error.message);
      } else {
        console.error('Supabase bağlantı hatası:', error);
      }
      return false;
    }
    
    console.log('Supabase bağlantısı başarılı!');
    return true;
  } catch (error) {
    console.error('Supabase test hatası:', error);
    return false;
  }
};

export default supabase;