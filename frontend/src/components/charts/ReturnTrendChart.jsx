import { useState } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { motion } from 'framer-motion'
import { TrendingDown, BarChart2, DollarSign, Zap } from 'lucide-react'
import { useDashboardStore } from '../../store/dashboardStore'
import { getChartColors } from '../../utils/helpers'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(15,12,41,0.95)',
      border: '1px solid rgba(139,92,246,0.3)',
      borderRadius: 12,
      padding: '12px 16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {entry.name}:
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {entry.name === 'revenue'
              ? `₹${(entry.value / 1000).toFixed(0)}K`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ReturnTrendChart() {
  const { trends, isLoading } = useDashboardStore()
  const colors = getChartColors()

  const [visible, setVisible] = useState({ orders: true, returns: true, revenue: true })
  const toggle = (key) => setVisible(v => ({ ...v, [key]: !v[key] }))

  const toggles = [
    { key: 'orders', label: 'Orders', color: colors.chart2, icon: BarChart2 },
    { key: 'returns', label: 'Returns', color: colors.chart3, icon: TrendingDown },
    { key: 'revenue', label: 'Revenue', color: colors.chart4, icon: DollarSign },
  ]

  if (isLoading) {
    return (
      <div className="glass-card" style={{ height: 340 }}>
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 20, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Return Trend (Last 30 Days)
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Orders, returns & revenue over time
          </p>
        </div>
        {/* Toggle buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {toggles.map(({ key, label, color, icon: Icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: `1px solid ${visible[key] ? color : 'rgba(255,255,255,0.1)'}`,
                background: visible[key] ? `${color}22` : 'transparent',
                color: visible[key] ? color : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={12} />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.chart4} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.chart4} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            interval={4}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          {visible.revenue && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              fill="url(#revenueGrad)"
              stroke={colors.chart4}
              strokeWidth={2}
              animationDuration={1500}
            />
          )}
          {visible.orders && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              stroke={colors.chart2}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: colors.chart2 }}
              animationDuration={1500}
            />
          )}
          {visible.returns && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="returns"
              stroke={colors.chart3}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: colors.chart3 }}
              animationDuration={1500}
              strokeDasharray="0"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* AI Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Zap size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--accent-primary)' }}>AI Insight:</strong> Return rate spike detected around Day 15 — primarily Electronics category. Suggest adding size charts and enhanced product descriptions to reduce by ~23%.
        </p>
      </motion.div>
    </motion.div>
  )
}
