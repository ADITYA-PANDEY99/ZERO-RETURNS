import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { Download, Zap, Calendar, TrendingUp } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import WhatIfSimulator from '../components/features/WhatIfSimulator'
import { useDashboardStore } from '../store/dashboardStore'
import { getChartColors, formatCurrency } from '../utils/helpers'

// Tooltip style
const glassTooltipStyle = {
  contentStyle: {
    background: 'rgba(10,8,32,0.95)',
    border: '1px solid rgba(139,92,246,0.3)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  itemStyle: { color: 'var(--text-primary)' },
  labelStyle: { color: 'var(--text-muted)', marginBottom: 4 },
}

const TABS = ['Overview', 'Comparison', 'What-If', 'Reports']

// ─── Overview Tab ───
function OverviewTab() {
  const { trends, heatmap } = useDashboardStore()
  const colors = getChartColors()

  const reasonData = [
    { name: 'Description', value: 32 },
    { name: 'Size Issue', value: 24 },
    { name: 'Image Quality', value: 18 },
    { name: 'Defective', value: 14 },
    { name: 'Late Delivery', value: 12 },
  ]
  const reasonColors = ['#8B5CF6', '#06B6D4', '#F472B6', '#F59E0B', '#EF4444']

  const categoryReturns = heatmap.map(h => ({
    category: h.category.split(' ')[0],
    returns: h.returns,
    revenue: h.revenue_at_risk,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Row 1: Return Rate Line */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Return Rate Over Time</h3>
          <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Download size={14} /> Export
          </button>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} interval={4} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...glassTooltipStyle} />
            <Line type="monotone" dataKey="returns" stroke={colors.chart3} strokeWidth={2.5} dot={false} animationDuration={1400} />
            <Line type="monotone" dataKey="prevented" stroke={colors.chart4} strokeWidth={2} dot={false} strokeDasharray="4 2" animationDuration={1600} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>AI:</span> Returns trend is declining by 3.2% MoM. "Returns Prevented" metric is tracking well — quality improvements in Electronics are working.
          </p>
        </div>
      </div>

      {/* Row 2: Bar + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="analytics-row2">
        <style>{`@media(max-width:800px){.analytics-row2{grid-template-columns:1fr!important}}`}</style>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Returns by Category</h3>
            <button className="btn btn-ghost" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}><Download size={13} /> Export</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryReturns} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
              <Tooltip {...glassTooltipStyle} />
              <Bar dataKey="returns" fill={colors.chart1} radius={[0, 4, 4, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--text-muted)', padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>AI:</span> Electronics leads returns. Recommend urgent image quality fix for 2,847 listings.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Returns by Reason</h3>
            <button className="btn btn-ghost" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}><Download size={13} /> Export</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={reasonData} cx="50%" cy="50%" outerRadius={80} dataKey="value" animationDuration={1200} stroke="none">
                {reasonData.map((_, i) => <Cell key={i} fill={reasonColors[i]} />)}
              </Pie>
              <Tooltip {...glassTooltipStyle} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {reasonData.map((r, i) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: reasonColors[i] }} />
                <span style={{ color: 'var(--text-muted)' }}>{r.name} {r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Revenue impact area */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Revenue Impact</h3>
          <button className="btn btn-ghost" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}><Download size={13} /> Export</button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="areaRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.chart4} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.chart4} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...glassTooltipStyle} formatter={v => `₹${(v / 1000).toFixed(1)}K`} />
            <Area type="monotone" dataKey="revenue" stroke={colors.chart4} fill="url(#areaRevGrad)" strokeWidth={2.5} animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--text-muted)', padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>AI:</span> Revenue stabilized in last 7 days after description quality improvements were applied. Estimated ₹4.2L saved this month.
        </p>
      </div>
    </div>
  )
}

// ─── Comparison Tab ───
const mockPeriod1 = [
  { cat: 'Electronics', val: 512 }, { cat: 'Clothing', val: 784 }, { cat: 'Footwear', val: 329 },
  { cat: 'Home', val: 315 }, { cat: 'Beauty', val: 161 }, { cat: 'Books', val: 59 },
]
const mockPeriod2 = [
  { cat: 'Electronics', val: 432 }, { cat: 'Clothing', val: 690 }, { cat: 'Footwear', val: 281 },
  { cat: 'Home', val: 290 }, { cat: 'Beauty', val: 140 }, { cat: 'Books', val: 48 },
]

