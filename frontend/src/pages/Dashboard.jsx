import { useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, BarChart2 } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import KPICards from '../components/dashboard/KPICards'
import RiskTable from '../components/dashboard/RiskTable'
import AnomalyBanner from '../components/dashboard/AnomalyBanner'
import ReturnTrendChart from '../components/charts/ReturnTrendChart'
import CategoryHeatmap from '../components/charts/CategoryHeatmap'
import DraggableGrid from '../components/dashboard/DraggableGrid'
import { useIndustryStore } from '../store/industryStore'

export default function Dashboard() {
  const [isDraggable, setIsDraggable] = useState(false)
  const { activeIndustry, getIndustryData } = useIndustryStore()
  const indData = getIndustryData(activeIndustry)

  return (
    <AppLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{
                margin: 0,
                fontFamily: 'Syne, sans-serif',
                fontSize: 28,
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Dashboard
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
                Real-time {indData.concepts.return.toLowerCase()} risk intelligence — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {/* Draggable toggle */}
              <button
                onClick={() => setIsDraggable(v => !v)}
                className={isDraggable ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}
                title="Toggle draggable dashboard layout"
              >
                <LayoutGrid size={14} />
                {isDraggable ? 'Fixed Layout' : 'Drag Mode'}
              </button>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                fontSize: 12,
                fontWeight: 600,
                color: '#10B981',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  animation: 'pulse 2s infinite',
                }} />
                Live Data
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── DRAGGABLE MODE ── */}
        {isDraggable ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DraggableGrid />
          </motion.div>
        ) : (
          /* ── FIXED LAYOUT MODE ── */
          <>
            {/* Anomaly Banner */}
            <motion.div
              id="anomaly-banner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <AnomalyBanner />
            </motion.div>

            {/* KPI Cards */}
            <motion.div
              id="kpi-cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              style={{ marginBottom: 24 }}
            >
              <KPICards />
            </motion.div>

            {/* Row 2: Trend Chart + Category Snapshot */}
            <motion.div
              id="trend-chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: 20,
                marginBottom: 24,
              }}
              className="trend-row"
            >
              <style>{`
                @media (max-width: 900px) { .trend-row { grid-template-columns: 1fr !important; } }
              `}</style>
              <ReturnTrendChart />

              {/* Category snapshot sidebar */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Category Risk Snapshot
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {indData.categories.map((item) => (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.score}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 0.7, delay: 0.4 }}
                          style={{ height: '100%', borderRadius: 3, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Row 3: Full Category Heatmap */}
            <motion.div
              id="category-heatmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              style={{ marginBottom: 24 }}
            >
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Category Risk Heatmap
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Hover over cells for detailed breakdown
                    </p>
                  </div>
                </div>
                <CategoryHeatmap />
              </div>
            </motion.div>

            {/* Row 4: Full RiskTable */}
            <motion.div
              id="risk-table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              style={{ marginBottom: 32 }}
            >
              <RiskTable />
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
