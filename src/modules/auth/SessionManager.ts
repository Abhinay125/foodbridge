import { supabase } from '@/config/supabase';
import type { User, AuthResult } from './types';

/**
 * SessionManager - Handles session persistence, token refresh, and storage
 * Works with Supabase's built-in session management
 */
export class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session manager - sets up token refresh listener
   */
  async initialize(): Promise<void> {
    // Supabase handles auto-refresh via auth config, but we can listen for changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session) {
        this.scheduleTokenRefresh(session);
      }
    });

    // Check for existing session and schedule refresh
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.scheduleTokenRefresh(session);
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResult['session']> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user from session
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      user_type: data.user_type,
      full_name: data.full_name,
      phone: data.phone,
      avatar_url: data.profile_picture_url,
      is_verified: data.is_verified,
      created_at: data.created_at,
    };
  }

  /**
   * Refresh the access token manually
   */
  async refreshToken(): Promise<AuthResult['session']> {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    if (data.session) {
      this.scheduleTokenRefresh(data.session);
    }
    return data.session;
  }

  /**
   * Store session data to localStorage (for persistence across tabs)
   */
  storeSession(session: AuthResult['session']): void {
    if (!session) return;
    try {
      localStorage.setItem('sb-session', JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user,
      }));
    } catch {
      // Ignore storage errors (private browsing, quota exceeded, etc.)
    }
  }

  /**
   * Clear stored session
   */
  clearSession(): void {
    try {
      localStorage.removeItem('sb-session');
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get stored session from localStorage
   */
  getStoredSession(): AuthResult['session'] | null {
    try {
      const stored = localStorage.getItem('sb-session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: AuthResult['session'] | null): boolean {
    if (!session?.expires_at) return true;
    return Date.now() >= (session.expires_at * 1000) - 60000; // 1 min buffer
  }

  /**
   * Schedule automatic token refresh before expiry
   */
  private scheduleTokenRefresh(session: AuthResult['session']): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const expiresAt = session.expires_at * 1000;
    const refreshAt = expiresAt - Date.now() - 300000; // Refresh 5 min before expiry

    if (refreshAt > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch {
          // Token refresh failed - session will be handled by auth state change
        }
      }, refreshAt);
    }
  }

  /**
   * Cleanup timers
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();