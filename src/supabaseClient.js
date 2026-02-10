import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase URL or Key missing. Using mock client for development.");

  let mockSession = null;

  // Try to load session from localStorage if available (simple persistence for refresh)
  try {
    const saved = localStorage.getItem('mockSupabaseSession');
    if (saved) {
      mockSession = JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }

  const saveSession = (session) => {
    mockSession = session;
    if (session) {
      localStorage.setItem('mockSupabaseSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('mockSupabaseSession');
    }
  };

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
        data: { session: mockSession },
        error: null
      }),
      onAuthStateChange: (callback) => {
        // In a real app, this callback is called on auth state changes.
        // For our mock, we can just return the unsubscribe.
        // If we wanted to be fancy, we could store callbacks and call them on signIn/signOut.
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: ({ email, password }) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            if (email && password) {
               const session = { user: { email }, access_token: "mock_token" };
               saveSession(session);
               resolve({ data: { session }, error: null });
            } else {
               resolve({ data: { session: null }, error: { message: "Invalid credentials" } });
            }
          }, 500); // Simulate network delay
        });
      },
      signOut: () => {
        saveSession(null);
        return Promise.resolve({ error: null });
      },
    }
  };
}

export { supabase };
