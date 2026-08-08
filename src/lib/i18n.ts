export type Language = 'en' | 'id' | 'my' | 'th' | 'vi' | 'ko' | 'zh' | 'ru'

export const languages: Record<
  Language,
  { name: string; nativeName: string; flag: string }
> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  my: { name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
}