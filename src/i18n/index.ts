// i18n setup for Paint Blok
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { translations } from './translations';

// Create i18n instance
const i18n = new I18n(translations);

// Set the locale based on device settings
const deviceLocale = getLocales()[0]?.languageTag || 'en';
i18n.locale = deviceLocale;

// Fallback to English if translation not found
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Helper function to translate
export const t = (key: string, options?: object): string => {
  return i18n.t(key, options);
};

// Get current locale
export const getLocale = (): string => {
  return i18n.locale;
};

// Change locale manually (if needed)
export const setLocale = (locale: string): void => {
  i18n.locale = locale;
};

export default i18n;
