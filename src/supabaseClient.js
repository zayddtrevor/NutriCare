import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase URL or Anon Key is missing! Please check your .env file.");
} else if (!supabaseUrl.startsWith("http")) {
  console.warn("⚠️ Supabase URL does not start with 'http'. This may cause connection issues.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
