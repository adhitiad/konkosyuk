import { getRequestConfig } from 'next-intl/server'
import { locales } from '../config'

const defaultLocale = 'id' as const

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locales.includes(locale as typeof locales[number])
    ? (locale as typeof locales[number])
    : defaultLocale

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  }
})