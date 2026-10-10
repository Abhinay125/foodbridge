/**
 * FoodBridge - Main entry point
 * Initializes the application and all core modules
 */

import './styles/main.css';
import { initializeApp } from './app';
import { Router, PageManager, HomePage, DonatePage, MapsPage, FoodPage, MessagesPage, SettingsPage, ProfilePage, OrganisationsPage } from '@/pages';

const router = Router.getInstance();
const pm = PageManager.getInstance();

// Register Routes
router.register(HomePage);
router.register(DonatePage);
router.register(MapsPage);
router.register(FoodPage);
router.register(MessagesPage);
router.register(SettingsPage);
router.register(ProfilePage);
router.register(OrganisationsPage);

// Bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();  // This initializes I18n, UI, routing
  pm.initialize('app-content');
  router.start();

  // Set up sidebar navigation button handlers
  const navButtons = document.querySelectorAll('.nav button[data-page]');
  navButtons.forEach(button => {
    const btn = button as HTMLButtonElement;
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) {
        router.navigate(`/${page}`);
      }
    });
  });

  // Profile button handler
  const profileButton = document.getElementById('profileButton');
  if (profileButton) {
    profileButton.addEventListener('click', () => {
      router.navigate('/profile');
    });
  }

  // Back button handlers
  document.querySelectorAll('[data-back]').forEach(button => {
    button.addEventListener('click', () => {
      window.history.back();
    });
  });
});