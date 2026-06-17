import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Search, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../../store/dashboardStore'
import { useIndustryStore } from '../../store/industryStore'

export default function AnomalyBanner() {
  const { anomaly: dashboardAnomaly, dismissAnomaly } = useDashboardStore()
  const { activeIndustry, getIndustryData } = useIndustryStore()
  const indData = getIndustryData(activeIndustry)
  const navigate = useNavigate()

  const anomaly = dashboardAnomaly && dashboardAnomaly.active ? {
    ...dashboardAnomaly,
    message: indData.anomaly?.message || dashboardAnomaly.message
  } : null

  return (
    <AnimatePresence>
      {anomaly && anomaly.active && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(249,115,22,0.15) 100%)',
            border: '1px solid rgba(234,179,8,0.4)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backdropFilter: 'blur(12px)',
            marginBottom: '8px',
          }}
        >
          {/* Pulsing Icon */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(234,179,8,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={22} color="#EAB308" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid #EAB308',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                background: '#EAB308',
                color: '#000',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                ⚡ ANOMALY DETECTED
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5 }}>
              {anomaly.message}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(234,179,8,0.5)',
                background: 'rgba(234,179,8,0.15)',
                color: '#EAB308',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Search size={14} />
              Investigate
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={dismissAnomaly}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
