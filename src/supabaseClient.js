import { createClient } from '@supabase/supabase-js';
import { SCHOOL_DATA } from './constants/schoolData';

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

  // --- MOCK DATA GENERATION ---
  const STUDENTS = [];
  let studentIdCounter = 1000;

  Object.entries(SCHOOL_DATA).forEach(([grade, sections]) => {
      sections.forEach(section => {
          // Generate roughly 9 students per section to reach ~1800 total (209 sections * 9 = 1881)
          const count = 9;
          for(let i=0; i<count; i++) {
              const sex = Math.random() > 0.5 ? 'M' : 'F';
              const statusOptions = ['Normal', 'Wasted', 'Severely Wasted', 'Overweight', 'Obese'];
              // Weighted random for realistic status distribution?
              // Let's just do random for now as per "Use Real Data" implies volume/structure, not necessarily statistical accuracy unless specified.
              const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

              STUDENTS.push({
                  id: studentIdCounter++,
                  name: `Student ${studentIdCounter} (${grade} - ${section})`,
                  grade_level: grade, // Store as official key "Grade 1", "K1" etc.
                  section: section,
                  sex: sex,
                  nutrition_status: status,
                  bmi: (14 + Math.random() * 12).toFixed(1),
                  birth_date: "2015-01-01", // Placeholder
                  weight: (20 + Math.random() * 30).toFixed(1),
                  height: (100 + Math.random() * 50).toFixed(1),
              });
          }
      });
  });

  const MOCK_DB = {
      students: STUDENTS,
      teachers: [
        { id: 1, teacher_id_number: "T-001", first_name: "Juan", last_name: "Dela Cruz", email: "juan@school.edu", section: "SAGING", active: true },
        { id: 2, teacher_id_number: "T-002", first_name: "Maria", last_name: "Santos", email: "maria@school.edu", section: "MASAYAHIN", active: true }
      ],
      attendance: [],
      bmi_records: [],
      sbfp_beneficiaries: [],
      nutrition_meals: [
          {
              id: "meal-001",
              week_number: 2,
              day_of_week: "Tuesday",
              meal_name: "Ginataang Tokwa",
              calories: 121,
              protein: 6,
              carbohydrates: 6,
              fats: 8,
              image_url: "https://placehold.co/600x400/fdfcdc/5d4037?text=Ginataang+Tokwa"
          },
          {
              id: "meal-002",
              week_number: 2,
              day_of_week: "Wednesday",
              meal_name: "Pork Menudo",
              calories: 202,
              protein: 8,
              carbohydrates: 5,
              fats: 17,
              image_url: "https://placehold.co/600x400?text=Pork+Menudo"
          }
      ]
  };

  const createMockBuilder = (table) => {
    const query = {
        data: MOCK_DB[table] || [],
        error: null,
        _order: null,
    };

    return {
      select: function() { return this; },
      insert: function() { return this; },
      update: function() { return this; },
      delete: function() { return this; },
      eq: function(col, val) {
          if (query.data) {
              query.data = query.data.filter(item => item[col] == val);
          }
          return this;
      },
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
      order: function(col, { ascending = true } = {}) {
        if (query.data.length > 0 && col) {
             query.data = [...query.data].sort((a, b) => {
                 if (a[col] < b[col]) return ascending ? -1 : 1;
                 if (a[col] > b[col]) return ascending ? 1 : -1;
                 return 0;
             });
        }
        return this;
      },
      limit: function() { return this; },
      range: function() { return this; }, // Just ignore range for mock to return all
      single: function() {
          if (query.data && query.data.length > 0) {
              query.data = query.data[0];
          } else {
              query.data = null;
              query.error = { message: "No rows found" };
          }
          return this;
      },
      maybeSingle: function() {
          if (query.data && query.data.length > 0) {
              query.data = query.data[0];
          } else {
              query.data = null;
          }
          return this;
      },
      then: function(resolve, reject) {
        setTimeout(() => {
          resolve({ data: query.data, error: query.error });
        }, 300); // Simulate delay
      }
    };
  };

  supabase = {
    from: (table) => createMockBuilder(table),
    auth: {
      getSession: () => Promise.resolve({
        data: { session: mockSession },
        error: null
      }),
      onAuthStateChange: (callback) => {
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
          }, 500);
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
