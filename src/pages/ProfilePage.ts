import { PageConfig } from './types';
import { I18nManager } from '@/modules/i18n';

export const ProfilePage: PageConfig = {
  path: '/profile',
  title: 'profile.title',
  init: async (container) => {
    const t = (k: string) => I18nManager.getInstance().t(k);
    
    container.innerHTML = `
      <div class="profile-page">
        <header class="page-header">
          <h1>${t('profile.title')}</h1>
          <a href="#/settings" class="btn btn--secondary">${t('profile.edit')}</a>
        </header>
        
        <div class="profile-content">
          <section class="profile-header-card">
            <div class="profile-avatar large">${t('profile.guest')[0]?.toUpperCase() || 'U'}</div>
            <div class="profile-info">
              <h2>${t('profile.guest')}</h2>
              <p class="profile-email">${t('profile.guestDescription')}</p>
              <span class="profile-role badge badge--donor">${t('profile.donor')}</span>
            </div>
          </section>
          
          <section class="profile-details">
            <h3>${t('profile.details')}</h3>
            <div class="detail-row">
              <span class="detail-label">${t('profile.memberSince')}</span>
              <span class="detail-value">${t('profile.notSet')}</span>
            </div>
          </section>
        </div>
      </div>
    `;
  },
  destroy: () => {}
};