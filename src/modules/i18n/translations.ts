// Translation loader utility
import type { Language, TranslationMap } from './types';

const translationCache: Record<Language, TranslationMap> = {
  en: {},
  te: {},
  hi: {}
};

let cacheLoaded = false;

export async function loadTranslations(language: Language): Promise<TranslationMap> {
  if (cacheLoaded && translationCache[language]) {
    return translationCache[language];
  }

  const response = await fetch(`/locales/${language}.json`);
  const data = await response.json();
  translationCache[language] = data;
  cacheLoaded = true;
  return data;
}

export async function loadAllTranslations(): Promise<Record<Language, TranslationMap>> {
  const [en, te, hi] = await Promise.all([
    loadTranslations('en'),
    loadTranslations('te'),
    loadTranslations('hi'),
  ]);
  return { en, te, hi };
}

export function getCachedTranslations(language: Language): TranslationMap {
  return translationCache[language] || {};
}