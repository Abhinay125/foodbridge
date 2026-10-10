/**
 * FoodBridge - Application initialization
 * Sets up all core modules and handles routing
 */

import { I18nManager } from '@/modules/i18n';
import { UIManager } from '@/modules/ui';
import { Router } from '@/pages';
import { supabaseClient } from '@/modules/database';

/**
 * Initialize the FoodBridge application
 * Sets up I18n, UI, and routing
 */
export async function initializeApp(): Promise<void> {
  // Initialize I18n manager first (needed for UI strings)
  const i18n = I18nManager.getInstance();
  await i18n.initialize();

  // Initialize UI manager (toasts, modals, loading)
  const ui = UIManager.getInstance();
  ui.initialize();

  // Set up global error handling
  setupGlobalErrorHandling();

  // Initialize the router (starts listening to hashchange)
  const router = Router.getInstance();
  router.start();

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