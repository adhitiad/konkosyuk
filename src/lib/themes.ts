export type Theme = 'light' | 'dark' | 'aurora'

export const themes: Record<Theme, { name: string; class: string }> = {
  light: {
    name: 'Light',
    class: 'light',
  },
  dark: {
    name: 'Dark',
    class: 'dark',
  },
  aurora: {
    name: 'Aurora',
    class: 'aurora',
  },
}