import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '../../store/dashboardStore'
import { formatCurrency, formatNumber } from '../../utils/helpers'

const getRiskInterpolatedColor = (score) => {
  if (score >= 80) return { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)', bar: '#EF4444', text: '#EF4444' }
  if (score >= 60) return { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', bar: '#F97316', text: '#F97316' }
  if (score >= 40) return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', bar: '#F59E0B', text: '#F59E0B' }
  if (score >= 20) return { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.3)', bar: '#10B981', text: '#10B981' }
  return { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', bar: '#10B981', text: '#6EE7B7' }
}

export default function CategoryHeatmap() {
  const { heatmap } = useDashboardStore()
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const sorted = [...heatmap].sort((a, b) => b.risk_score - a.risk_score)

  const handleMouseEnter = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
    setTooltip(item)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y - 140,
              transform: 'translateX(-50%)',
              zIndex: 999,
              background: 'rgba(10,8,32,0.95)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 12,
              padding: '14px 16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              minWidth: 200,
              pointerEvents: 'none',
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {tooltip.category}
            </p>
            {[
              { label: 'Risk Score', value: `${tooltip.risk_score}/100` },
              { label: 'Total Orders', value: formatNumber(tooltip.orders) },
              { label: 'Returns', value: formatNumber(tooltip.returns) },
              { label: 'Return Rate', value: `${((tooltip.returns / tooltip.orders) * 100).toFixed(1)}%` },
              { label: 'Revenue at Risk', value: formatCurrency(tooltip.revenue_at_risk) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div
        className="heatmap-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}
      >
        <style>{`
          @media (max-width: 1024px) { .heatmap-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 640px)  { .heatmap-grid { grid-template-columns: 1fr !important; } }
        `}</style>
        {sorted.map((item, idx) => {
          const c = getRiskInterpolatedColor(item.risk_score)
          return (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06, type: 'spring', stiffness: 150 }}
              onMouseEnter={e => handleMouseEnter(e, item)}
              onMouseLeave={() => setTooltip(null)}
              whileHover={{ scale: 1.04, y: -2 }}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '16px 14px',
                cursor: 'default',
                boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {item.category}
                </p>
                <span style={{
                  fontSize: 18,
                  fontWeight: 900,
                  fontFamily: 'Syne, sans-serif',
                  color: c.text,
                  lineHeight: 1,
                }}>
                  {item.risk_score}
                </span>
              </div>
              {/* Score bar */}
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 10 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.risk_score}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.07 }}
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: c.bar,
                    boxShadow: `0 0 8px ${c.bar}88`,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatNumber(item.orders)} orders
                </span>
                <span style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>
                  {((item.returns / item.orders) * 100).toFixed(0)}% return
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
