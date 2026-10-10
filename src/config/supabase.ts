import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const isValidConfig = supabaseUrl && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseUrl.startsWith('http');

let supabase: SupabaseClient;
if (isValidConfig) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // Create a mock client for development/testing
  console.warn('Supabase not configured - using mock client');
  supabase = createMockSupabaseClient() as unknown as SupabaseClient;
}

function createMockSupabaseClient() {
  const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Simulate no user initially
      setTimeout(() => callback('SIGNED_OUT', null), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  };

  const mockFrom = (table: string) => ({
    select: () => mockFrom(table),
    eq: () => mockFrom(table),
    single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    insert: () => mockFrom(table),
    update: () => mockFrom(table),
    delete: () => mockFrom(table),
    order: () => mockFrom(table),
    limit: () => mockFrom(table),
    range: () => mockFrom(table),
  });

  return {
    auth: mockAuth,
    from: mockFrom,
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
  };
}

export { supabase };