import { cookies } from 'next/headers';
import { Language, getServerTranslations } from './translations';

export function getLanguage() {
  const cookieStore = cookies();
  const lang = cookieStore.get('language')?.value as Language;
  return lang || 'en';
}

export function getTranslations() {
  const lang = getLanguage();
  return getServerTranslations(lang);
}
