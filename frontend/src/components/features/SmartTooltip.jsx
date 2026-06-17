import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, BookOpen, Activity, Compass, Lightbulb, Percent } from 'lucide-react'

/**
 * SmartTooltip component
 * Renders a premium, interactive hover card providing detailed explanation of analytics, metrics and operations.
 */
export default function SmartTooltip({
  title,
  meaning,
  whyItMatters,
  formula,
  businessUse,
  simpleExplanation,
  children,
  placement = 'top' // 'top' | 'bottom' | 'left' | 'right'
}) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(true)
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setVisible(false)
    }, 150)
  }

  // Determine styles for placement
  const getPositionStyles = () => {
    switch (placement) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          transformOrigin: 'top center',
        }
      case 'left':
        return {
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
          transformOrigin: 'right center',
        }
      case 'right':
        return {
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
          transformOrigin: 'left center',
        }
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          transformOrigin: 'bottom center',
        }
    }
  }

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="smart-tooltip-wrapper"
    >
      {children}
      
      {/* Small subtle info indicator */}
      <span 
        style={{
          marginLeft: 6,
          color: 'var(--text-muted)',
          opacity: 0.7,
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'color 0.2s, opacity 0.2s'
        }}
        onMouseEnter={() => setVisible(true)}
        className="info-icon-hover"
      >
        <HelpCircle size={14} />
      </span>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: placement === 'bottom' ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: placement === 'bottom' ? -4 : 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              zIndex: 1000,
              width: 320,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 14,
              padding: 16,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
              backdropFilter: 'blur(24px)',
              pointerEvents: 'none', // Prevents mouse blocking
              ...getPositionStyles()
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--glass-border)', paddingBottom: 8, marginBottom: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <BookOpen size={12} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFF', letterSpacing: '0.02em' }}>
                {title}
              </span>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
              
              {/* Meaning */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-primary)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Compass size={10} /> Meaning
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.76rem', marginTop: 2, lineHeight: 1.35 }}>
                  {meaning}
                </p>
              </div>

              {/* Why It Matters */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-secondary)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Activity size={10} /> Why It Matters
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', marginTop: 2, lineHeight: 1.35 }}>
                  {whyItMatters}
                </p>
              </div>

              {/* Formula */}
              {formula && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-tertiary)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Percent size={10} /> Mathematical Formula
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.68rem',
                    color: 'var(--text-primary)',
                    marginTop: 4,
                    border: '1px solid rgba(255,255,255,0.03)',
                    wordBreak: 'break-all'
                  }}>
                    {formula}
                  </div>
                </div>
              )}

              {/* Business Use */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Lightbulb size={10} /> Business Actionable Use
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', marginTop: 2, lineHeight: 1.35 }}>
                  {businessUse}
                </p>
              </div>

              {/* Simple Explanation */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: 8,
                borderRadius: 8,
                marginTop: 2
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  💡 Simple Explanation (Beginner Friendly)
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.74rem', lineHeight: 1.3, fontWeight: 500 }}>
                  {simpleExplanation}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
