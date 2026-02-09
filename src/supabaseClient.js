import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let supabaseInstance;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are missing! Using mock client.');

  const mockStudents = [
    { id: 1, name: "Student One", grade_section: "K1 - A", nutrition_status: "Normal", bmi: 18.5, sex: "M" },
    { id: 2, name: "Student Two", grade_section: "1 - B", nutrition_status: "Wasted", bmi: 15.0, sex: "F" },
    { id: 3, name: "Student Three", grade_section: "2 - C", nutrition_status: "Overweight", bmi: 26.0, sex: "M" },
  ];

  const mockTeachers = [
    { id: 1, teacher_id_number: "T001", first_name: "John", last_name: "Doe", email: "john@school.com", section: "K1 - A", active: true },
    { id: 2, teacher_id_number: "T002", first_name: "Jane", last_name: "Smith", email: "jane@school.com", section: "1 - B", active: true },
  ];

  // Helper to simulate async response
  const asyncResponse = (data, error = null) =>
    new Promise(resolve => setTimeout(() => resolve({ data, error, count: data ? data.length : 0 }), 500));

  supabaseInstance = {
    auth: {
      signInWithPassword: async ({ email, password }) => {
        // Allow any login for demo purposes
        return asyncResponse({ session: { user: { email: email || "admin@nutricare.com" } } });
      },
      getSession: async () => asyncResponse({ session: { user: { email: "admin@nutricare.com" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => asyncResponse(null),
    },
    from: (table) => {
      // Return a query builder object
      const queryBuilder = {
        select: (columns, options) => {
          if (table === "students") return asyncResponse(mockStudents);
          if (table === "teachers") return asyncResponse(mockTeachers);
          return asyncResponse([]);
        },
        insert: (data) => asyncResponse(null),
        update: (data) => {
            // update returns a filter builder
           return { eq: (col, val) => asyncResponse(null) };
        },
        delete: () => {
            // delete returns a filter builder
           return { eq: (col, val) => asyncResponse(null) };
        },
        // order returns the query builder itself (chaining)
        order: (col, opts) => queryBuilder
      };
      return queryBuilder;
    },
  };
} else {
  // Basic validation
  if (!supabaseUrl.startsWith('http')) {
     console.error('⚠️ Supabase URL seems invalid (should start with http/https):', supabaseUrl);
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
