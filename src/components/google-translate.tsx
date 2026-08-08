'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'

export function GoogleTranslate() {
  const { language } = useLanguage()

  useEffect(() => {
    if (typeof window === 'undefined') return

    document.cookie = `googtrans=/${language}; path=/`
    document.cookie = `googtrans=/${language}; path=/; domain=${window.location.hostname}`
  }, [language])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const existing = document.getElementById('google-translate-script')
    if (existing) return

    const script = document.createElement('script')
    script.id = 'google-translate-script'
    script.type = 'text/javascript'
    script.async = true
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'

    const initTranslate = () => {
      try {
        const gt = (window as Window & { google?: { translate?: { TranslateElement: new (config: unknown, elementId: string) => void } } }).google
        if (gt?.translate) {
          new gt.translate.TranslateElement(
            {
              pageLanguage: 'id',
              includedLanguages: 'en,id,my,th,vi,ko,zh,ru',
              layout: 0,
              autoDisplay: false,
            },
            'google-translate-element',
          )
        }
      } catch {
        // ignore initialization errors
      }
    }

    ;(window as unknown as Window & Record<string, unknown>).googleTranslateElementInit = initTranslate

    document.body.appendChild(script)

    return () => {
      script.remove()
      delete (window as unknown as Window & Record<string, unknown>).googleTranslateElementInit
    }
  }, [])

  return (
    <div
      id="google-translate-element"
      style={{ display: 'none' }}
    />
  )
}