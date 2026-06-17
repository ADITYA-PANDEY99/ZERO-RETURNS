import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Search, ShieldCheck, FileText, CheckCircle, TrendingUp, AlertTriangle,
  HelpCircle, Download, Presentation, BookOpen, GitMerge, Settings, Star, Database
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'

// API base path (adjust for deployment if needed, uses local fallback)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function Enterprise() {
  const [activeTab, setActiveTab] = useState('lineage') // 'lineage' | 'catalog' | 'governance' | 'board' | 'recruiter' | 'interview'
  
  // Data States
  const [kpis, setKpis] = useState({})
  const [lineage, setLineage] = useState({ nodes: [], edges: [] })
  const [govData, setGovData] = useState(null)
  const [story, setStory] = useState(null)
  const [qaList, setQaList] = useState([])
  const [loading, setLoading] = useState(true)

  // Catalog search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKpi, setSelectedKpi] = useState(null)

  // Lineage focus state
  const [focusedNode, setFocusedNode] = useState(null)

  // Board mode state (hides metrics details)
  const [boardMode, setBoardMode] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('monthly')

  // Case Study status
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // Fetch all metadata dynamically on mount
  useEffect(() => {
    async function fetchAllMetadata() {
      setLoading(true)
      try {
        const [kpiRes, linRes, govRes, storyRes, qaRes] = await Promise.all([
          fetch(`${API_URL}/enterprise/kpis`).then(r => r.json()),
          fetch(`${API_URL}/enterprise/lineage`).then(r => r.json()),
          fetch(`${API_URL}/enterprise/governance`).then(r => r.json()),
          fetch(`${API_URL}/enterprise/storytelling?period=${reportPeriod}`).then(r => r.json()),
          fetch(`${API_URL}/enterprise/interview-defense`).then(r => r.json())
        ])

        setKpis(kpiRes)
        setLineage(linRes)
        setGovData(govRes)
        setStory(storyRes)
        setQaList(qaRes)
      } catch (err) {
        console.error('Metadata API fetch error, using local fallback:', err)
        // Fallback mocked client definitions
        setKpis({
          total_orders: { name: "Total Volume", category: "Volume", definition: "Transaction throughput." },
          return_rate: { name: "Return Rate", category: "Quality", definition: "Returned transaction percentage." }
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAllMetadata()
  }, [reportPeriod])

  // Handle case study markdown export
  const handleExport = async (format) => {
    setExporting(true)
    setExportMessage('')
    try {
      const res = await fetch(`${API_URL}/enterprise/case-study/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, title: "ZeroReturn Enterprise Impact Case Study" })
      }).then(r => r.json())

      // Simulate download
      const element = document.createElement("a");
      const file = new Blob([res.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = res.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setExportMessage(`✅ Case study exported successfully as ${res.filename}!`)
    } catch (e) {
      setExportMessage('❌ Case study export failed. Backend api offline.')
    } finally {
      setExporting(false)
    }
  }

  // Filter catalog list based on search query
  const filteredKpis = Object.entries(kpis).filter(([key, val]) =>
    val.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    val.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    val.definition.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
        
        {/* Hub Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 className="logo-text font-display" style={{ fontSize: '2rem', fontWeight: 800 }}>
              Enterprise <span className="gradient-text">Command Center</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              Metadata lineage, schema audits, data governance monitoring, and executive boardroom presentations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setBoardMode(!boardMode)}
              className={boardMode ? "btn btn-primary" : "btn btn-secondary"}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', padding: '8px 16px', borderRadius: 10 }}
            >
              <Presentation size={16} />
              {boardMode ? "Exit Board Mode" : "Board Presentation View"}
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 2
        }}>
          {[
            { id: 'lineage', label: 'Data Lineage & Graphs', icon: GitMerge },
            { id: 'catalog', label: 'KPI Catalog', icon: BookOpen },
            { id: 'governance', label: 'Data Governance & Trust', icon: ShieldCheck },
            { id: 'board', label: 'Boardroom Storytelling', icon: FileText },
            { id: 'recruiter', label: 'Maturity Matrix', icon: Star },
            { id: 'interview', label: 'Interview Defense', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  background: active ? 'rgba(255,255,255,0.03)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: active ? '#FFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} color={active ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Compiling enterprise metadata tables...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* ── TAB 1: DATA LINEAGE & GRAPH ────────────────── */}
              {activeTab === 'lineage' && (
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: 24 }} className="enterprise-layout">
                  <style>{`
                    @media (max-width: 1024px) { .enterprise-layout { grid-template-columns: 1fr !important; } }
                  `}</style>
                  
                  {/* Interactive SVG Flow Diagram */}
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, color: '#FFF' }}>Interactive Data Flow Lineage</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 24 }}>
                      Consolidated pipeline lineage tracking raw table records down to final calculated analytical dashboard indicators. Click a node to inspect its transformations.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <svg width="780" height="420" style={{ margin: '0 auto', display: 'block' }}>
                        {/* Define connections */}
                        <g stroke="rgba(255,255,255,0.08)" strokeWidth="2">
                          {/* Column 1 -> Column 2 */}
                          <line x1="100" y1="80" x2="280" y2="150" />
                          <line x1="100" y1="320" x2="280" y2="150" />
                          
                          {/* Column 2 -> Column 3 */}
                          <line x1="280" y1="150" x2="460" y2="150" />
                          <line x1="100" y1="80" x2="460" y2="280" />
                          
                          {/* Column 3 -> Column 4 */}
                          <line x1="460" y1="150" x2="640" y2="80" />
                          <line x1="460" y1="150" x2="640" y2="200" />
                          <line x1="460" y1="280" x2="640" y2="320" />
                        </g>

                        {/* Node 1: Raw Orders */}
                        <g transform="translate(40, 50)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('src_orders')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'src_orders' ? 'rgba(139,92,246,0.2)' : 'var(--bg-tertiary)'} stroke="var(--glass-border)" />
                          <text x="60" y="35" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="600">production.orders</text>
                        </g>

                        {/* Node 2: Raw Returns */}
                        <g transform="translate(40, 290)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('src_returns')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'src_returns' ? 'rgba(139,92,246,0.2)' : 'var(--bg-tertiary)'} stroke="var(--glass-border)" />
                          <text x="60" y="35" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="600">production.returns</text>
                        </g>

                        {/* Node 3: Feature Store */}
                        <g transform="translate(220, 120)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('feat_store')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'feat_store' ? 'rgba(139,92,246,0.2)' : 'var(--bg-tertiary)'} stroke="var(--glass-border)" />
                          <text x="60" y="35" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="600">analytics.features</text>
                        </g>

                        {/* Node 4: fact_returns */}
                        <g transform="translate(400, 120)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('fact_ret')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'fact_ret' ? 'rgba(139,92,246,0.2)' : 'var(--bg-tertiary)'} stroke="var(--glass-border)" />
                          <text x="60" y="35" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="600">warehouse.fact</text>
                        </g>

                        {/* Node 5: Predictions */}
                        <g transform="translate(400, 250)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('model_clf')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'model_clf' ? 'rgba(139,92,246,0.2)' : 'var(--bg-tertiary)'} stroke="var(--glass-border)" />
                          <text x="60" y="35" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="600">ml.classifier</text>
                        </g>

                        {/* Outputs (KPIs) */}
                        <g transform="translate(580, 50)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('kpi_orders')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'kpi_orders' ? 'rgba(6,182,212,0.2)' : 'var(--bg-tertiary)'} stroke="rgba(6,182,212,0.3)" />
                          <text x="60" y="35" textAnchor="middle" fill="var(--accent-secondary)" fontSize="11" fontWeight="600">Total Volume</text>
                        </g>

                        <g transform="translate(580, 170)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('kpi_rate')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'kpi_rate' ? 'rgba(6,182,212,0.2)' : 'var(--bg-tertiary)'} stroke="rgba(6,182,212,0.3)" />
                          <text x="60" y="35" textAnchor="middle" fill="var(--accent-secondary)" fontSize="11" fontWeight="600">Return Rate</text>
                        </g>

                        <g transform="translate(580, 290)" style={{ cursor: 'pointer' }} onClick={() => setFocusedNode('kpi_risk')}>
                          <rect width="120" height="60" rx="8" fill={focusedNode === 'kpi_risk' ? 'rgba(6,182,212,0.2)' : 'var(--bg-tertiary)'} stroke="rgba(6,182,212,0.3)" />
                          <text x="60" y="35" textAnchor="middle" fill="var(--accent-secondary)" fontSize="11" fontWeight="600">Revenue at Risk</text>
                        </g>
                      </svg>
                    </div>
                  </div>

                  {/* Lineage Info Sidebar */}
                  <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Database size={16} color="var(--accent-primary)" />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#FFF' }}>Lineage Inspector</h4>
                      </div>
                      
                      {focusedNode ? (
                        <div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Selected Node</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginTop: 4 }}>
                              {lineage.nodes?.find(n => n.id === focusedNode)?.name || focusedNode}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                              {lineage.nodes?.find(n => n.id === focusedNode)?.type}
                            </div>
                          </div>
                          
                          <div style={{ marginTop: 16 }}>
                            <h5 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#FFF' }}>Upstream Transformations</h5>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.4 }}>
                              {lineage.edges?.find(e => e.target === focusedNode)?.transformation || "Direct source connection feed."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          Click any node in the data flow map to audit its dependency details and feature engineering rules.
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16, marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                        <span>Data Lineage Active & Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: KPI CATALOG & DICTIONARY ───────────── */}
              {activeTab === 'catalog' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 24 }} className="enterprise-layout">
                  {/* KPI List & Search */}
                  <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search KPIs, definitions..."
                        className="input"
                        style={{ paddingLeft: 36, fontSize: '0.85rem' }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 360, overflowY: 'auto' }}>
                      {filteredKpis.map(([key, item]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedKpi(key)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 14px',
                            background: selectedKpi === key ? 'rgba(139,92,246,0.1)' : 'transparent',
                            border: '1px solid transparent',
                            borderLeft: selectedKpi === key ? '3px solid var(--accent-primary)' : '1px solid transparent',
                            borderRadius: 6,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#FFF', fontSize: '0.85rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', marginTop: 2 }}>{item.category}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected KPI Metadata Card */}
                  <div className="glass-card" style={{ padding: 24 }}>
                    {selectedKpi && kpis[selectedKpi] ? (
                      <div>
                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 12, marginBottom: 20 }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 800 }}>{kpis[selectedKpi].category}</span>
                          <h3 style={{ margin: '4px 0 0', fontSize: '1.3rem', color: '#FFF', fontWeight: 800 }}>{kpis[selectedKpi].name}</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Formula</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6, marginTop: 4, color: 'var(--accent-secondary)', wordBreak: 'break-all' }}>
                              {kpis[selectedKpi].formula}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Data Source</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFF', marginTop: 4 }}>
                              {kpis[selectedKpi].data_source}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Business Definition</div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{kpis[selectedKpi].definition}</p>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Recruiter / Interview Defense Insight</div>
                            <p style={{ fontSize: '0.82rem', color: '#FFF', marginTop: 4, lineHeight: 1.4, padding: '10px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
                              {kpis[selectedKpi].interview_explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Select a metric from the catalog database index to inspect its calculations, definitions, and technical justifications.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB 3: DATA GOVERNANCE & TRUST ───────────── */}
              {activeTab === 'governance' && govData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="kpi-grid">
                    {/* Governance score */}
                    <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Data Governance Score</span>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: 8 }}>{govData.live_metrics.governance_score}%</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: 4 }}>Passed QA Gate</span>
                    </div>
                    {/* Freshness */}
                    <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>SLA Ingestion Freshness</span>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FFF', marginTop: 8 }}>{govData.live_metrics.freshness_pct}%</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Target: &gt;95%</span>
                    </div>
                    {/* Completeness */}
                    <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Record Completeness</span>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FFF', marginTop: 8 }}>{govData.live_metrics.completeness_pct}%</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Null counts: {govData.live_metrics.missing_values_count}</span>
                    </div>
                    {/* Schema validation */}
                    <div className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Drift Validation</span>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: 12 }}>
                        {govData.live_metrics.drift_detected ? "Drifted" : "Verifed Schema"}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>No changes registered</span>
                    </div>
                  </div>

                  {/* Active Alerts */}
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: 16 }}>Live Data Quality Pipeline Alerts</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {govData.live_metrics.alerts?.map((alert, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(239,68,68,0.04)',
                          border: '1px solid rgba(239,68,68,0.12)'
                        }}>
                          <AlertTriangle size={16} color="var(--danger)" />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: 600 }}>{alert.message}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>Root Cause: {alert.root_cause}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: BOARDROOM STORYTELLING ───────────── */}
              {activeTab === 'board' && story && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }} className="enterprise-layout">
                  {/* Narrative Text */}
                  <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: 12, marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#FFF', fontWeight: 800 }}> board narrative storyboard</h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['weekly', 'monthly', 'quarterly'].map(p => (
                          <button
                            key={p}
                            onClick={() => setReportPeriod(p)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: reportPeriod === p ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                              border: 'none',
                              color: '#FFF',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            {p.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.95rem', color: '#FFF', lineHeight: 1.6, background: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                      {story.executive_summary}
                    </p>

                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', marginBottom: 12 }}>Audit Opportunities Mapped</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {story.top_opportunities?.map((op, i) => (
                          <div key={i} style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '0.88rem' }}>{op.title}</div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.3 }}>{op.details}</p>
                            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginTop: 6 }}>{op.impact}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & PDF Exporter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Dynamic Savings Card */}
                    <div className="glass-card" style={{ padding: 20, textAlign: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(6,182,212,0.06) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Expected Savings</span>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success)', marginTop: 8 }}>{story.expected_savings}</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Based on 22% model reduction target</p>
                    </div>

                    {/* Exporters */}
                    <div className="glass-card" style={{ padding: 20 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', marginBottom: 14 }}>Export Board Package</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                          onClick={() => handleExport('markdown')}
                          disabled={exporting}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.85rem' }}
                        >
                          <Download size={14} />
                          {exporting ? "Generating..." : "Export as Markdown"}
                        </button>
                        <button
                          onClick={() => handleExport('text')}
                          disabled={exporting}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.85rem' }}
                        >
                          <FileText size={14} />
                          {exporting ? "Generating..." : "Export raw text format"}
                        </button>
                      </div>

                      {exportMessage && (
                        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          {exportMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 5: MATURITY MATRIX ───────────────────── */}
              {activeTab === 'recruiter' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: 24 }} className="enterprise-layout">
                  {/* Maturity Level */}
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: 6 }}>Analytics Maturity Scale</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Level 5: Decisional Autonomy</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                      {[
                        { level: 5, name: 'Cognitive & Prescriptive Autonomy', desc: 'Predicting actions and automating catalog description quality check loops.', active: true },
                        { level: 4, name: 'Predictive & Forecasting Forecasts', desc: 'ARIMA return trend forecasting and ML risk scoring models.', active: true },
                        { level: 3, name: 'Diagnostic Decision Supports', desc: 'RFM segmentation, Pareto analysis, and A/B proportion tests.', active: true },
                        { level: 2, name: 'Descriptive Analytics Dashboards', desc: 'Pre-aggregated summaries, cohorts tracking, and heatmaps.', active: true },
                        { level: 1, name: 'Raw Ingestion Logging', desc: 'CSV upload and raw orders index catalogs.', active: true },
                      ].map(item => (
                        <div key={item.level} style={{
                          padding: 10,
                          borderRadius: 8,
                          background: item.active ? 'rgba(139,92,246,0.06)' : 'transparent',
                          border: item.active ? '1px solid rgba(139,92,246,0.15)' : '1px solid transparent',
                          opacity: item.active ? 1 : 0.4
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-primary)', color: '#FFF' }}>L{item.level}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>{item.name}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, paddingLeft: 30 }}>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enterprise Capability Matrix */}
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: 16 }}>Enterprise Core Capabilities</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { title: "Dynamic Lineage", desc: "Maps metadata tables downstream path visually." },
                        { title: "Governance Scores", desc: "Auto check drift logs, missing records, duplicates." },
                        { title: "Trust scorecards", desc: "SLA metrics calculations proving report reliability." },
                        { title: "board storytelling", desc: "Automated executive summary narratives generation." },
                        { title: "Multi-industry Adapters", desc: "Instantly switches platform layout from Ecommerce to SaaS." },
                        { title: "Security guardrails", desc: "Regex SQL parser sanitizers preventing script injection." },
                      ].map((cap, i) => (
                        <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <CheckCircle size={14} color="var(--success)" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>{cap.title}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{cap.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 6: INTERVIEW DEFENSE ────────────────── */}
              {activeTab === 'interview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="glass-card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: 6 }}>Recruiter Technical Interview Flashcards</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
                      Common systems architectural challenges, tradeoffs, and justifications designed to prove code ownership and scalability design thinking.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {qaList.map((qa, index) => (
                        <div key={qa.id || index} style={{
                          padding: 16,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--glass-border)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--glass-border)', paddingBottom: 10, marginBottom: 12 }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(6,182,212,0.12)', color: 'var(--accent-secondary)', fontWeight: 700 }}>{qa.module}</span>
                            <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#FFF', fontWeight: 700 }}>{qa.question}</h4>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase' }}>Business Answer Narrative</div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{qa.answer_business}</p>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Technical/Scale System Design</div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{qa.answer_technical}</p>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--glass-border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ⚠️ <strong>Tradeoffs & Constraints:</strong> {qa.tradeoffs}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  )
}
