import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let supabaseInstance;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables are missing! Please check your .env file.');

  // Create a mock client that returns helpful errors instead of crashing
  supabaseInstance = {
    auth: {
      signInWithPassword: async () => ({
        data: null,
        error: { message: "Supabase connection failed: Missing environment variables." }
      }),
      getSession: async () => ({
        data: { session: null },
        error: null
      }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } }
      }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        data: [],
        error: { message: "Supabase connection failed: Missing environment variables." }
      })
    }),
  };
} else {
  // Basic validation
  if (!supabaseUrl.startsWith('http')) {
     console.error('⚠️ Supabase URL seems invalid (should start with http/https):', supabaseUrl);
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
