export type Language = 'en' | 'te' | 'hi';
export interface TranslationMap { [key: string]: string; }

export interface II18nManager {
  initialize(defaultLanguage?: Language): Promise<void>;
  setLanguage(language: Language): Promise<void>;
  getCurrentLanguage(): Language;
  translate(key: string, params?: Record<string, any>): string;
  t(key: string, params?: Record<string, any>): string;
}