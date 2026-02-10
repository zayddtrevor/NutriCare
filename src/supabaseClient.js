import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase URL or Key missing. Using mock client for development.");

  const mockBuilder = {
    select: function() { return this; },
    insert: function() { return this; },
    update: function() { return this; },
    delete: function() { return this; },
    eq: function() { return this; },
    neq: function() { return this; },
    gt: function() { return this; },
    lt: function() { return this; },
    gte: function() { return this; },
    lte: function() { return this; },
    like: function() { return this; },
    ilike: function() { return this; },
    is: function() { return this; },
    in: function() { return this; },
    contains: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    single: function() { return this; },
    maybeSingle: function() { return this; },
    then: function(resolve, reject) {
      setTimeout(() => {
        resolve({ data: [], error: null });
      }, 500);
    }
  };

  supabase = {
    from: () => mockBuilder,
    auth: {
      getSession: () => Promise.resolve({
        // Return null session by default to enforce login, or mock session for dev convenience.
        // For security, usually null. But for this demo without keys, we might want to allow access?
        // Let's return null to be safe and standard.
        data: { session: null },
        error: null
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: ({ email, password }) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            if (email && password) {
               resolve({ data: { session: { user: { email } } }, error: null });
            } else {
               resolve({ data: { session: null }, error: { message: "Invalid credentials" } });
            }
          }, 500); // Simulate network delay
        });
      },
      signOut: () => Promise.resolve({ error: null }),
    }
  };
}

export { supabase };