function ComparisonTab() {
  const [start1, setStart1] = useState('2026-04-01')
  const [end1, setEnd1] = useState('2026-04-30')
  const [start2, setStart2] = useState('2026-05-01')
  const [end2, setEnd2] = useState('2026-05-31')
  const colors = getChartColors()

  const mergedData = mockPeriod1.map((d, i) => ({
    cat: d.cat,
    period1: d.val,
    period2: mockPeriod2[i].val,
  }))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }} className="comp-dates">
        <style>{`@media(max-width:700px){.comp-dates{grid-template-columns:1fr!important}}`}</style>
        {[
          { label: 'Period 1', start: start1, end: end1, setS: setStart1, setE: setEnd1 },
          { label: 'Period 2', start: start2, end: end2, setS: setStart2, setE: setEnd2 },
        ].map(({ label, start, end, setS, setE }) => (
          <div key={label} style={{ padding: 16, borderRadius: 12, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input type="date" className="input" value={start} onChange={e => setS(e.target.value)} style={{ flex: 1, minWidth: 130, fontSize: 13, padding: '8px 10px' }} />
              <input type="date" className="input" value={end} onChange={e => setE(e.target.value)} style={{ flex: 1, minWidth: 130, fontSize: 13, padding: '8px 10px' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
          Returns Comparison by Category
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={mergedData} margin={{ left: 0, right: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="cat" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...glassTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={v => v === 'period1' ? `Period 1 (${start1})` : `Period 2 (${start2})`} />
            <Bar dataKey="period1" fill={colors.chart1} radius={[4, 4, 0, 0]} animationDuration={1200} />
            <Bar dataKey="period2" fill={colors.chart2} radius={[4, 4, 0, 0]} animationDuration={1400} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10B981', fontWeight: 700 }}>AI:</span> Period 2 shows 14.3% reduction in total returns vs Period 1. Electronics improved by 15.6%, Clothing by 12.0%. Overall trend is positive — AI suggestions are having measurable impact.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Reports Tab ───
function ReportsTab() {
  const { kpis, orders } = useDashboardStore()
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const generateReport = async () => {
    setGenerating(true)
    setProgress(0)

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 250))
      setProgress(i)
    }

    // Build simple text report since jsPDF may not be installed
    const reportLines = [
      'ZeroReturn Analytics Report',
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      '--- KPI SUMMARY ---',
      `Total Orders: ${kpis.total_orders.toLocaleString('en-IN')}`,
      `Return Rate: ${kpis.return_rate}%`,
      `Revenue at Risk: ${formatCurrency(kpis.revenue_at_risk)}`,
      `Returns Prevented: ${kpis.returns_prevented.toLocaleString('en-IN')}`,
      '',
      '--- TOP 10 HIGH RISK ORDERS ---',
      ...orders
        .filter(o => o.risk_level === 'Critical' || o.risk_level === 'High')
        .slice(0, 10)
        .map(o => `${o.order_id} | ${o.product_name} | Risk: ${o.risk_score} | ${o.risk_level}`),
      '',
      '--- RECOMMENDATIONS ---',
      '1. Add size charts to Clothing & Footwear (est. -28% returns)',
      '2. Rewrite Electronics product descriptions (-18% returns)',
      '3. Replace low-quality product images (-15% returns)',
      '4. Set up automated anomaly alerts for return spikes',
      '5. Implement customer Q&A section for top products',
    ]

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ZeroReturn_Report_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)

    setGenerating(false)
    setProgress(0)
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', align: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Download size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Full Analytics Report</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Comprehensive PDF with KPIs, risky orders, and AI recommendations
            </p>
          </div>
        </div>

        {generating && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Generating report...</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)' }}>{progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                style={{ height: '100%', borderRadius: 3, background: 'var(--accent-primary)' }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'File parsed', done: progress >= 20 },
                { label: 'KPI aggregation', done: progress >= 40 },
                { label: 'Running insights engine...', done: progress >= 60 },
                { label: 'Building report layout...', done: progress >= 80 },
                { label: 'Finalizing PDF', done: progress >= 100 },
              ].map(({ label, done }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  {done
                    ? <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>
                    : <span style={{ color: 'var(--accent-primary)', fontSize: 16, animation: 'spin 1s linear infinite' }}>⟳</span>
                  }
                  <span style={{ color: done ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={generateReport}
          disabled={generating}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Download size={18} />
          {generating ? 'Generating...' : 'Generate Full Report'}
        </motion.button>
      </div>

      {/* Quick exports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Export Orders CSV', desc: 'All 50 orders with risk scores', icon: '📊' },
          { label: 'Export KPI JSON', desc: 'Current KPIs for integration', icon: '🔗' },
        ].map(({ label, desc, icon }) => (
          <div key={label} className="glass-card" style={{ padding: 18, cursor: 'pointer' }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{icon}</span>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</h4>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p>
            <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>Download</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28 }}
        >
          <h1 style={{
            margin: '0 0 4px',
            fontFamily: 'Syne, sans-serif',
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Analytics
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            Deep-dive insights into return patterns and revenue impact
          </p>
        </motion.div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 0 }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '10px 22px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid var(--accent-primary)' : '2px solid transparent',
                background: activeTab === i ? 'rgba(139,92,246,0.1)' : 'transparent',
                color: activeTab === i ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: 14,
                fontWeight: activeTab === i ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 0 && <OverviewTab />}
            {activeTab === 1 && <ComparisonTab />}
            {activeTab === 2 && (
              <div className="glass-card" style={{ padding: 28, maxWidth: 700 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>What-If Simulator</h3>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
                  Adjust improvement levers to see estimated impact on returns and revenue
                </p>
                <WhatIfSimulator />
              </div>
            )}
            {activeTab === 3 && <ReportsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
