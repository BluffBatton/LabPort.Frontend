import { Injectable, signal } from '@angular/core';

import { SupportedLocale, TRANSLATIONS, TranslationKey } from './translations';

const localeStorageKey = 'labport.locale';
const defaultLocale: SupportedLocale = 'uk';

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  readonly locales: readonly { code: SupportedLocale; label: string }[] = [
    { code: 'uk', label: 'Українська' },
    { code: 'en', label: 'English' }
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

  dateLocale(): string {
    return this.locale() === 'uk' ? 'uk-UA' : 'en-US';
  }

  compareText(first: string | null | undefined, second: string | null | undefined): number {
    return (first ?? '').localeCompare(second ?? '', this.dateLocale(), { sensitivity: 'base' });
  }

  private restoreLocale(): SupportedLocale {
    const storedLocale = localStorage.getItem(localeStorageKey);

    if (storedLocale === 'en' || storedLocale === 'uk') {
      return storedLocale;
    }

    return defaultLocale;
  }
}
