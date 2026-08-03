import { Injectable, computed, effect, signal } from '@angular/core';
import { TRANSLATIONS } from '../i18n/translations';

export const LANGUAGES = ['fr', 'en'] as const;
export type Lang = typeof LANGUAGES[number];

export const LANGUAGE_LABELS: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
};

const STORAGE_KEY = 'appLang';
const DEFAULT_LANG: Lang = 'fr';

function readStoredLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return LANGUAGES.includes(stored as Lang) ? (stored as Lang) : DEFAULT_LANG;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(readStoredLang());
  readonly languages = LANGUAGES;
  readonly labels = LANGUAGE_LABELS;

  /** Sent to the backend so AI-generated content is produced in the same language. */
  readonly currentLang = computed(() => this.lang());

  constructor() {
    effect(() => {
      const lang = this.lang();
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    });
  }

  setLang(lang: Lang): void {
    if (LANGUAGES.includes(lang)) {
      this.lang.set(lang);
    }
  }

  /**
   * Looks a key up in the active language. Reading the `lang` signal here is
   * what makes every template calling t() re-render on a language change.
   * An unknown key falls back to the French entry, then to the key itself, so
   * a missing translation degrades to visible text rather than a blank UI.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.lang();
    const value = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANG]?.[key] ?? key;
    if (!params) {
      return value;
    }
    return Object.entries(params).reduce(
      (text, [name, replacement]) => text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement)),
      value,
    );
  }
}
