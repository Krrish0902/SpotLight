import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  return new Promise<Response>((resolve, reject) => {
    // 5-second timeout for blocked networks
    const timeoutId = setTimeout(() => {
      reject(new Error('Connection Timeout: Spotlight cannot reach the database. If you are on Jio, try a VPN.'));
    }, 5000);

    fetch(url, options)
      .then((res) => {
        clearTimeout(timeoutId);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    storageKey: 'spotlight-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});
