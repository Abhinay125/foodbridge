import { supabase } from '@/config/supabase';
import type { DatabaseSchema, TableNames } from '@/types/database';

/**
 * Singleton wrapper for Supabase client providing typed access and helper methods
 */
export class SupabaseClient {
  private static instance: SupabaseClient;

  /**
   * The underlying Supabase client instance
   */
  public readonly client = supabase;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): SupabaseClient {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }

  // ========================================================================
  // AUTH HELPERS
  // ========================================================================

  /**
   * Get the currently authenticated user
   * @returns User object or null if not authenticated
   */
  async getCurrentUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
    return data.user;
  }

  /**
   * Get the current session
   * @returns Session object or null if not authenticated
   */
  async getCurrentSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      throw new Error(`Failed to get current session: ${error.message}`);
    }
    return data.session;
  }

  /**
   * Sign up a new user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @param metadata - Additional user metadata (full_name, user_type, etc.)
   * @returns The created user and session
   */
  async signUp(
    email: string,
    password: string,
    metadata: Record<string, unknown> = {}
  ) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }
    return data;
  }

  /**
   * Sign in a user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns The authenticated user and session
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
    return data;
  }

  /**
   * Sign in with OAuth provider
   * @param provider - OAuth provider ('google', 'github', etc.)
   * @param redirectTo - Optional custom redirect URL
   */
  async signInWithOAuth(
    provider: 'google' | 'github' | 'apple',
    redirectTo?: string
  ) {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      throw new Error(`OAuth sign in failed: ${error.message}`);
    }
    return data;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Reset password - sends reset email
   * @param email - User's email address
   * @param redirectTo - Optional custom redirect URL after reset
   */
  async resetPassword(email: string, redirectTo?: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`,
    });
    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Update user password (requires active session)
   * @param newPassword - New password
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  /**
   * Update user metadata
   * @param metadata - Metadata to update
   */
  async updateUserMetadata(metadata: Record<string, unknown>) {
    const { error } = await this.client.auth.updateUser({ data: metadata });
    if (error) {
      throw new Error(`Metadata update failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to auth state changes
   * @param callback - Called with (user, session) on auth state change
   * @returns Unsubscribe function
   */
  onAuthStateChange(
    callback: (user: Awaited<ReturnType<typeof this.getCurrentUser>> | null, session: Awaited<ReturnType<typeof this.getCurrentSession>>) => void
  ) {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      callback(user, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }

  // ========================================================================
  // DATABASE QUERY HELPERS
  // ========================================================================

  /**
   * Build a typed query for a table
   * @param table - Table name
   * @returns Supabase query builder
   */
  from<T extends TableNames>(table: T) {
    return this.client.from(table);
  }

  /**
   * Select rows from a table with type safety
   * @param table - Table name
   * @param columns - Columns to select (defaults to '*')
   * @returns Query builder
   */
  select<T extends TableNames>(
    table: T,
    columns: string = '*'
  ) {
    return this.client.from(table).select(columns);
  }

  /**
   * Insert a row into a table
   * @param table - Table name
   * @param data - Data to insert
   * @returns Inserted row
   */
  async insert<T extends TableNames>(
    table: T,
    data: Partial<DatabaseSchema[T]>
  ) {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data as Record<string, unknown>)
      .select()
      .single();
    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
    return result as DatabaseSchema[T];
  }

  /**
   * Insert multiple rows into a table
   * @param table - Table name
   * @param data - Array of data to insert
   * @returns Inserted rows
   */
  async insertMany<T extends TableNames>(
    table: T,
    data: Partial<DatabaseSchema[T]>[]
  ) {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data as Record<string, unknown>[])
      .select();
    if (error) {
      throw new Error(`Bulk insert failed: ${error.message}`);
    }
    return result as DatabaseSchema[T][];
  }

  /**
   * Update rows in a table
   * @param table - Table name
   * @param data - Data to update
   * @param match - Column-value pairs to match for update
   * @returns Updated rows
   */
  async update<T extends TableNames>(
    table: T,
    data: Partial<DatabaseSchema[T]>,
    match: Record<string, unknown>
  ) {
    let query = this.client.from(table).update(data as Record<string, unknown>);
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value);
    }
    const { data: result, error } = await query.select();
    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
    return result as DatabaseSchema[T][];
  }

  /**
   * Delete rows from a table
   * @param table - Table name
   * @param match - Column-value pairs to match for deletion
   * @returns Deleted rows
   */
  async delete<T extends TableNames>(
    table: T,
    match: Record<string, unknown>
  ) {
    let query = this.client.from(table).delete();
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value);
    }
    const { data: result, error } = await query.select();
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
    return result as DatabaseSchema[T][];
  }

  /**
   * Get a single row by ID
   * @param table - Table name
   * @param id - Row ID
   * @param columns - Columns to select
   * @returns Row or null if not found
   */
  async getById<T extends TableNames>(
    table: T,
    id: string,
    columns: string = '*'
  ) {
    const { data, error } = await this.client
      .from(table)
      .select(columns)
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Get by ID failed: ${error.message}`);
    }
    return data as unknown as DatabaseSchema[T];
  }

  /**
   * Get rows with pagination
   * @param table - Table name
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @param columns - Columns to select
   * @returns Paginated results
   */
  async getPaginated<T extends TableNames>(
    table: T,
    page: number = 1,
    pageSize: number = 20,
    columns: string = '*'
  ) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await this.client
      .from(table)
      .select(columns, { count: 'exact' })
      .range(from, to);

    if (error) {
      throw new Error(`Paginated query failed: ${error.message}`);
    }

    return {
      data: data as unknown as DatabaseSchema[T][],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  // ========================================================================
  // REALTIME HELPERS
  // ========================================================================

  /**
   * Subscribe to realtime changes on a table
   * @param table - Table name
   * @param callback - Called with payload on change
   * @param filter - Optional filter string (e.g., 'id=eq.123')
   * @param event - Event type to listen for (default: '*')
   * @returns Unsubscribe function
   */
  subscribeToTable<T extends TableNames>(
    table: T,
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema[T] | null;
      old: DatabaseSchema[T] | null;
    }) => void,
    filter?: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ) {
    let channel = this.client
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as DatabaseSchema[T] | null,
            old: payload.old as DatabaseSchema[T] | null,
          });
        }
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }

  /**
   * Subscribe to realtime changes on a specific row
   * @param table - Table name
   * @param id - Row ID
   * @param callback - Called with payload on change
   * @returns Unsubscribe function
   */
  subscribeToRow<T extends TableNames>(
    table: T,
    id: string,
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema[T] | null;
      old: DatabaseSchema[T] | null;
    }) => void
  ) {
    return this.subscribeToTable(table, callback, `id=eq.${id}`);
  }

  /**
   * Subscribe to auth user changes (profile updates)
   * @param userId - User ID to watch
   * @param callback - Called with profile payload on change
   * @returns Unsubscribe function
   */
  subscribeToProfile(
    userId: string,
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema['profiles'] | null;
      old: DatabaseSchema['profiles'] | null;
    }) => void
  ) {
    return this.subscribeToRow('profiles', userId, callback);
  }

  /**
   * Subscribe to food listing changes
   * @param callback - Called with listing payload on change
   * @param filter - Optional filter (e.g., 'donor_id=eq.123')
   * @returns Unsubscribe function
   */
  subscribeToListings(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema['food_listings'] | null;
      old: DatabaseSchema['food_listings'] | null;
    }) => void,
    filter?: string
  ) {
    return this.subscribeToTable('food_listings', callback, filter);
  }

  /**
   * Subscribe to pickup request changes
   * @param callback - Called with request payload on change
   * @param filter - Optional filter
   * @returns Unsubscribe function
   */
  subscribeToPickupRequests(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema['pickup_requests'] | null;
      old: DatabaseSchema['pickup_requests'] | null;
    }) => void,
    filter?: string
  ) {
    return this.subscribeToTable('pickup_requests', callback, filter);
  }

  /**
   * Subscribe to message changes
   * @param callback - Called with message payload on change
   * @param filter - Optional filter
   * @returns Unsubscribe function
   */
  subscribeToMessages(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema['messages'] | null;
      old: DatabaseSchema['messages'] | null;
    }) => void,
    filter?: string
  ) {
    return this.subscribeToTable('messages', callback, filter);
  }

  /**
   * Subscribe to active location shares
   * @param pickupRequestId - Pickup request ID to track
   * @param callback - Called with location payload on change
   * @returns Unsubscribe function
   */
  subscribeToLocationShares(
    pickupRequestId: string,
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: DatabaseSchema['active_location_shares'] | null;
      old: DatabaseSchema['active_location_shares'] | null;
    }) => void
  ) {
    return this.subscribeToTable(
      'active_location_shares',
      callback,
      `pickup_request_id=eq.${pickupRequestId}`
    );
  }
}

/**
 * Default singleton instance
 */
export const supabaseClient = SupabaseClient.getInstance();