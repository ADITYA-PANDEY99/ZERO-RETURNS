import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  const switchLanguage = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('zeroreturns-lang', code)
    setOpen(false)
  }

  return (
    <div className="tooltip-container" style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-sm"
        style={{ gap: 6, fontSize: '1rem' }}
        id="lang-switcher-btn"
        aria-label="Change language"
      >
        <span>{current.flag}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{current.code.toUpperCase()}</span>
        <span className="tooltip">Change Language</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                zIndex: 999,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 8,
                width: 180,
                boxShadow: 'var(--card-shadow)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: i18n.language === lang.code ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s',
                  }}
                  className="btn-ghost"
                >
                  <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>{lang.nativeName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{lang.name}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
