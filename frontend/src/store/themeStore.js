import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const THEMES = {
  glass: {
    id: 'glass',
    name: 'Glass',
    emoji: '🔮',
    description: 'Glassmorphism + Neon purple/cyan',
  },
  'dark-luxury': {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    emoji: '🖤',
    description: 'Deep black + Electric blue',
  },
  'deep-space': {
    id: 'deep-space',
    name: 'Deep Space',
    emoji: '🌌',
    description: 'Dark navy + Gold accents',
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic',
    emoji: '❄️',
    description: 'Ice white + Cyan',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    emoji: '🔥',
    description: 'Dark charcoal + Orange/Red',
  },
  'neo-corporate': {
    id: 'neo-corporate',
    name: 'Neo Corporate',
    emoji: '🏢',
    description: 'Steel blue + Charcoal',
  },
  'midnight-finance': {
    id: 'midnight-finance',
    name: 'Midnight Finance',
    emoji: '📈',
    description: 'Deep navy + Gold & Emerald',
  },
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'glass',
      themes: THEMES,
      setTheme: (themeId) => {
        document.documentElement.setAttribute('data-theme', themeId)
        set({ theme: themeId })
      },
      initTheme: () => {
        const { theme } = get()
        document.documentElement.setAttribute('data-theme', theme)
      },
    }),
    {
      name: 'zeroreturns-theme',
    }
  )
)
