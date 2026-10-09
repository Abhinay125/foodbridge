/**
 * FoodBridge - Main entry point
 * Initializes the application and all core modules
 */

import './styles/main.css';
import { initializeApp } from './app';

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}