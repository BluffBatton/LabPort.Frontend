import { Injectable, signal } from '@angular/core';

import { SupportedLocale, TRANSLATIONS, TranslationKey } from './translations';

const localeStorageKey = 'labport.locale';
const defaultLocale: SupportedLocale = 'en';

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  readonly locales: readonly { code: SupportedLocale; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'pl', label: 'Polski' }
  ];

  private readonly localeState = signal<SupportedLocale>(this.restoreLocale());
  readonly locale = this.localeState.asReadonly();

  setLocale(locale: SupportedLocale): void {
    this.localeState.set(locale);
    localStorage.setItem(localeStorageKey, locale);
  }

  t(key: TranslationKey): string {
    return TRANSLATIONS[this.locale()][key] ?? TRANSLATIONS[defaultLocale][key] ?? key;
  }

  private restoreLocale(): SupportedLocale {
    const storedLocale = localStorage.getItem(localeStorageKey);

    if (storedLocale === 'en' || storedLocale === 'pl') {
      return storedLocale;
    }

    return defaultLocale;
  }
}
