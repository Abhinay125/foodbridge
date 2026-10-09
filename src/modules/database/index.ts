/**
 * Database module barrel export
 * Main entry point for all database-related functionality
 */

// Supabase client singleton
export { SupabaseClient, supabaseClient } from './SupabaseClient';

// Typed query helpers
export {
  profileQueries,
  ngoLocationQueries,
  foodListingQueries,
  foodPickupDetailQueries,
  pickupRequestQueries,
  messageQueries,
  locationShareQueries,
  combinedQueries,
} from './queries';

// Database types
export * from './types';

// Re-export the raw Supabase client for advanced usage
export { supabase } from '@/config/supabase';