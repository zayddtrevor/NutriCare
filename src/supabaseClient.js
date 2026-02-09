import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to create a mock client for missing environment variables
const createMockClient = () => {
  const mockError = { message: "Supabase environment variables are missing. Check your .env file." };

  // A mock builder that handles chainable methods and behaves like a Promise
  const mockBuilder = {
    then: (resolve) => resolve({ data: null, error: mockError }),
    select: function() { return this; },
    insert: function() { return this; },
    update: function() { return this; },
    delete: function() { return this; },
    eq: function() { return this; },
    single: function() { return this; },
    maybeSingle: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    match: function() { return this; },
  };

  return {
    auth: {
      signInWithPassword: async () => ({ error: mockError }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => mockBuilder,
  };
};

let client;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables! Check your .env file.");
    client = createMockClient();
  } else {
    // Validate URL format simply to avoid immediate crash
    try {
      new URL(supabaseUrl);
      client = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error("Invalid Supabase URL:", supabaseUrl);
      client = createMockClient();
    }
  }
} catch (error) {
  console.error("Supabase client initialization failed:", error);
  client = createMockClient();
}

export const supabase = client;
