import { createI18n } from 'next-international';

export const {
  useI18n,
  useScopedI18n,
  I18nProvider,
  useChangeLocale,
  useCurrentLocale,
  defineLocale,
} = createI18n({
  en: () => import('./locales/en'),
  'zh-CN': () => import('./locales/zh-CN'),
}); 