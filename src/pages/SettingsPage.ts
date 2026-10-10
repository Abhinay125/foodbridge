import { PageConfig } from './types';
import { I18nManager } from '@/modules/i18n';

export const SettingsPage: PageConfig = {
  path: '/settings',
  title: 'settings.title',
  init: async (container) => {
    const t = (k: string) => I18nManager.getInstance().t(k);
    const i18n = I18nManager.getInstance();
    
    // Load notification preference from localStorage
    const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    
    container.innerHTML = `
      <div class="settings-page">
        <header class="page-header">
          <h1>${t('settings.title')}</h1>
        </header>
        
        <div class="settings-sections">
          <section class="settings-section">
            <h2>${t('settings.preferences')}</h2>
            <div class="form-group">
              <label for="language">${t('settings.language')}</label>
              <select id="language">
                <option value="en" ${i18n.getCurrentLanguage() === 'en' ? 'selected' : ''}>English</option>
                <option value="te" ${i18n.getCurrentLanguage() === 'te' ? 'selected' : ''}>తెలుగు (Telugu)</option>
                <option value="hi" ${i18n.getCurrentLanguage() === 'hi' ? 'selected' : ''}>हिन्दी (Hindi)</option>
              </select>
              <span class="form-help">${t('settings.languageHelp')}</span>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="notifications" ${notificationsEnabled ? 'checked' : ''}>
                <span>${t('settings.notifications')}</span>
              </label>
            </div>
            <button class="btn btn--primary" id="savePreferences">${t('settings.saveChanges')}</button>
          </section>
        </div>
        
        <div class="form-message" id="settingsMessage"></div>
      </div>
    `;

    const messageEl = container.querySelector('#settingsMessage') as HTMLElement;
    const notificationsCheckbox = container.querySelector('#notifications') as HTMLInputElement;
    
    // Save preferences (language, notifications)
    container.querySelector('#savePreferences')?.addEventListener('click', async () => {
      const language = (container.querySelector('#language') as HTMLSelectElement)?.value;
      const notifications = notificationsCheckbox.checked;
      
      try {
        if (language) {
          await i18n.setLanguage(language as 'en' | 'te' | 'hi');
        }
        
        // Save notification preference to localStorage
        localStorage.setItem('notificationsEnabled', notifications.toString());
        
        messageEl.textContent = t('settings.saved');
        messageEl.className = 'form-message success';
      } catch (err: any) {
        messageEl.textContent = err.message;
        messageEl.className = 'form-message error';
      }
    });
  },
  destroy: () => {}
};