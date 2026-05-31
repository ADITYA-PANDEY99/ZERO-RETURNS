import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, ShoppingCart, RefreshCw, AlertCircle, Shield } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { formatCurrency, formatNumber, generateSparkline, animateCounter } from '../../utils/helpers'

const sparkDataSets = {
  total_orders: generateSparkline(12, 280, 500),
  return_rate: generateSparkline(12, 14, 28),
  revenue_at_risk: generateSparkline(12, 1800000, 3200000),
  returns_prevented: generateSparkline(12, 1200, 2400),
}

function KPICard({ title, rawValue, formatted, trend, trendGoodDown, sparkData, icon: Icon, color, delay }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [displayValue, setDisplayValue] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    animateCounter(0, rawValue, 1500, setDisplayValue)
  }, [rawValue])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * 12, y: -x * 12 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setHovered(false)
  }

  const trendPositive = trendGoodDown ? trend < 0 : trend > 0
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown
  const trendColor = trendPositive ? 'var(--success)' : 'var(--danger)'

  const sparkChartData = sparkData.map((v, i) => ({ i, v }))

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 120 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.02 : 1})`,
        transition: hovered ? 'transform 0.1s ease' : 'transform 0.4s ease',
        borderRadius: 16,
        padding: '24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.3), 0 0 30px ${color}22, inset 0 1px 0 rgba(255,255,255,0.1)`
          : '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Glow accent top-left */}
      <div style={{
        position: 'absolute',
        top: -20,
        left: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </p>
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}22`,
          border: `1px solid ${color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>

      {/* Value */}
      <div style={{ marginBottom: 12 }}>
        <motion.div
          style={{
            fontSize: 32,
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          {formatted(displayValue)}
        </motion.div>
      </div>

      {/* Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 6,
          background: `${trendColor}18`,
          border: `1px solid ${trendColor}33`,
        }}>
          <TrendIcon size={12} color={trendColor} />
          <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>
            {Math.abs(trend)}%
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs last month</span>
      </div>

      {/* Sparkline */}
      <div style={{ height: 52, marginLeft: -8, marginRight: -8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkChartData}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={1800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default function KPICards() {
  const { kpis } = useDashboardStore()

  const cards = [
    {
      title: 'Total Orders',
      rawValue: kpis.total_orders,
      formatted: (v) => formatNumber(v),
      trend: kpis.trend_total_orders,
      trendGoodDown: false,
      sparkData: sparkDataSets.total_orders,
      icon: ShoppingCart,
      color: '#3B82F6',
      delay: 0,
    },
    {
      title: 'Return Rate',
      rawValue: Math.round(kpis.return_rate * 10),
      formatted: (v) => `${(v / 10).toFixed(1)}%`,
      trend: kpis.trend_return_rate,
      trendGoodDown: true,
      sparkData: sparkDataSets.return_rate,
      icon: RefreshCw,
      color: '#EF4444',
      delay: 0.08,
    },
    {
      title: 'Revenue at Risk',
      rawValue: kpis.revenue_at_risk,
      formatted: (v) => formatCurrency(v),
      trend: kpis.trend_revenue_at_risk,
      trendGoodDown: true,
      sparkData: sparkDataSets.revenue_at_risk,
      icon: AlertCircle,
      color: '#F97316',
      delay: 0.16,
    },
    {
      title: 'Returns Prevented',
      rawValue: kpis.returns_prevented,
      formatted: (v) => formatNumber(v),
      trend: kpis.trend_returns_prevented,
      trendGoodDown: false,
      sparkData: sparkDataSets.returns_prevented,
      icon: Shield,
      color: '#10B981',
      delay: 0.24,
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20,
    }}
    className="kpi-grid"
    >
      <style>{`
        @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .kpi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  )
}
