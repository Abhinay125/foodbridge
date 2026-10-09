import { supabase } from '@/config/supabase';
import type { User, AuthResult, UserRegistration, UserRole } from './types';

export interface IAuthManager {
  initialize(): Promise<void>;
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  register(userData: UserRegistration): Promise<AuthResult>;
  getCurrentUser(): User | null;
  getCurrentUserRole(): UserRole | null;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

export class AuthManager implements IAuthManager {
  private static instance: AuthManager;
  private authStateCallbacks: ((user: User | null) => void)[] = [];
  private currentUser: User | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentUser = await this.fetchProfile(session.user.id);
    }
    this.initialized = true;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error, session: null };
    const user = await this.fetchProfile(data.user.id);
    this.currentUser = user;
    this.notifyAuthChange(user);
    return { user, error: null, session: data.session };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.notifyAuthChange(null);
  }

  async register(userData: UserRegistration): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: { data: { full_name: userData.full_name, user_type: userData.user_type } }
    });
    if (error) return { user: null, error, session: null };
    const user = await this.fetchProfile(data.user!.id);
    this.currentUser = user;
    this.notifyAuthChange(user);
    return { user, error: null, session: data.session };
  }

  getCurrentUser(): User | null { return this.currentUser; }
  getCurrentUserRole(): UserRole | null { return this.currentUser?.user_type ?? null; }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateCallbacks.push(callback);
    // Also subscribe to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await this.fetchProfile(session.user.id);
        this.currentUser = user;
        this.notifyAuthChange(user);
      } else {
        this.currentUser = null;
        this.notifyAuthChange(null);
      }
    });
    return () => { subscription.unsubscribe(); };
  }

  private async fetchProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
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

  private notifyAuthChange(user: User | null) {
    this.authStateCallbacks.forEach(cb => cb(user));
  }
}