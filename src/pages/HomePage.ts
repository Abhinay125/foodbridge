import { PageConfig } from './types';
import { I18nManager } from '@/modules/i18n';

export const HomePage: PageConfig = {
  path: '/',
  title: 'home.title',
  init: async (container) => {
    const t = (k: string) => I18nManager.getInstance().t(k);
    
    container.innerHTML = `
      <header class="topbar">
        <h1 data-i18n="discoverFood">${t('discoverFood')}</h1>
      </header>

      <section class="intro">
        <h2 data-i18n="homeHeading">${t('homeHeading')}</h2>
        <p data-i18n="homeDescription">${t('homeDescription')}</p>
        <div class="home-actions">
          <a href="#/donate" class="btn btn--primary" data-i18n="home.ctaDonate">${t('home.ctaDonate')}</a>
        </div>
      </section>

      <section class="categories" aria-label="Food categories">
        <button class="category" data-category="Veg" type="button">
          <span class="arrow">↗</span>
          <span class="emoji">🥦</span>
          <h3 data-i18n="veg">${t('veg')}</h3>
          <p data-i18n="vegDescription">${t('vegDescription')}</p>
        </button>
        <button class="category" data-category="Non-Veg" type="button">
          <span class="arrow">↗</span>
          <span class="emoji">🍗</span>
          <h3 data-i18n="nonveg">${t('nonveg')}</h3>
          <p data-i18n="nonvegDescription">${t('nonvegDescription')}</p>
        </button>
      </section>

      <section class="live-impact">
        <h2 class="impact-heading" data-i18n="impact">${t('impact')}</h2>
        <p class="impact-subtitle" data-i18n="impactSubtitle">${t('impactSubtitle')}</p>
        <div class="impact-grid">
          <article class="impact-card">
            <div class="impact-icon">🍱</div>
            <div class="impact-value" id="mealsCount">1,284</div>
            <div class="impact-label" data-i18n="mealsRescued">${t('mealsRescued')}</div>
          </article>
          <article class="impact-card">
            <div class="impact-icon">💚</div>
            <div class="impact-value">856</div>
            <div class="impact-label" data-i18n="peopleHelped">${t('peopleHelped')}</div>
          </article>
          <article class="impact-card">
            <div class="impact-icon">♻️</div>
            <div class="impact-value">642 kg</div>
            <div class="impact-label" data-i18n="foodSaved">${t('foodSaved')}</div>
          </article>
          <article class="impact-card">
            <div class="impact-icon">🤝</div>
            <div class="impact-value" id="completedCount">128</div>
            <div class="impact-label" data-i18n="completedDonations">${t('completedDonations')}</div>
          </article>
        </div>
        <p class="impact-note" data-i18n="demoStats">${t('demoStats')}</p>
      </section>
    `;

    // Add click handlers for category buttons
    container.querySelectorAll<HTMLButtonElement>('.category').forEach(button => {
      button.addEventListener('click', () => {
        const category = button.dataset.category;
        if (category) {
          // Navigate to food page with category filter
          window.location.hash = `/food?category=${encodeURIComponent(category)}`;
        }
      });
    });
  },
  destroy: () => {}
};