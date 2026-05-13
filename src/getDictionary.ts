import 'server-only';

const dictionaries = {
  tr: () => import('./dictionaries/tr.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  ar: () => import('./dictionaries/ar.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => {
  // Return the specified dictionary or fallback to Turkish
  return dictionaries[locale]?.() ?? dictionaries.tr();
};
