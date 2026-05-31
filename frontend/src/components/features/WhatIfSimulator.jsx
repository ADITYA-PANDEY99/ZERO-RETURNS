import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sliders, TrendingDown, DollarSign, Zap } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { formatCurrency } from '../../utils/helpers'

export default function WhatIfSimulator() {
  const { kpis } = useDashboardStore()
  const [descQuality, setDescQuality] = useState(0)
  const [imageQuality, setImageQuality] = useState(0)
  const [priceOpt, setPriceOpt] = useState(0)

  const reduction = useCallback(() => {
    return (descQuality * 0.35 + imageQuality * 0.25 + priceOpt * 0.20) * kpis.return_rate / 100
  }, [descQuality, imageQuality, priceOpt, kpis.return_rate])

  const revenueSaved = useCallback(() => {
    return reduction() * kpis.revenue_at_risk / 100
  }, [reduction, kpis.revenue_at_risk])

  const reductionVal = reduction()
  const savedVal = revenueSaved()

  const sliders = [
    {
      label: 'Description Quality Improvement',
      value: descQuality,
      setter: setDescQuality,
      icon: '📝',
      color: '#8B5CF6',
      impact: '35% weight',
    },
    {
      label: 'Image Quality Improvement',
      value: imageQuality,
      setter: setImageQuality,
      icon: '🖼️',
      color: '#06B6D4',
      impact: '25% weight',
    },
    {
      label: 'Price Optimization',
      value: priceOpt,
      setter: setPriceOpt,
      icon: '💰',
      color: '#10B981',
      impact: '20% weight',
    },
  ]

  return (
    <div>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 28 }}>
        {sliders.map((slider) => (
          <div key={slider.label}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{slider.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {slider.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                }}>
                  {slider.impact}
                </span>
                <motion.span
                  key={slider.value}
                  initial={{ scale: 1.3, color: slider.color }}
                  animate={{ scale: 1, color: slider.color }}
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    fontFamily: 'Syne, sans-serif',
                    minWidth: 48,
                    textAlign: 'right',
                  }}
                >
                  {slider.value}%
                </motion.span>
              </div>
            </div>

            {/* Custom Slider Track */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.08)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    width: `${slider.value}%`,
                    background: `linear-gradient(90deg, ${slider.color}88, ${slider.color})`,
                    borderRadius: 4,
                    boxShadow: `0 0 10px ${slider.color}66`,
                  }}
                  animate={{ width: `${slider.value}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={slider.value}
                onChange={(e) => slider.setter(Number(e.target.value))}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Return Reduction */}
        <motion.div
          animate={{ scale: reductionVal > 0 ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.06) 100%)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
          }}
        >
          <TrendingDown size={24} color="#EF4444" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Return Reduction
          </div>
          <motion.div
            key={reductionVal.toFixed(2)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: 'Syne, sans-serif',
              color: '#EF4444',
              lineHeight: 1,
            }}
          >
            {reductionVal.toFixed(1)}%
          </motion.div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            of current {kpis.return_rate}% rate
          </div>
        </motion.div>

        {/* Revenue Saved */}
        <motion.div
          animate={{ scale: savedVal > 0 ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.06) 100%)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
          }}
        >
          <DollarSign size={24} color="#10B981" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Revenue Saved
          </div>
          <motion.div
            key={Math.round(savedVal)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: 'Syne, sans-serif',
              color: '#10B981',
              lineHeight: 1,
            }}
          >
            {formatCurrency(Math.round(savedVal))}
          </motion.div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            of {formatCurrency(kpis.revenue_at_risk)} at risk
          </div>
        </motion.div>
      </div>

      {reductionVal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Zap size={16} color="var(--accent-primary)" />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent-primary)' }}>AI Insight:</strong> Focus on description quality first — it has the highest ROI at 35% weight. Even a 40% improvement can save {formatCurrency(Math.round(0.40 * 0.35 * kpis.return_rate / 100 * kpis.revenue_at_risk))} monthly.
          </p>
        </motion.div>
      )}
    </div>
  )
}
