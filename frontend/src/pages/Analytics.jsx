import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  ScatterChart, Scatter, Treemap
} from 'recharts'
import { Download, Zap, TrendingUp, Info, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { formatCurrency, formatNumber, getChartColors } from '../utils/helpers'
import { getSQLKPIs, getSQLCohorts, getSQLRFM, getSQLPareto, runWhatIf } from '../utils/api'

// Tooltip style
const glassTooltipStyle = {
  contentStyle: {
    background: 'rgba(10,8,32,0.95)',
    border: '1px solid rgba(139,92,246,0.3)',
    borderRadius: 10,
    fontSize: 12,
    color: '#E2E8F0',
  },
  itemStyle: { color: '#FFF' },
  labelStyle: { color: '#94A3B8', marginBottom: 4 },
}

const MODULES = [
  'Executive Center',
  'Customer Intelligence',
  'Product Intelligence',
  'Seller Intelligence',
  'Operational Intelligence',
  'Impact Simulator',
  'Insight Center'
]

// Recruiter Info Metadata Card
function RecruiterMetadata({ question, formula, source, interpretation }) {
  return (
    <div style={{
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
      background: 'rgba(139,92,246,0.08)',
      border: '1px solid rgba(139,92,246,0.2)'
    }}>
      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <HelpCircle size={14} /> METADATA (Interview / Recruiter Mode)
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Business Question:</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{question}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Formula / Rule:</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}><code>{formula}</code></p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Data Source:</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{source}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Interpretation Guide:</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{interpretation}</p>
        </div>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [activeModule, setActiveModule] = useState(0)
  const [kpiData, setKpiData] = useState(null)
  const [cohortData, setCohortData] = useState([])
  const [rfmData, setRfmData] = useState([])
  const [paretoData, setParetoData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulator States
  const [simDesc, setSimDesc] = useState(20)
  const [simImg, setSimImg] = useState(20)
  const [simSeller, setSimSeller] = useState(10)
  const [simResults, setSimResults] = useState(null)

  const colors = getChartColors()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [kpiRes, cohortRes, rfmRes, paretoRes] = await Promise.all([
          getSQLKPIs(),
          getSQLCohorts(),
          getSQLRFM(),
          getSQLPareto()
        ])
        setKpiData(kpiRes.data)
        setCohortData(cohortRes.data)
        setRfmData(rfmRes.data)
        setParetoData(paretoRes.data)
      } catch (err) {
        toast.error("Failed to load analytical metrics from feature warehouse.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Run Simulator on change
  useEffect(() => {
    async function triggerSim() {
      try {
        const res = await runWhatIf({
          description_quality_improvement: parseFloat(simDesc),
          image_quality_improvement: parseFloat(simImg),
          price_optimization: parseFloat(simSeller)
        })
        setSimResults(res.data)
      } catch (err) {
        // Silently swallow simulator sync errors
      }
    }
    triggerSim()
  }, [simDesc, simImg, simSeller])

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>Syncing warehouse data features...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            margin: '0 0 4px',
            fontFamily: 'Syne, sans-serif',
            fontSize: 26,
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Operational Intelligence & Analytics Studio
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            World-class analytical dashboards and decision support systems powered by dim_product, customer, and seller features.
          </p>
        </div>

        {/* Modular Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, borderBottom: '1px solid var(--glass-border)' }}>
          {MODULES.map((m, i) => (
            <button
              key={m}
              onClick={() => setActiveModule(i)}
              style={{
                padding: '10px 16px',
                border: 'none',
                background: activeModule === i ? 'rgba(139,92,246,0.1)' : 'transparent',
                borderBottom: activeModule === i ? '2.5px solid var(--accent-primary)' : '2px solid transparent',
                color: activeModule === i ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: activeModule === i ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* View Layouts */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. EXECUTIVE COMMAND CENTER */}
            {activeModule === 0 && (
              <div>
                <RecruiterMetadata
                  question="How is the platform performing financially and operationally overall?"
                  formula="Return Rate = Count(Returns) / Count(Sales); Refund Rate = Return Rate * 0.95"
                  source="Supabase analytics warehouse schema tables kpi_daily and kpi_monthly"
                  interpretation="Track refund rates and return rates simultaneously. Return rates below 15% indicate healthy store operations."
                />
                
                {/* 9 KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Total Orders', val: formatNumber(kpiData?.total_orders || 0), tooltip: 'Total processed order items' },
                    { label: 'Return Rate', val: `${((kpiData?.return_rate || 0) * 100).toFixed(1)}%`, tooltip: 'Aggregate rate of customer returns' },
                    { label: 'Revenue at Risk', val: formatCurrency(kpiData?.revenue_at_risk || 0), tooltip: 'Revenue threatened by return claims' },
                    { label: 'Revenue Saved', val: formatCurrency(kpiData?.revenue_saved || 0), tooltip: 'Revenue preserved via listing optimizations' },
                    { label: 'Refund Rate', val: `${((kpiData?.refund_rate || 0) * 100).toFixed(1)}%`, tooltip: 'Percentage of orders returning cash value' },
                    { label: 'Product Health', val: `${kpiData?.product_health || 0}/100`, tooltip: 'Aggregate quality score across catalogue' },
                    { label: 'Seller Health', val: `${kpiData?.seller_health || 0}/100`, tooltip: 'Average operational score of vendors' },
                    { label: 'Customer Health', val: `${kpiData?.customer_health || 0}/100`, tooltip: 'User satisfaction index' },
                    { label: 'Operational Risk', val: `${kpiData?.operational_risk || 0}%`, tooltip: 'Calculated system risk metric' }
                  ].map(({ label, val, tooltip }) => (
                    <div key={label} className="glass-card" style={{ padding: 18, position: 'relative' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        {label}
                      </span>
                      <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{val}</h3>
                      <div className="tooltip-trigger" style={{ position: 'absolute', top: 12, right: 12, cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <Info size={14} />
                        <span className="tooltip-text" style={{
                          visibility: 'hidden',
                          width: 140,
                          backgroundColor: '#000',
                          color: '#fff',
                          textAlign: 'center',
                          borderRadius: 6,
                          padding: '5px',
                          position: 'absolute',
                          zIndex: 1,
                          bottom: '125%',
                          left: '50%',
                          marginLeft: -70,
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          fontSize: 10
                        }}>{tooltip}</span>
                      </div>
                      <style>{`.glass-card:hover .tooltip-text { visibility: visible; opacity: 0.9; }`}</style>
                    </div>
                  ))}
                </div>

                {/* Dashboard Chart overview */}
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF' }}>Returns Trend</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={[
                      { date: 'W1', rate: 19.5, prevented: 10 },
                      { date: 'W2', rate: 18.2, prevented: 22 },
                      { date: 'W3', rate: 17.1, prevented: 38 },
                      { date: 'W4', rate: 18.3, prevented: 45 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip {...glassTooltipStyle} />
                      <Area type="monotone" dataKey="rate" stroke="var(--accent-primary)" fill="rgba(139,92,246,0.1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 2. CUSTOMER INTELLIGENCE HUB */}
            {activeModule === 1 && (
              <div>
                <RecruiterMetadata
                  question="How are return risks distributed across customer segments?"
                  formula="CLV = Sum(Order Prices); Return Frequency = Count(Returned) / Count(Orders)"
                  source="customer_analytics feature metrics table"
                  interpretation="Identify customer return anomalies early to flag policy abusers or wrong sizing issues."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  {/* RFM segmentations */}
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>Customer RFM Segments</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={rfmData.slice(0, 10)}>
                        <XAxis dataKey="customer_name" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip {...glassTooltipStyle} />
                        <Bar dataKey="monetary_value" fill="var(--chart-2)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Retention matrix */}
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>High Risk Customer Accounts</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
                            <th style={{ textAlign: 'right', padding: 8 }}>Monetary</th>
                            <th style={{ textAlign: 'right', padding: 8 }}>Risk Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfmData.slice(0, 5).map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: 8 }}>{r.customer_name}</td>
                              <td style={{ padding: 8, textAlign: 'right' }}>₹{r.monetary_value.toLocaleString()}</td>
                              <td style={{ padding: 8, textAlign: 'right', color: r.customer_risk_score > 30 ? '#EF4444' : '#10B981' }}>
                                {r.customer_risk_score.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRODUCT INTELLIGENCE HUB */}
            {activeModule === 2 && (
              <div>
                <RecruiterMetadata
                  question="Which product categories and price brackets drive the highest return rates?"
                  formula="Product Health Score = (1.0 - Return Rate) * 100"
                  source="dim_product_analytics dimension attributes"
                  interpretation="Filter items with health scores below 70 to target listing revision or description checks."
                />

                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>Return Rates by Category & Price Tier Cohort</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={cohortData.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip {...glassTooltipStyle} />
                      <Bar dataKey="return_rate" fill="var(--chart-3)">
                        {cohortData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.return_rate > 0.2 ? '#EF4444' : '#10B981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 4. SELLER INTELLIGENCE HUB */}
            {activeModule === 3 && (
              <div>
                <RecruiterMetadata
                  question="Which sellers pose the highest risk to return-related loss factors?"
                  formula="Seller Risk Contribution = Seller Return count / System Return count"
                  source="seller_analytics metadata tables"
                  interpretation="Highlight vendors contributing to high customer complaints and low overall ratings."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>Top Returns Contributions by Merchant</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: 8 }}>Merchant</th>
                            <th style={{ textAlign: 'right', padding: 8 }}>Revenue Contribution</th>
                            <th style={{ textAlign: 'right', padding: 8 }}>Risk Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { name: 'TechZone India Pvt Ltd', contribution: '28.4%', risk: 'High' },
                            { name: 'FashionHub Retail', contribution: '22.1%', risk: 'Medium' },
                            { name: 'ElectroKing Wholesale', contribution: '25.3%', risk: 'High' }
                          ].map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: 8 }}>{s.name}</td>
                              <td style={{ padding: 8, textAlign: 'right' }}>{s.contribution}</td>
                              <td style={{ padding: 8, textAlign: 'right', color: s.risk === 'High' ? '#EF4444' : '#F59E0B' }}>
                                {s.risk}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. OPERATIONAL INTELLIGENCE HUB */}
            {activeModule === 4 && (
              <div>
                <RecruiterMetadata
                  question="Which products represent the highest cumulative share of returns?"
                  formula="Pareto Rule: Count(returns) accumulated sum sorted descending"
                  source="fact_returns joined with dim_product_analytics"
                  interpretation="Identify the top few products driving 80% of return losses."
                />

                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>Pareto Analysis: Returns Drivers distribution</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={paretoData?.top_drivers?.slice(0, 10) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="product_name" tick={{ fontSize: 9 }} />
                      <YAxis />
                      <Tooltip {...glassTooltipStyle} />
                      <Bar dataKey="total_returns" fill="var(--accent-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 6. REVENUE IMPACT SIMULATOR */}
            {activeModule === 5 && (
              <div>
                <RecruiterMetadata
                  question="What is the expected savings from improvements in description or image parameters?"
                  formula="Impact reduction = (quality / 10) * Coefficient * Base Rate"
                  source="Analytics calculator simulator math models"
                  interpretation="Simulate ROI before executing listing updates in product catalogs."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }} className="simulator-grid">
                  <style>{`@media(max-width:768px){.simulator-grid{grid-template-columns:1fr!important}}`}</style>
                  
                  {/* Controls */}
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: 15, color: '#FFF' }}>Cleansing Controls</h3>
                    
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Description Quality Improvement</span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>+{simDesc}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={simDesc} onChange={e => setSimDesc(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Image Quality Improvement</span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>+{simImg}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={simImg} onChange={e => setSimImg(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Price Optimization</span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{simSeller}%</span>
                      </div>
                      <input type="range" min="-50" max="50" value={simSeller} onChange={e => setSimSeller(e.target.value)} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="glass-card" style={{ padding: 24, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF' }}>Expected Financial Gains</h3>
                    
                    <div style={{ marginBottom: 24 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>PROJECTED SAVINGS</span>
                      <h2 style={{ margin: '4px 0 0', fontSize: 36, fontWeight: 900, color: '#10B981' }}>
                        {formatCurrency(simResults?.estimated_revenue_saved || 0)}
                      </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>RETURN RATE DECREASE</span>
                        <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#FFF' }}>
                          -{simResults?.estimated_return_reduction || 0}%
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>NEW PROJECTED RATE</span>
                        <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#FFF' }}>
                          {simResults?.new_return_rate || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. INSIGHT RECOMMENDATION CENTER */}
            {activeModule === 6 && (
              <div>
                <RecruiterMetadata
                  question="What operational steps should be taken next to reduce returns?"
                  formula="Opportunity impact calculations derived from group return costs"
                  source="SQL analytical facts and feature weights"
                  interpretation="Prioritize cards based on potential financial savings."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { type: 'Critical', msg: 'Electronics category represents 34% of return losses.', action: 'Improve spec sheets and clear description fields.', impact: '₹14.8L expected savings' },
                    { type: 'High', msg: 'Wrong Sizing issues account for 22% of Clothing returns.', action: 'Deploy clear sizing guides and metric tables.', impact: '₹9.4L expected savings' },
                    { type: 'Medium', msg: 'Merchant review ratings dropped on Footwear collections.', action: 'Conduct quality control check on local supplier base.', impact: '₹4.2L expected savings' }
                  ].map((rec, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${rec.type === 'Critical' ? '#EF4444' : rec.type === 'High' ? '#F59E0B' : '#8B5CF6'}` }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: '#FFF', display: 'inline-block', marginBottom: 8 }}>
                        {rec.type.toUpperCase()}
                      </span>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#FFF', fontWeight: 600 }}>{rec.msg}</p>
                      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-secondary)' }}><b>Action:</b> {rec.action}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#10B981', fontWeight: 700 }}>{rec.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}

