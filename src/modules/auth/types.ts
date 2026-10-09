export type UserRole = 'donor' | 'ngo';

export interface User {
  id: string;
  email: string;
  user_type: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResult {
  user: User | null;
  error: Error | null;
  session: any | null;
}

export interface UserRegistration {
  email: string;
  password: string;
  full_name: string;
  user_type: UserRole;
  phone?: string;
  organization?: string;
}