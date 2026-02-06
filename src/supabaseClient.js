import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase URL or Anon Key is missing! Please check your .env file.");
} else if (!supabaseUrl.startsWith("http")) {
  console.warn("⚠️ Supabase URL does not start with 'http'. This may cause connection issues.");
}

// Fallback to a dummy client if config is missing to prevent crash,
// allowing the UI to display the error message gracefully.
const isValidConfig = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http");

export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        signInWithPassword: () => Promise.resolve({ error: { message: "Failed to fetch" } }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) // Stub for data fetching
    };
