import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const { theme, themes, setTheme } = useThemeStore()
  const ref = useRef(null)

  const themeList = Object.values(themes)

  return (
    <div className="tooltip-container" ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-sm"
        style={{ fontSize: '1.1rem', padding: '8px 10px' }}
        id="theme-switcher-btn"
        aria-label="Switch theme"
      >
        {themes[theme]?.emoji}
        <span className="tooltip">Change Theme</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 12px)',
                zIndex: 999,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 16,
                padding: 12,
                width: 280,
                boxShadow: 'var(--card-shadow)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, padding: '0 4px' }}>
                Select Theme
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {themeList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setOpen(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: theme === t.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      background: theme === t.id ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    className="btn-ghost"
                  >
                    <span style={{ fontSize: '1.3rem' }}>{t.emoji}</span>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t.description}</div>
                    </div>
                    {theme === t.id && (
                      <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
