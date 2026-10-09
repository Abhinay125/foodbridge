/**
 * FoodBridge - Application initialization
 * Sets up all core modules and handles routing
 */

import { I18nManager } from '@/modules/i18n';
import { UIManager } from '@/modules/ui';
import { AuthManager } from '@/modules/auth';
import { supabaseClient } from '@/modules/database';

/**
 * Initialize the FoodBridge application
 * Sets up I18n, UI, Auth, and routing
 */
export async function initializeApp(): Promise<void> {
  // Initialize I18n manager first (needed for UI strings)
  const i18n = I18nManager.getInstance();
  await i18n.initialize();

  // Initialize UI manager (toasts, modals, loading)
  const ui = UIManager.getInstance();
  ui.initialize();

  // Initialize Auth manager (handles session persistence)
  const auth = AuthManager.getInstance();
  await auth.initialize();

  // Set up global error handling
  setupGlobalErrorHandling();

  // Set up routing
  setupRouting();

  // Set up auth state listener
  setupAuthListener(auth, i18n, ui);

  console.log('FoodBridge initialized successfully');
}

/**
 * Set up global error handling
 */
function setupGlobalErrorHandling(): void {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    // Don't show toast for every unhandled rejection to avoid spam
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
}

/**
 * Set up client-side routing based on hash or path
 */
function setupRouting(): void {
  // For now, we use the existing page switching from the HTML
  // The sidebar buttons have data-page attributes that handle navigation
  // This can be enhanced later with a proper router
  const handleRouteChange = () => {
    const hash = window.location.hash.slice(1) || 'home';
    const pageButton = document.querySelector(`[data-page="${hash}"]`);
    if (pageButton) {
      (pageButton as HTMLElement).click();
    }
  };

  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange(); // Handle initial route
}

/**
 * Set up auth state listener to update UI on auth changes
 */
function setupAuthListener(
  auth: AuthManager,
  i18n: I18nManager,
  _ui: UIManager
): void {
  auth.onAuthStateChange(async (user) => {
    if (user) {
      // User signed in
      console.log('User signed in:', user.email);
      updateUIForAuthenticatedUser(user, i18n);
    } else {
      // User signed out
      console.log('User signed out');
      updateUIForUnauthenticatedUser(i18n);
    }
  });
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser(user: { email?: string }, i18n: I18nManager): void {
  const profileButton = document.getElementById('profileButton');
  if (profileButton) {
    profileButton.textContent = user.email?.[0]?.toUpperCase() || 'U';
    profileButton.setAttribute('aria-label', i18n.t('profile') || 'User profile');
  }

  // Show authenticated-only navigation items
  document.querySelectorAll('[data-auth="required"]').forEach((el) => {
    el.classList.remove('hidden');
  });

  // Hide auth-only navigation items (login, signup)
  document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
    el.classList.add('hidden');
  });
}

/**
 * Update UI for unauthenticated user
 */
function updateUIForUnauthenticatedUser(i18n: I18nManager): void {
  const profileButton = document.getElementById('profileButton');
  if (profileButton) {
    profileButton.textContent = 'F';
    profileButton.setAttribute('aria-label', i18n.t('login') || 'Login');
  }

  // Hide authenticated-only navigation items
  document.querySelectorAll('[data-auth="required"]').forEach((el) => {
    el.classList.add('hidden');
  });

  // Show auth-only navigation items (login, signup)
  document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
    el.classList.remove('hidden');
  });
}

/**
 * Get the initialized AuthManager instance
 */
export function getAuthManager(): AuthManager {
  return AuthManager.getInstance();
}

/**
 * Get the initialized I18nManager instance
 */
export function getI18nManager(): I18nManager {
  return I18nManager.getInstance();
}

/**
 * Get the initialized UIManager instance
 */
export function getUIManager(): UIManager {
  return UIManager.getInstance();
}

/**
 * Get the Supabase client instance
 */
export function getSupabaseClient() {
  return supabaseClient;
}