import type { II18nManager, Language, TranslationMap } from './types';

export class I18nManager implements II18nManager {
  private static instance: I18nManager;
  private translations: Record<Language, TranslationMap> = { en: {}, te: {}, hi: {} };
  private currentLanguage: Language = 'en';

  private constructor() {}

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  async initialize(defaultLanguage: Language = 'en'): Promise<void> {
    // Load all three translation files from /locales/
    const [en, te, hi] = await Promise.all([
      fetch('/locales/en.json').then(r => r.json()),
      fetch('/locales/te.json').then(r => r.json()),
      fetch('/locales/hi.json').then(r => r.json()),
    ]);
    this.translations.en = en;
    this.translations.te = te;
    this.translations.hi = hi;
    await this.setLanguage(defaultLanguage);
  }

  async setLanguage(language: Language): Promise<void> {
    this.currentLanguage = language;
    document.documentElement.lang = language;
    this.applyTranslations();
    localStorage.setItem('language', language);
  }

  getCurrentLanguage(): Language { return this.currentLanguage; }

  translate(key: string, params?: Record<string, any>): string {
    const translation = this.translations[this.currentLanguage]?.[key] || this.translations.en[key] || key;
    if (!params) return translation;
    return translation.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? '');
  }

  t(key: string, params?: Record<string, any>): string { return this.translate(key, params); }

  private applyTranslations(): void {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n')!;
      const translation = this.translate(key);
      el.innerHTML = translation;
    });
  }
}