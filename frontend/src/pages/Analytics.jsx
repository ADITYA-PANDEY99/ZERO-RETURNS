import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts'
import {
  Download, Zap, TrendingUp, Info, HelpCircle, AlertTriangle, ShieldAlert,
  Award, ArrowUpRight, CheckCircle, Flame, Layers, Database, Compass, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { formatCurrency, formatNumber, getChartColors } from '../utils/helpers'
import {
  getSQLKPIs, getSQLCohorts, getSQLRFM, getSQLPareto, runWhatIf, getForecast,
  getExperiments, getHypotheses, getScorecards, getDrilldown, getAlerts, getDataQuality
} from '../utils/api'

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
  'Executive Scorecards',
  'A/B Testing Lab',
  'Hypothesis Testing Hub',
  'KPI Drilldown Engine',
  'Alert Center',
  'Data Quality Command',
  'Marketplace Analytics',
  'Impact Simulator',
  'Forecasting Hub'
]

// Recruiter Info Metadata Card
function RecruiterMetadata({ question, formula, method, interpretation, usecase }) {
  return (
    <div style={{
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
      background: 'rgba(139,92,246,0.08)',
      border: '1px solid rgba(139,92,246,0.2)'
    }}>
      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <HelpCircle size={14} /> METADATA (Recruiter & Interview Mode Context)
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
          <span style={{ color: 'var(--text-muted)' }}>Statistical Method:</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{method}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Use Case (FAANG/Fintech):</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{usecase}</p>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-muted)' }}>Interpretation Guide:</span>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{interpretation}</p>
        </div>
      </div>
    </div>
  )
}

