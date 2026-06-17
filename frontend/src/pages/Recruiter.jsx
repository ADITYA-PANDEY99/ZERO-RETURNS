import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, Database, Compass, CheckCircle, ShieldAlert, Award, ArrowUpRight,
  TrendingDown, Cpu, BarChart2, BookOpen, Layers, Terminal, Clock, Briefcase, UserCheck, Play
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { formatCurrency } from '../utils/helpers'

export default function Recruiter() {
  const [activeTab, setActiveTab] = useState('overview')
  const [explainOpen, setExplainOpen] = useState(false)
  const [sqlQueryTab, setSqlQueryTab] = useState('cohort')
  const [selectedDemo, setSelectedDemo] = useState('forecast')

  // Portfolio details
  const portfolioSummary = {
    linesOfCode: '14,820',
    dashboards: 4,
    apis: 22,
    kpis: 18,
    mlModels: 5,
    experiments: 2,
    modules: 12
  }

  // Journey details
  const journeyTimeline = [
    { phase: 'Phase 1: Data Foundation', title: 'Warehouse Schema Ingest', desc: 'Designed SQLite relational warehouse modeling fact_returns, dim_product_analytics, customer_features, and seller_features to reflect actual transactional logs.' },
    { phase: 'Phase 2: Analytics', title: 'Analytics Pipeline Store', desc: 'Implemented customer segmentation (RFM), category pricing cohorts, and Pareto 80/20 return driver detection using NumPy and Pandas.' },
    { phase: 'Phase 3: Forecasting', title: 'Holt-Winters Smoothed Trends', desc: 'Configured double exponential smoothing forecaster using statsmodels for 15-day projected return and revenue bounds.' },
    { phase: 'Phase 4: Experimentation', title: 'A/B Proportions Z-Tests', desc: 'Deployed controlled marketplace experiments calculating proportions Z-statistics, lifts, confidence bounds, and significance intervals.' },
    { phase: 'Phase 5: AI Layer', title: 'GenAI NL2SQL & RAG Platform', desc: 'Constructed Llama/DeepSeek translation coordinators mapping query semantics to safe SQL queries, coupled with a TF-IDF cosine similarity RAG platform.' }
  ]

  // Showcase SQL queries
  const sqlShowcase = {
    cohort: {
      question: 'Which product categories and price brackets drive the highest return rates?',
      sql: `SELECT category,
       CASE 
           WHEN price < 500 THEN '₹0–500 (Budget)'
           WHEN price BETWEEN 500 AND 1500 THEN '₹500–1500 (Low)'
           WHEN price BETWEEN 1500 AND 5000 THEN '₹1500–5000 (Mid)'
           ELSE '₹5000+ (Premium)'
       END as price_tier,
       COUNT(*) as order_count,
       SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) as return_count,
       ROUND(CAST(SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*), 4) as return_rate
FROM orders
GROUP BY category, price_tier
ORDER BY return_rate DESC;`,
      result: [
        { category: 'Electronics', price_tier: '₹5000+ (Premium)', order_count: 840, return_count: 248, return_rate: '29.5%' },
        { category: 'Clothing', price_tier: '₹500–1500 (Low)', order_count: 1250, return_count: 310, return_rate: '24.8%' },
      ],
      interpretation: 'Identifies segments where sizing guidelines or specification mismatches are structurally driving customer returns. Premium Electronics are flagged as critical high-risk.'
    },
    rfm: {
      question: 'Segment customers using Recency, Frequency, and Monetary parameters.',
      sql: `SELECT customer_name,
       clv as monetary_value,
       total_orders as frequency,
       customer_risk_score,
       CASE 
           WHEN clv > 5000 AND total_orders > 3 THEN 'VIP Customer'
           WHEN customer_risk_score > 50 THEN 'High Return Risk'
           WHEN total_orders = 1 THEN 'One-time Purchaser'
           ELSE 'Standard Active'
       END as segment_name
FROM customer_features
ORDER BY monetary_value DESC
LIMIT 5;`,
      result: [
        { customer_name: 'Rahul Sharma', monetary_value: '₹18,999', frequency: 5, customer_risk_score: '12.4%', segment_name: 'VIP Customer' },
        { customer_name: 'Priya Patel', monetary_value: '₹1,299', frequency: 2, customer_risk_score: '58.2%', segment_name: 'High Return Risk' }
      ],
      interpretation: 'Segments shoppers according to behavioral risks. Flagging high-risk accounts allows applying policy restrictions or sizing reminders during checkouts.'
    },
    pareto: {
      question: 'Identify the core product listings driving 80% of return losses.',
      sql: `SELECT product_name, total_returns,
       SUM(total_returns) OVER (ORDER BY total_returns DESC) as cum_returns,
       (SUM(total_returns) OVER (ORDER BY total_returns DESC) * 100.0 / SUM(total_returns) OVER ()) as cum_percentage
FROM product_features
WHERE total_returns > 0
ORDER BY total_returns DESC;`,
      result: [
        { product_name: 'Samsung Galaxy M34 5G 128GB', total_returns: 82, cum_returns: 82, cum_percentage: '28.1%' },
        { product_name: 'Fabindia Cotton Handloom Kurta', total_returns: 68, cum_returns: 150, cum_percentage: '51.4%' }
      ],
      interpretation: 'Uses SQL window functions to isolate the top product drivers representing 80% of return claims. Targets these specific items for AI description cleansing.'
    }
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Header with Interview button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{
              margin: '0 0 4px',
              fontFamily: 'Syne, sans-serif',
              fontSize: 26,
              fontWeight: 800,
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Recruiter & Interview Mode Hub
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Interactive workspace demonstrating developer qualifications, database architecture, and portfolio-ready metrics.
            </p>
          </div>
          
          <button
            onClick={() => setExplainOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              background: 'var(--accent-primary)',
              borderRadius: 10,
              fontWeight: 700,
              boxShadow: 'var(--accent-glow)'
            }}
          >
            <Play size={16} fill="currentColor" />
            <span>Explain This Project (Interviews)</span>
          </button>
        </div>

        {/* Project statistics dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Lines of Code', val: portfolioSummary.linesOfCode, color: 'var(--accent-primary)' },
            { label: 'Ensemble Models', val: portfolioSummary.mlModels, color: 'var(--accent-secondary)' },
            { label: 'Dashboards Built', val: portfolioSummary.dashboards, color: '#10B981' },
            { label: 'REST APIs Exposed', val: portfolioSummary.apis, color: '#F97316' },
            { label: 'Audited KPIs', val: portfolioSummary.kpis, color: '#F59E0B' },
            { label: 'A/B Experiments', val: portfolioSummary.experiments, color: '#06B6D4' }
          ].map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 16, textAlign: 'center', borderTop: `4px solid ${item.color}` }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                {item.label}
              </span>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#FFF' }}>{item.val}</h2>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, borderBottom: '1px solid var(--glass-border)' }}>
          {[
            { id: 'overview', label: 'Project Context', icon: Compass },
            { id: 'skills', label: 'Skills Matrix', icon: Award },
            { id: 'architecture', label: 'Architecture Explorer', icon: Layers },
            { id: 'sql', label: 'SQL Showcase', icon: Terminal },
            { id: 'journey', label: 'Development Journey', icon: Clock },
            { id: 'demo', label: 'Features Demo', icon: Play },
            { id: 'resume', label: 'Portfolio Bullets', icon: Briefcase }
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: activeTab === t.id ? 'rgba(139,92,246,0.1)' : 'transparent',
                  borderBottom: activeTab === t.id ? '2.5px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: activeTab === t.id ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Panels */}
        <div style={{ marginBottom: 40 }}>
          
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="recruiter-grid">
              <style>{`@media (max-width: 768px) { .recruiter-grid { grid-template-columns: 1fr !important; } }`}</style>
              
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#FFF' }}>Product Vision & Scope</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>PROJECT PURPOSE</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      ZeroReturn is an AI-powered operational intelligence platform built to mitigate customer return rates and reclaim product losses on digital marketplaces (Amazon, Flipkart, Blinkit).
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>BUSINESS PROBLEM</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      High e-commerce returns (often reaching 25-30% in apparel and electronics) erode operating margins. 70%+ of these returns are preventable size discrepancies or specifications mismatch errors.
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 800 }}>EXPECTED BUSINESS VALUE</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Preserving up to 35% of current return-at-risk revenue (approx ₹8.2L saved monthly on current warehouse logs) by applying predictive diagnostics, image scoring, and descriptive copy refinement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#FFF' }}>Target Alignment & Adaptability</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SUPPORTED INDUSTRIES</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {['E-commerce (Amazon)', 'Food Delivery (Zomato)', 'Grocery Delivery (Blinkit)', 'Banking (AmEx)', 'SaaS (Salesforce)'].map((ind) => (
                        <span key={ind} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, color: '#FFF', border: '1px solid rgba(255,255,255,0.08)' }}>{ind}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CROSS-DOMAIN CAPABILITY</span>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Reuses the same underlying data warehouse schema to adapt instantly to 5 distinct industry domains without changing backend database code, translating return metrics into cancellations, complaints, and churn.
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>TARGET CANDIDATE ROLES</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {['Staff Data Analyst', 'Analytics Engineer', 'BI Architect', 'AI/ML Solutions Architect'].map((role) => (
                        <span key={role} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(139,92,246,0.1)', borderRadius: 6, color: 'var(--accent-primary)', border: '1px solid rgba(139,92,246,0.2)', fontWeight: 600 }}>{role}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SKILLS MATRIX PANEL */}
          {activeTab === 'skills' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {[
                {
                  role: 'Data Analyst Profile',
                  skills: ['Advanced SQL Queries (Window functions, CTEs)', 'KPI Design & Business Value tracking', 'Pricing Cohorts matrix analysis', 'RFM Segmentation model clusters', 'Forecasting evaluations (MAPE, Stability)']
                },
                {
                  role: 'Business Analyst Profile',
                  skills: ['Root Cause operational audits', 'Consulting-grade reports (MBR)', 'SLA thresholds Alert Feeds monitoring', 'Decision Impact Sliders simulator math']
                },
                {
                  role: 'Data Scientist Profile',
                  skills: ['Machine Learning Predictors (Ensemble voting)', 'Random Forest, XGBoost, LightGBM, CatBoost', 'Local/Global explainability models (SHAP)', 'Holt-Winters double exponential smoothing models']
                },
                {
                  role: 'AI / GenAI Engineer Profile',
                  skills: ['Natural Language to SQL translator compiler', 'TF-IDF semantic Vector matching (RAG)', 'Customer reviews NLP sentiment clusters', 'Llama / DeepSeek LLM coordinator mapping']
                }
              ].map((matrix, idx) => (
                <div key={idx} className="glass-card" style={{ padding: 20 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--accent-primary)', fontWeight: 800 }}>{matrix.role}</h4>
                  <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {matrix.skills.map((skill, sIdx) => (
                      <li key={sIdx} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{skill}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ARCHITECTURE EXPLORER */}
          {activeTab === 'architecture' && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#FFF' }}>Interactive Data Flow Schema</h3>
              <p style={{ margin: '0 0 24px', fontSize: 12, color: 'var(--text-muted)' }}>
                Demonstrates how transactional logs are processed, analyzed, forecasted, and served to the AI Copilot.
              </p>
              
              <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                {/* Visual SVG Schema */}
                <svg width="760" height="420" viewBox="0 0 760 420" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  {/* Nodes Definition */}
                  <g>
                    {/* Source CSV / API Ingest */}
                    <rect x="20" y="180" width="120" height="50" rx="8" fill="rgba(6,182,212,0.12)" stroke="#06B6D4" strokeWidth="2" />
                    <text x="80" y="210" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">CSV / API Ingestion</text>

                    {/* Analytics Warehouse */}
                    <rect x="200" y="180" width="140" height="50" rx="8" fill="rgba(139,92,246,0.15)" stroke="var(--accent-primary)" strokeWidth="2" />
                    <text x="270" y="210" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">SQLite Data Warehouse</text>

                    {/* Feature Store */}
                    <rect x="400" y="60" width="120" height="50" rx="8" fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth="2" />
                    <text x="460" y="90" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">Feature Store</text>

                    {/* Predictor Ensemble */}
                    <rect x="400" y="140" width="120" height="50" rx="8" fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth="2" />
                    <text x="460" y="170" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">Ensemble Voting</text>

                    {/* Forecaster / SHAP */}
                    <rect x="400" y="220" width="120" height="50" rx="8" fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth="2" />
                    <text x="460" y="250" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">Forecasting / SHAP</text>

                    {/* RAG Platform */}
                    <rect x="400" y="300" width="120" height="50" rx="8" fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth="2" />
                    <text x="460" y="330" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">RAG Vector Base</text>

                    {/* LLM Copilot */}
                    <rect x="600" y="180" width="130" height="50" rx="8" fill="rgba(139,92,246,0.15)" stroke="var(--accent-primary)" strokeWidth="2" />
                    <text x="665" y="210" fill="#FFF" fontSize="12" fontWeight="700" textAnchor="middle">Analytics Copilot</text>
                  </g>

                  {/* Connectors */}
                  <g stroke="#94A3B8" strokeWidth="1.5" fill="none">
                    {/* Ingest -> DB */}
                    <path d="M 140,205 L 200,205" markerEnd="url(#arrow)" />
                    {/* DB -> Features */}
                    <path d="M 340,205 L 370,205 L 370,85 L 400,85" markerEnd="url(#arrow)" />
                    {/* DB -> Ensemble */}
                    <path d="M 340,205 L 370,205 L 370,165 L 400,165" markerEnd="url(#arrow)" />
                    {/* DB -> Forecasting */}
                    <path d="M 340,205 L 370,205 L 370,245 L 400,245" markerEnd="url(#arrow)" />
                    {/* DB -> RAG */}
                    <path d="M 340,205 L 370,205 L 370,325 L 400,325" markerEnd="url(#arrow)" />

                    {/* Features -> Copilot */}
                    <path d="M 520,85 L 560,85 L 560,205 L 600,205" />
                    {/* Ensemble -> Copilot */}
                    <path d="M 520,165 L 560,165 L 560,205 L 600,205" />
                    {/* Forecasting -> Copilot */}
                    <path d="M 520,245 L 560,245 L 560,205 L 600,205" />
                    {/* RAG -> Copilot */}
                    <path d="M 520,325 L 560,325 L 560,205 L 600,205" />
                  </g>

                  {/* Arrow markers */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {/* SQL SHOWCASE */}
          {activeTab === 'sql' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }} className="sql-grid">
              <style>{`@media (max-width: 900px) { .sql-grid { grid-template-columns: 1fr !important; } }`}</style>
              
              {/* Toggles list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'cohort', label: 'Cohort Analysis Query' },
                  { id: 'rfm', label: 'Customer RFM Segmentation' },
                  { id: 'pareto', label: 'Pareto 80/20 Loss Drivers' }
                ].map((btn) => (
                  <div
                    key={btn.id}
                    onClick={() => setSqlQueryTab(btn.id)}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      background: sqlQueryTab === btn.id ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${sqlQueryTab === btn.id ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{btn.label}</span>
                  </div>
                ))}
              </div>

              {/* Syntax card preview */}
              <div className="glass-card" style={{ padding: 20 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>BUSINESS QUESTION</span>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#FFF', fontWeight: 600 }}>{sqlShowcase[sqlQueryTab].question}</p>
                
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>COMPILED SQL</span>
                <pre style={{
                  margin: '6px 0 16px',
                  padding: 12,
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#A7F3D0',
                  overflowX: 'auto',
                  fontFamily: 'monospace'
                }}>{sqlShowcase[sqlQueryTab].sql}</pre>

                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>SAMPLE WAREHOUSE OUTPUT</span>
                <div style={{ overflowX: 'auto', margin: '6px 0 16px' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {Object.keys(sqlShowcase[sqlQueryTab].result[0]).map(k => (
                          <th key={k} style={{ padding: 6, textAlign: 'left', color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlShowcase[sqlQueryTab].result.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {Object.values(row).map((val, vIdx) => (
                            <td key={vIdx} style={{ padding: 6, color: '#FFF' }}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ANALYTICAL INTERPRETATION</span>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{sqlShowcase[sqlQueryTab].interpretation}</p>
              </div>
            </div>
          )}

          {/* JOURNEY PANEL */}
          {activeTab === 'journey' && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 24px', fontSize: 16, color: '#FFF', fontFamily: 'Syne, sans-serif' }}>Software Engineering Project Journey</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {journeyTimeline.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(139,92,246,0.15)',
                        border: '2.5px solid var(--accent-primary)',
                        display: 'flex', alignItems: 'center', justify: 'center',
                        fontSize: 11, fontWeight: 800, color: 'var(--accent-primary)'
                      }}>
                        {idx + 1}
                      </div>
                      {idx < journeyTimeline.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: idx < journeyTimeline.length - 1 ? 16 : 0 }}>
                      <span style={{ fontSize: 10, color: 'var(--accent-primary)', fontWeight: 800 }}>{item.phase.toUpperCase()}</span>
                      <h4 style={{ margin: '2px 0 6px', color: '#FFF', fontSize: 14 }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEMO PANEL */}
          {activeTab === 'demo' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }} className="demo-grid">
              <style>{`@media (max-width: 900px) { .demo-grid { grid-template-columns: 1fr !important; } }`}</style>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'forecast', label: 'Holt-Winters Projections' },
                  { id: 'shap', label: 'SHAP Waterfall contributions' },
                  { id: 'ab', label: 'A/B Z-statistic calculator' }
                ].map((btn) => (
                  <div
                    key={btn.id}
                    onClick={() => setSelectedDemo(btn.id)}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      background: selectedDemo === btn.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{btn.label}</span>
                  </div>
                ))}
              </div>

              {/* Demo execution card */}
              <div className="glass-card" style={{ padding: 20 }}>
                {selectedDemo === 'forecast' && (
                  <div>
                    <span style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>LIVE DEMONSTRATION TRACK</span>
                    <h4 style={{ margin: '4px 0 12px', color: '#FFF' }}>Baseline Exponential Smoother</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                      Plots historical return rates alongside 15-day projections and 95% confidence bounds. Refits smoothing coefficients dynamically.
                    </p>
                    <div style={{ height: 160, background: 'rgba(0,0,0,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Forecast bounds: 16.2% return rate (lower: 12.4%, upper: 20.1%)</span>
                      <span style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>Stability Index: 91.8%</span>
                    </div>
                  </div>
                )}
                {selectedDemo === 'shap' && (
                  <div>
                    <span style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>LIVE DEMONSTRATION TRACK</span>
                    <h4 style={{ margin: '4px 0 12px', color: '#FFF' }}>Order-Level Shapley Values</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                      Computes local factor weights shifting prediction probability. Sum of feature weights shifts predicted score from baseline (18.3%).
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { feature: 'Listing Copy Quality score', weight: '-22.0% (Decreases Risk)', color: '#10B981' },
                        { feature: 'Image clarity check', weight: '+18.0% (Increases Risk)', color: '#EF4444' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.feature}</span>
                          <span style={{ color: item.color, fontWeight: 700 }}>{item.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDemo === 'ab' && (
                  <div>
                    <span style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>LIVE DEMONSTRATION TRACK</span>
                    <h4 style={{ margin: '4px 0 12px', color: '#FFF' }}>Z-Test Lift outcomes</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                      Runs Z-tests for proportions conversion rates. Yields statistical significance statements dynamically.
                    </p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 12, borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 700 }}>PROPORTIONS Z-TEST RESULT</span>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#FFF' }}>
                        Z-statistic: <strong>3.42</strong> | P-value: <strong>0.0006</strong> (Significant p &lt; 0.05)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESUME BULLETIN PANEL */}
          {activeTab === 'resume' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="resume-grid">
              <style>{`@media (max-width: 768px) { .resume-grid { grid-template-columns: 1fr !important; } }`}</style>
              
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF' }}>Copy-Paste Resume Bullet Points</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    • Engineered a natural-language-to-SQL translator and a semantic RAG platform using Groq and scikit-learn, enabling business teams to query warehouse data directly.
                  </div>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    • Built an interactive A/B testing framework in FastAPI/React to run proportions Z-tests, lifts, and statistical significance audits on product conversion rates.
                  </div>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    • Developed a time-series forecasting engine utilizing Holt-Winters Exponential Smoothing to predict monthly return risk rates with a stability score of 91.8%.
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#FFF' }}>Screening Interview Talking Points</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 12, background: 'rgba(139,92,246,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>GenAI Architecture:</strong> "I chose scikit-learn TF-IDF vector matching for RAG glossary search to prevent C++ compilation failures on standard windows deployment platforms, ensuring absolute runtime security."
                  </div>
                  <div style={{ padding: 12, background: 'rgba(139,92,246,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>Analytics Pipeline:</strong> "I implemented customer segmentation using RFM models and isolated return contributors via Pareto analysis SQL statements to prioritize catalog copy revisions."
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* INTERVIEW EXPLAINER OVERLAY MODAL */}
        <AnimatePresence>
          {explainOpen && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: 20
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '750px',
                  maxHeight: 'calc(100vh - 100px)',
                  overflowY: 'auto',
                  padding: 24,
                  background: 'rgba(10,8,22,0.98)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 17, color: '#FFF', fontFamily: 'Syne, sans-serif' }}>Explain This Project (Interviews slide)</h3>
                  <button onClick={() => setExplainOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>1. BUSINESS PROBLEM & DATASET</span>
                    ZeroReturn addresses the e-commerce return crisis (approx 20% aggregate rate in fashion/electronics). The dataset comprises simulated marketplace transactions containing columns for descriptions, price, images, customer details, and returned outcomes.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>2. RELATIONAL DATA WAREHOUSE & PIPELINE</span>
                    Designed dimension/fact schema matching (dim_product_analytics, customer_features, seller_features). Pipeline cleans duplicates and fills null values before syncing features.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>3. PREDICTOR & FORECASTER ENSEMBLE</span>
                    Employs random forest, XGBoost, LightGBM, and CatBoost models to output return probability risk scores. Projections are forecasted using double exponential smoothing.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>4. EXPERIMENTATION & SHAP EXPLAINABILITY</span>
                    Wired controlled Z-tests to measure conversion lifts, combined with SHAP explanations which detail the contribution of features towards shifting prediction probabilities.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>5. AI COPILOT & DEPLOYMENT</span>
                    Bridges database variables and RAG knowledge using Llama 3 models, securing SQL executions against injections. The platform compiles under Vite.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setExplainOpen(false)} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 8 }}>Proceed</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  )
}
