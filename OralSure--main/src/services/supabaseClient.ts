import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Replace these with your actual Supabase Project URL and Anon Key 
// found in your Supabase Dashboard -> Project Settings -> API
const supabaseUrl = 'https://knhwgysrtwjdjegddkyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuaHdneXNydHdqZGplZ2Rka3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDkyMzUsImV4cCI6MjA4MjU4NTIzNX0.ilQRbHLhZKTPZk-bceiBOITw95zXOAkR5cYPqSpmjHg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper to get the current user session
 */
export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (e) {
    return null;
  }
};