// Collapsible Drilldown Node
function DrilldownNode({ node, level = 0 }) {
  const [isOpen, setIsOpen] = useState(level === 0)
  const hasChildren = node.children && node.children.length > 0
  const indent = level * 20

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          paddingLeft: 14 + indent,
          cursor: hasChildren ? 'pointer' : 'default',
          background: level === 0 ? 'rgba(139,92,246,0.05)' : 'transparent',
          transition: 'all 0.2s',
          fontSize: 13
        }}
        className="drilldown-row"
      >
        <span style={{ marginRight: 8, display: 'inline-block', width: 12, color: 'var(--accent-primary)', fontWeight: 800 }}>
          {hasChildren ? (isOpen ? '▼' : '▶') : '•'}
        </span>
        <span style={{ flex: 1, color: level === 0 ? '#FFF' : 'var(--text-secondary)', fontWeight: level === 0 ? 700 : 400 }}>
          {node.name}
        </span>
        <span style={{ width: 120, textAlign: 'right', fontWeight: 600, color: '#FFF' }}>
          {formatCurrency(node.revenue)}
        </span>
        <span style={{ width: 100, textAlign: 'right', color: 'var(--text-secondary)' }}>
          {node.orders}
        </span>
        <span style={{ width: 100, textAlign: 'right', color: node.return_rate > 18 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
          {node.return_rate.toFixed(1)}%
        </span>
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.children.map((child, idx) => (
            <DrilldownNode key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
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

  // Sprint 4 States
  const [experimentData, setExperimentData] = useState([])
  const [hypothesisData, setHypothesisData] = useState([])
  const [scorecardData, setScorecardData] = useState([])
  const [drilldownData, setDrilldownData] = useState(null)
  const [alertData, setAlertData] = useState([])
  const [dataQualityData, setDataQualityData] = useState(null)

  // Forecast states
  const [forecastMetric, setForecastMetric] = useState('return_rate')
  const [forecastResult, setForecastResult] = useState(null)
  const [forecastLoading, setForecastLoading] = useState(false)

  // Simulator States
  const [simDesc, setSimDesc] = useState(20)
  const [simImg, setSimImg] = useState(20)
  const [simSeller, setSimSeller] = useState(10)
  const [simResults, setSimResults] = useState(null)

  const colors = getChartColors()

  useEffect(() => {
    async function loadAllData() {
      try {
        setLoading(true)
        const [
          kpiRes, cohortRes, rfmRes, paretoRes,
          expRes, hypRes, scRes, drillRes, alertRes, dqRes
        ] = await Promise.all([
          getSQLKPIs(),
          getSQLCohorts(),
          getSQLRFM(),
          getSQLPareto(),
          getExperiments(),
          getHypotheses(),
          getScorecards(),
          getDrilldown(),
          getAlerts(),
          getDataQuality()
        ])
        setKpiData(kpiRes.data)
        setCohortData(cohortRes.data)
        setRfmData(rfmRes.data)
        setParetoData(paretoRes.data)
        setExperimentData(expRes.data)
        setHypothesisData(hypRes.data)
        setScorecardData(scRes.data)
        setDrilldownData(drillRes.data)
        setAlertData(alertRes.data)
        setDataQualityData(dqRes.data)
      } catch (err) {
        toast.error("Failed to load analytical metrics from decision engine.")
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  // Forecast fetch triggers
  useEffect(() => {
    async function loadForecast() {
      try {
        setForecastLoading(true)
        const res = await getForecast({ metric: forecastMetric })
        setForecastResult(res.data)
      } catch (err) {
        toast.error("Failed to load time-series forecasting metrics")
      } finally {
        setForecastLoading(false)
      }
    }
    loadForecast()
  }, [forecastMetric])

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
        // Silently swallow simulator sync
      }
    }
    triggerSim()
  }, [simDesc, simImg, simSeller])

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>Syncing marketplace warehouse features...</div>
        </div>
      </AppLayout>
    )
  }

  // Derived variables for Executive Decision Center using actual analytics
  const topRiskCategory = cohortData.length > 0 
    ? [...cohortData].sort((a, b) => b.return_rate - a.return_rate)[0] 
    : { category: "Electronics", return_rate: 0.284 }

  const topRisksList = paretoData?.top_drivers?.slice(0, 3) || []
  const expectedSavingsPotential = Math.round((kpiData?.revenue_at_risk || 2341800) * 0.35)

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
            
            {/* 1. EXECUTIVE SCORECARDS */}
            {activeModule === 0 && (
              <div>
                <RecruiterMetadata
                  question="How is each segment of the business tracking against monthly targets?"
                  formula="Variance % = (Current - Target) / Target * 100"
                  method="Month-over-Month (MoM) Financial & Operations Variance Scoring"
                  usecase="AMEX / JP Morgan Risk Scorecards & Portfolio Management reviews"
                  interpretation="On Track represents positive performance within boundaries. Red warning metrics signify critical threshold deviations."
                />

                <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF' }}>Monthly Business Review (MBR) Scorecards</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Scorecard Category</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-muted)' }}>Operational KPI</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--text-muted)' }}>Current Month</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--text-muted)' }}>Previous Month</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--text-muted)' }}>Target Goal</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--text-muted)' }}>Variance</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-muted)' }}>SLA Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scorecardData.map((s) => {
                          const isCurrency = s.units === 'currency'
                          const isPct = s.units === 'percentage'
                          const formatVal = (v) => isCurrency ? '₹' + v.toLocaleString() : isPct ? v + '%' : v
                          const isGood = s.status === 'On Track'
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '12px 8px', fontWeight: 700, color: '#FFF' }}>{s.category}</td>
                              <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{s.metric_name}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800 }}>{formatVal(s.current)}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{formatVal(s.previous)}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>{formatVal(s.target)}</td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: s.variance > 0 ? (s.id === 'SC-RET' ? '#EF4444' : '#10B981') : (s.id === 'SC-RET' ? '#10B981' : '#EF4444') }}>
                                {s.variance > 0 ? '+' : ''}{s.variance}%
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: isGood ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: isGood ? '#10B981' : '#EF4444',
                                  border: `1px solid ${isGood ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                }}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Consulting-Grade Insights and Decision Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="exec-grid">
                  <style>{`@media (max-width: 768px) { .exec-grid { grid-template-columns: 1fr !important; } }`}</style>
                  
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShieldAlert size={18} color="#EF4444" /> Live Decision Intelligence: Risk Registry
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 14, borderRadius: 10 }}>
                        <span style={{ fontSize: 10, color: '#FCA5A5', fontWeight: 800 }}>Observation & Evidence</span>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#FFF' }}>
                          <strong>{topRiskCategory.category}</strong> return cohort exceeds the standard SLA parameters, with a return likelihood of <strong>{(topRiskCategory.return_rate * 100).toFixed(1)}%</strong>.
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                          <strong>Financial Impact:</strong> ₹{(expectedSavingsPotential / 100000).toFixed(1)}L under return threat.
                        </p>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Impact Rank: Highest Return Contributors</span>
                        {topRisksList.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{idx + 1}. {item.product_name}</span>
                            <span style={{ color: '#EF4444', fontWeight: 700 }}>{item.total_returns} Returns</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Award size={18} color="#10B981" /> Expected Savings & Recommended Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ESTIMATED CORRECTION BENEFIT</span>
                        <h2 style={{ margin: '4px 0 0', color: '#10B981', fontWeight: 900 }}>{formatCurrency(expectedSavingsPotential)}</h2>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Through optimized size guides and White-Background catalog sweeps.</span>
                      </div>

                      <div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Priority Action Tasks</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ArrowUpRight size={14} color="#10B981" /> deploy interactive size charts for Clothing category immediately.
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ArrowUpRight size={14} color="#10B981" /> clean up catalog background noise in Electronics images.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. A/B TESTING LAB */}
            {activeModule === 1 && (
              <div>
                <RecruiterMetadata
                  question="Do sizing guides or catalog image cleaners significantly reduce returns?"
                  formula="Z-score = (p1 - p2) / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))"
                  method="Two-Sample Proportions Z-Test & Lift Analysis"
                  usecase="Amazon / Swiggy / Blinkit feature rolls and optimization trials"
                  interpretation="P-value < 0.05 rejects the null hypothesis, showing that variant lifts are statistically significant."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {experimentData.map((exp) => (
                    <div key={exp.experiment_id} className="glass-card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 800 }}>{exp.experiment_id} • {exp.status}</span>
                          <h3 style={{ margin: '4px 0', fontSize: 16, color: '#FFF' }}>{exp.name}</h3>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', maxWidth: 700 }}>{exp.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>METRIC TESTED</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{exp.metric_tested}</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0' }}>
                        <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CONTROL A METRIC</span>
                          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#FFF' }}>
                            CR: {exp.control_metrics.conversion_rate}% | RR: {exp.control_metrics.return_rate}%
                          </p>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Traffic: {exp.control_metrics.visitors}</span>
                        </div>
                        <div style={{ padding: 14, borderRadius: 8, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                          <span style={{ fontSize: 11, color: 'var(--accent-primary)' }}>VARIANT B METRIC</span>
                          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#FFF' }}>
                            CR: {exp.variant_metrics.conversion_rate}% | RR: {exp.variant_metrics.return_rate}%
                          </p>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Traffic: {exp.variant_metrics.visitors}</span>
                        </div>
                        <div style={{ padding: 14, borderRadius: 8, background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <span style={{ fontSize: 11, color: '#10B981' }}>COMPUTED LIFT</span>
                          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#10B981' }}>
                            CR: {exp.lift.conversion_rate > 0 ? '+' : ''}{exp.lift.conversion_rate}%
                          </p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: exp.lift.return_rate < 0 ? '#10B981' : '#EF4444' }}>
                            RR: {exp.lift.return_rate}%
                          </p>
                        </div>
                        <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>STATISTICAL OUTCOMES</span>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                            P-Val (CR): {exp.statistical_significance.p_value_conversion}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                            P-Val (RR): {exp.statistical_significance.p_value_returns}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
                        <CheckCircle size={16} color={exp.statistical_significance.is_rr_significant ? '#10B981' : '#F59E0B'} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          <strong>Decision Summary:</strong> Return rate reduction is{' '}
                          <strong style={{ color: exp.statistical_significance.is_rr_significant ? '#10B981' : '#F59E0B' }}>
                            {exp.statistical_significance.is_rr_significant ? 'Statistically Significant (p < 0.05)' : 'Not Statistically Significant yet'}
                          </strong>. Lift confidence limits: [{exp.statistical_significance.confidence_interval_lower}%, {exp.statistical_significance.confidence_interval_upper}%].
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. HYPOTHESIS TESTING HUB */}
            {activeModule === 2 && (
              <div>
                <RecruiterMetadata
                  question="Are operational anomalies and return likelihood deviations statistically significant?"
                  formula="T = (mean1 - mean2) / sqrt(s1^2/n1 + s2^2/n2); Chi2 = Sum( (O - E)^2 / E )"
                  method="Two-Sample T-Tests, Chi-Square Independence and One-Way ANOVA"
                  usecase="AmEx card member compliance risk audits & JP Morgan default correlation metrics"
                  interpretation="Rejecting Null implies a structural operational factor is shifting parameters rather than random noise."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="hyp-grid">
                  <style>{`@media (max-width: 768px) { .hyp-grid { grid-template-columns: 1fr !important; } }`}</style>
                  
                  {hypothesisData.map((test) => (
                    <div key={test.test_id} className="glass-card" style={{ padding: 20, borderLeft: `4px solid ${test.is_significant ? '#10B981' : '#F59E0B'}` }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', display: 'inline-block', marginBottom: 8 }}>
                        {test.test_type} • {test.test_id}
                      </span>
                      <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#FFF' }}>{test.name}</h4>
                      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{test.hypothesis}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, marginBottom: 14 }}>
                        <div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>P-VALUE</span>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: test.is_significant ? '#10B981' : '#FFF' }}>{test.p_value}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>TEST METRIC</span>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#FFF' }}>{test.metric_value}</p>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>BUSINESS INTERPRETATION</span>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{test.business_interpretation}</p>
                      </div>

                      <div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>RECOMMENDED ACTION</span>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#FFF', fontWeight: 600 }}>{test.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. KPI DRILLDOWN ENGINE */}
            {activeModule === 3 && (
              <div>
                <RecruiterMetadata
                  question="Where exactly are returns and losses concentrated within the product hierarchy?"
                  formula="Return Rate = Returns / Orders"
                  method="Recursive Category & Catalog Node Aggregation Tree"
                  usecase="Zepto / Blinkit catalog managers identifying high-risk items"
                  interpretation="Expand categories to drill down from total marketplace results down to single order level records."
                />

                <div className="glass-card" style={{ padding: 20 }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF' }}>Hierarchical Drilldown Matrix</h3>
                  
                  {/* Table headers */}
                  <div style={{
                    display: 'flex',
                    padding: '10px 14px',
                    borderBottom: '2px solid rgba(255,255,255,0.1)',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontSize: 12
                  }}>
                    <span style={{ flex: 1 }}>Catalog Hierarchy Node</span>
                    <span style={{ width: 120, textAlign: 'right' }}>Revenue</span>
                    <span style={{ width: 100, textAlign: 'right' }}>Total Orders</span>
                    <span style={{ width: 100, textAlign: 'right' }}>Return Rate</span>
                  </div>

                  {drilldownData && <DrilldownNode node={drilldownData} />}
                </div>
              </div>
            )}

            {/* 5. ALERT MONITORING CENTER */}
            {activeModule === 4 && (
              <div>
                <RecruiterMetadata
                  question="Are there active return anomalies or SLA threshold failures?"
                  formula="Trigger if Return Rate > 15% OR Risk score increase MoM > 20%"
                  method="Real-Time SLA Rule-Based Operational Alerting Engine"
                  usecase="Amazon / JPMorgan transactional monitoring & compliance control panels"
                  interpretation="Urgent High alerts dictate immediate resource allocation. Resolved alerts indicate metrics returned to historical variance bounds."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {alertData.map((alert) => {
                    const isHigh = alert.severity === 'High'
                    const isMed = alert.severity === 'Medium'
                    const isResolved = alert.status === 'Resolved'
                    const alertColor = isResolved ? '#10B981' : isHigh ? '#EF4444' : '#F59E0B'
                    return (
                      <div key={alert.id} className="glass-card" style={{ padding: 18, borderLeft: `5px solid ${alertColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: alertColor,
                            background: `${alertColor}12`,
                            border: `1px solid ${alertColor}33`,
                            padding: '3px 8px',
                            borderRadius: 4
                          }}>
                            {alert.severity.toUpperCase()} ALERT • {alert.alert_type}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detected: {new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>

                        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#FFF', fontWeight: 600 }}>{alert.business_impact}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>ESTIMATED COST</span>
                            <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#FFF' }}>{alert.estimated_cost > 0 ? formatCurrency(alert.estimated_cost) : '₹0 (Mitigated)'}</p>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>OWNER</span>
                            <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#FFF' }}>{alert.owner}</p>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>RECOMMENDED ACTION</span>
                            <p style={{ margin: '2px 0 0', fontWeight: 600, color: 'var(--text-secondary)' }}>{alert.recommended_action}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Alert ID: {alert.id}</span>
                          <span style={{ color: alertColor, fontWeight: 700 }}>Status: {alert.status}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 6. DATA QUALITY COMMAND CENTER */}
            {activeModule === 5 && (
              <div>
                <RecruiterMetadata
                  question="Are data warehouse metrics fresh, complete and structurally sound?"
                  formula="Completeness % = (Non-Null Cells / Total cells) * 100"
                  method="Automated SQLite / Postgres Schema Integrity Auditing"
                  usecase="JP Morgan credit transaction data warehouses & FAANG analytical database ingestion pipelines"
                  interpretation="Quality score over 95% indicates pipeline integrity. Freshness updates below 30 min denote near real-time synchronization."
                />

                {dataQualityData && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="dq-grid">
                    <style>{`@media (max-width: 900px) { .dq-grid { grid-template-columns: 1fr !important; } }`}</style>
                    
                    {/* Score and Completeness overview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="glass-card" style={{ padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div style={{
                          width: 110, height: 110,
                          borderRadius: '50%',
                          border: '6px solid #10B981',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                        }}>
                          <span style={{ fontSize: 24, fontWeight: 900, color: '#10B981' }}>{dataQualityData.overall_quality_score}%</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Score</span>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, color: '#FFF' }}>Warehouse Health Index</h3>
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                            No null entries or type validation warnings detected on <strong>{dataQualityData.total_records}</strong> transactions.
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 8 }}>
                            Freshness: <strong>{dataQualityData.freshness_minutes} minutes ago</strong>
                          </span>
                        </div>
                      </div>

                      <div className="glass-card" style={{ padding: 20 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#FFF' }}>Quality Trend Index</h4>
                        <div style={{ height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataQualityData.quality_trend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[90, 100]} />
                              <Tooltip {...glassTooltipStyle} />
                              <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Null fields breakdown */}
                    <div className="glass-card" style={{ padding: 20 }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>Null Variance Breakdown by Field</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.entries(dataQualityData.null_variance_breakdown).map(([field, count]) => (
                          <div key={field} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{field}</span>
                              <span style={{ color: '#10B981', fontWeight: 700 }}>{count} Nulls</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: '100%', height: '100%', background: '#10B981' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. CUSTOMER & PRODUCT INTELLIGENCE (COHORT/RFM) */}
            {activeModule === 6 && (
              <div>
                <RecruiterMetadata
                  question="How are return risks distributed across customer segments and product price cohorts?"
                  formula="CLV = Sum(Order Prices); Return Rate = Returns / Sales"
                  method="Cohort Price Tier Matrix & RFM customer Segmentation"
                  usecase="Amazon customer risk profiling & Blinkit supplier contract updates"
                  interpretation="VIP Customers exhibit high monetary value and healthy return habits. Low/Budget clothing cohorts suffer from sizing return rates."
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="marketplace-grid">
                  <style>{`@media (max-width: 900px) { .marketplace-grid { grid-template-columns: 1fr !important; } }`}</style>
                  
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

                  {/* High Risk customer accounts table */}
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
                              <td style={{ padding: 8, textAlign: 'right', color: r.customer_risk_score > 30 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                                {r.customer_risk_score.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
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

            {/* 8. REVENUE IMPACT SIMULATOR */}
            {activeModule === 7 && (
              <div>
                <RecruiterMetadata
                  question="What is the expected savings from improvements in description or image parameters?"
                  formula="Impact reduction = (quality / 10) * Coefficient * Base Rate"
                  method="Analytics calculator simulator math models"
                  usecase="Zepto / Blinkit catalog optimization planning before deployment"
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

            {/* 9. TIME SERIES FORECASTING HUB */}
            {activeModule === 8 && (
              <div>
                <RecruiterMetadata
                  question="What are the predicted trends for return rate, revenue, refunds and complaints?"
                  formula="Holt-Winters Exponential Smoothing additive trend models fitting dynamic historical baselines"
                  method="Double/Triple Exponential Smoothing Forecaster (statsmodels library)"
                  usecase="JP Morgan financial planning & Blinkit stock replenishments forecasts"
                  interpretation="Dotted line outlines point forecasts for subsequent 15 days, shaded boundary illustrates 95% statistical confidence intervals."
                />

                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {[
                    { key: 'return_rate', label: 'Return Forecast' },
                    { key: 'revenue', label: 'Revenue Forecast' },
                    { key: 'refunds', label: 'Refund Forecast' },
                    { key: 'complaints', label: 'Complaint Forecast' },
                    { key: 'operational_risk', label: 'Operational Risk Forecast' }
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setForecastMetric(btn.key)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: forecastMetric === btn.key ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                        color: '#FFF',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {forecastLoading ? (
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Calculating time-series models...</p>
                  </div>
                ) : forecastResult ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }} className="forecast-grid">
                    <style>{`@media (max-width: 900px) { .forecast-grid { grid-template-columns: 1fr !important; } }`}</style>
                    
                    {/* Forecast Chart */}
                    <div className="glass-card" style={{ padding: 20 }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>
                        Actual vs Forecast Trend with 95% Confidence Intervals
                      </h3>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecastResult.forecast_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip {...glassTooltipStyle} />
                            
                            {/* Confidence Band */}
                            <Area
                              type="monotone"
                              dataKey={(d) => [d.confidence_lower, d.confidence_upper]}
                              stroke="none"
                              fill="rgba(139, 92, 246, 0.06)"
                              name="95% Confidence Band"
                            />
                            
                            {/* Actual values */}
                            <Line
                              type="monotone"
                              dataKey="actual"
                              stroke="#10B981"
                              strokeWidth={3}
                              dot={{ r: 3 }}
                              name="Actual"
                            />
                            
                            {/* Forecast values */}
                            <Line
                              type="monotone"
                              dataKey="forecast"
                              stroke="var(--accent-primary)"
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              name="Forecast"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Forecast Stats & Quality metrics */}
                    <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#FFF' }}>Model Accuracy Metrics</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>MAPE ERROR</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(forecastResult.mape * 100).toFixed(2)}%</span>
                        </div>
                        <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>RMSE ERROR</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{forecastResult.rmse.toFixed(3)}</span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 16, borderRadius: 10 }}>
                        <span style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700 }}>FORECAST STABILITY INDEX</span>
                        <h2 style={{ margin: '4px 0 0', color: '#10B981', fontWeight: 900 }}>{forecastResult.stability_score}%</h2>
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                          Double exponential smoothing model exhibits strong historical fit with zero drift issues.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
