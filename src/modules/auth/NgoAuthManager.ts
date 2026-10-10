/**
 * NGO Authentication Manager
 * Handles mobile number + OTP authentication for NGOs using Twilio via Supabase Edge Function
 * Supports dev mode for local development without deployed edge functions
 */

import { supabaseClient } from '../database/SupabaseClient';
import { profileQueries } from '../database/queries';
import type { ProfileInsert } from '@/types/database';

const STORAGE_KEY = 'foodbridge_ngo_session';
const DEV_MODE_KEY = 'foodbridge_dev_mode';
const DEV_OTP_KEY = 'foodbridge_dev_otp';

export interface NgoSession {
  profileId: string;
  mobileNumber: string;
  loginTime: number;
}

export interface OtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  devOtp?: string;
}

export class NgoAuthManager {
  private static instance: NgoAuthManager;
  private session: NgoSession | null = null;

  private constructor() {
    this.loadSession();
  }

  static getInstance(): NgoAuthManager {
    if (!NgoAuthManager.instance) {
      NgoAuthManager.instance = new NgoAuthManager();
    }
    return NgoAuthManager.instance;
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if session is less than 30 days old
        if (Date.now() - parsed.loginTime < 30 * 24 * 60 * 60 * 1000) {
          this.session = parsed;
        } else {
          this.clearSession();
        }
      }
    } catch (e) {
      this.clearSession();
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Get current session
   */
  getSession(): NgoSession | null {
    return this.session;
  }

  /**
   * Check if NGO is authenticated
   */
  isAuthenticated(): boolean {
    return this.session !== null;
  }

  /**
   * Get current NGO profile ID
   */
  getProfileId(): string | null {
    return this.session?.profileId ?? null;
  }

  /**
   * Get current NGO mobile number
   */
  getMobileNumber(): string | null {
    return this.session?.mobileNumber ?? null;
  }

  /**
   * Check if running in dev mode (local development)
   */
  private isDevMode(): boolean {
    // Check if we're on localhost or if dev mode is forced
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      localStorage.getItem(DEV_MODE_KEY) === 'true'
    );
  }

  /**
   * Send OTP to mobile number via Supabase Edge Function (or dev mode)
   */
  async sendOtp(mobileNumber: string): Promise<OtpResponse> {
    // Normalize mobile number (remove spaces, dashes, ensure country code)
    const normalized = this.normalizeMobile(mobileNumber);
    
    if (!normalized) {
      return { success: false, error: 'Invalid mobile number format' };
    }

    // Dev mode: simulate OTP sending without edge functions
    if (this.isDevMode()) {
      console.log('[DEV MODE] Simulating OTP send for:', normalized);
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store mock OTP in localStorage for verification
      localStorage.setItem(DEV_OTP_KEY + normalized, mockOtp);
      localStorage.setItem(DEV_OTP_KEY + normalized + '_expiry', (Date.now() + 5 * 60 * 1000).toString());
      
      // Show OTP in console for easy testing
      console.log(`[DEV MODE] OTP for ${normalized}: ${mockOtp}`);
      
      // Also show in alert for visibility
      alert(`[DEV MODE] Your OTP is: ${mockOtp}\n\n(This would be sent via SMS in production)`);
      
      return { 
        success: true, 
        message: 'OTP sent (dev mode - check console/alert)',
        devOtp: mockOtp 
      };
    }

    try {
      // Call Supabase Edge Function to send OTP via Twilio
      const { data, error } = await supabaseClient.client.functions.invoke('send-otp', {
        body: { mobileNumber: normalized }
      });

      if (error) {
        console.error('Edge Function error:', error);
        return { success: false, error: error.message || 'Failed to send OTP' };
      }

      return { success: true, message: data?.message || 'OTP sent' };
    } catch (err: any) {
      console.error('Send OTP error:', err);
      return { success: false, error: err.message || 'Failed to send OTP' };
    }
  }

  /**
   * Verify OTP and create/retrieve NGO profile
   */
  async verifyOtp(mobileNumber: string, otp: string): Promise<OtpResponse> {
    const normalized = this.normalizeMobile(mobileNumber);
    
    if (!normalized) {
      return { success: false, error: 'Invalid mobile number format' };
    }

    if (!otp || otp.length !== 6) {
      return { success: false, error: 'Invalid OTP format' };
    }

    // Dev mode: verify against localStorage OTP
    if (this.isDevMode()) {
      console.log('[DEV MODE] Verifying OTP for:', normalized);
      
      const storedOtp = localStorage.getItem(DEV_OTP_KEY + normalized);
      const storedExpiry = localStorage.getItem(DEV_OTP_KEY + normalized + '_expiry');
      
      if (!storedOtp || !storedExpiry) {
        return { success: false, error: 'No OTP found. Please request a new OTP.' };
      }
      
      // Check expiry
      if (Date.now() > parseInt(storedExpiry)) {
        localStorage.removeItem(DEV_OTP_KEY + normalized);
        localStorage.removeItem(DEV_OTP_KEY + normalized + '_expiry');
        return { success: false, error: 'OTP expired. Please request a new OTP.' };
      }
      
      // Verify OTP
      if (storedOtp !== otp) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
      }
      
      // OTP verified - clean up
      localStorage.removeItem(DEV_OTP_KEY + normalized);
      localStorage.removeItem(DEV_OTP_KEY + normalized + '_expiry');
      
      // Create or get NGO profile
      const profileId = await this.createOrGetNgoProfile(normalized);
      
      this.session = {
        profileId,
        mobileNumber: normalized,
        loginTime: Date.now()
      };
      this.saveSession();

      return { success: true, message: 'Login successful (dev mode)' };
    }

    try {
      // Call Supabase Edge Function to verify OTP
      const { data, error } = await supabaseClient.client.functions.invoke('verify-otp', {
        body: { mobileNumber: normalized, otp }
      });

      if (error) {
        console.error('Verify OTP error:', error);
        return { success: false, error: error.message || 'Failed to verify OTP' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Invalid OTP' };
      }

      // OTP verified - create or get NGO profile
      const profileId = await this.createOrGetNgoProfile(normalized, data.profileData);
      
      this.session = {
        profileId,
        mobileNumber: normalized,
        loginTime: Date.now()
      };
      this.saveSession();

      return { success: true, message: 'Login successful' };
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      return { success: false, error: err.message || 'Failed to verify OTP' };
    }
  }

  /**
   * Create or get NGO profile from mobile number
   */
  private async createOrGetNgoProfile(mobileNumber: string, profileData?: Partial<ProfileInsert>): Promise<string> {
    // Try to find existing profile by mobile number
    const existingProfile = await this.getProfileByMobile(mobileNumber);
    
    if (existingProfile) {
      return existingProfile.id;
    }

    // Create new NGO profile
    const profileInsert: ProfileInsert = {
      id: crypto.randomUUID(), // Will be replaced by actual auth user ID if using Supabase Auth
      user_type: 'ngo',
      full_name: profileData?.full_name || `NGO ${mobileNumber.slice(-4)}`,
      email: profileData?.email || `${mobileNumber.replace(/[^0-9]/g, '')}@ngo.foodbridge.local`,
      phone: mobileNumber,
      address_line1: profileData?.address_line1,
      address_line2: profileData?.address_line2,
      city: profileData?.city,
      state: profileData?.state,
      postal_code: profileData?.postal_code,
      latitude: profileData?.latitude,
      longitude: profileData?.longitude
    };

    const profile = await profileQueries.create(profileInsert);
    return profile.id;
  }

  /**
   * Get profile by mobile number
   */
  private async getProfileByMobile(mobileNumber: string) {
    try {
      const { data, error } = await supabaseClient.client
        .from('profiles')
        .select('*')
        .eq('phone', mobileNumber)
        .eq('user_type', 'ngo')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Normalize mobile number to E.164 format
   */
  private normalizeMobile(mobile: string): string | null {
    // Remove all non-digits
    const digits = mobile.replace(/\D/g, '');
    
    // Handle Indian numbers (10 digits) - add +91
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    
    // Already has country code (11-15 digits)
    if (digits.length >= 11 && digits.length <= 15) {
      return `+${digits}`;
    }
    
    return null;
  }

  /**
   * Logout - clear session
   */
  logout(): void {
    this.clearSession();
  }

  private clearSession(): void {
    this.session = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const ngoAuthManager = NgoAuthManager.getInstance();