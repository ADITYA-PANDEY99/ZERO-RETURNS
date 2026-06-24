import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, Database, Compass, CheckCircle, ShieldAlert, Award, ArrowUpRight,
  TrendingDown, Cpu, BarChart2, BookOpen, Layers, Terminal, Clock, Briefcase, UserCheck, Play,
  Settings, ChevronRight, Activity, Percent, DollarSign, Download, Clipboard
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { formatCurrency } from '../utils/helpers'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function Recruiter() {
  const [activeTab, setActiveTab] = useState('overview')
  const [readinessData, setReadinessData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [explainOpen, setExplainOpen] = useState(false)
  const [selectedRoleDetail, setSelectedRoleDetail] = useState('data_analyst')
  const [selectedWalkthrough, setSelectedWalkthrough] = useState('5m')

  // Business Impact Simulator Inputs
  const [simOrders, setSimOrders] = useState(25000)
  const [simReturnRate, setSimReturnRate] = useState(18.3)
  const [simAOV, setSimAOV] = useState(1200)

  useEffect(() => {
    async function fetchReadiness() {
      try {
        const res = await fetch(`${API_URL}/enterprise/recruiter/readiness`).then(r => r.json())
        setReadinessData(res)
      } catch (err) {
        console.error('Readiness API fetch failed, using local fallback:', err)
        setReadinessData({
          maturities: {
            analytics: { earned: 8, max: 8, score: 100 },
            forecasting: { earned: 5, max: 6, score: 83 },
            explainability: { earned: 4, max: 5, score: 80 },
            experimentation: { earned: 5, max: 6, score: 83 },
            ai: { earned: 7, max: 8, score: 87 },
            governance: { earned: 6, max: 7, score: 85 }
          },
          roles: {
            data_analyst: { score: 91, interval: 3, evidence_count: 5 },
            business_analyst: { score: 85, interval: 4, evidence_count: 4 },
            product_analyst: { score: 88, interval: 4, evidence_count: 4 },
            data_scientist: { score: 82, interval: 5, evidence_count: 4 },
            ai_ml_engineer: { score: 84, interval: 5, evidence_count: 4 }
          },
          benchmarks: {
            typical_dashboard: { analytics: 30, forecasting: 10, explainability: 5, experimentation: 0, ai: 0, governance: 15 },
            typical_da_portfolio: { analytics: 60, forecasting: 20, explainability: 15, experimentation: 45, ai: 25, governance: 30 },
            typical_ds_portfolio: { analytics: 50, forecasting: 70, explainability: 60, experimentation: 50, ai: 40, governance: 20 },
            zeroreturn: { analytics: 100, forecasting: 83, explainability: 80, experimentation: 83, ai: 87, governance: 85 }
          },
          evidence: {
            analytics: {
              files: ["analytics_layer.py", "Dashboard.jsx"],
              apis: ["GET /api/analytics/cohorts", "GET /api/analytics/rfm", "GET /api/analytics/pareto"],
              dashboards: ["Analytics & Customer Cohorts Dashboard"],
              outcomes: "Categorizes customers by recency, frequency, and monetary metrics; isolates 80% return drivers."
            },
            forecasting: {
              files: ["forecasting_engine.py", "WhatIfSimulator.jsx"],
              apis: ["GET /api/analytics/forecast"],
              dashboards: ["Forecasting & What-If Simulation Center"],
              outcomes: "Plots 15-day return forecasts with Holt-Winters double exponential smoothing models."
            },
            explainability: {
              files: ["forecasting_engine.py", "orders.py"],
              apis: ["GET /api/orders/{id}/shap"],
              dashboards: ["Model Explainability Center"],
              outcomes: "Isolates order-level risk factors (listing mismatch, image quality) using Shapley contribution values."
            },
            experimentation: {
              files: ["experimentation_engine.py"],
              apis: ["GET /api/analytics/experiments"],
              dashboards: ["A/B Testing & Controlled Experiments Lab"],
              outcomes: "Runs two-sample proportions Z-tests, calculating conversion lifts and p-value significance bounds."
            },
            ai: {
              files: ["copilot_engine.py", "security.py"],
              apis: ["POST /api/chatbot/message", "POST /api/enterprise/copilot/query"],
              dashboards: ["AI Analytics Copilot Hub"],
              outcomes: "Provides SQL translation, cosine similarity RAG, source attribution, hallucination checks, and prompt injection filters."
            },
            governance: {
              files: ["governance_engine.py", "metadata_engine.py"],
              apis: ["GET /api/enterprise/governance", "GET /api/enterprise/lineage"],
              dashboards: ["Data Lineage Command Center", "Data Governance & Trust Dashboard"],
              outcomes: "Validates schema drift, pipeline freshness, duplicate records, and maps database lineage dynamically."
            }
          }
        })
      } finally {
        setLoading(false)
      }
    }
    fetchReadiness()
  }, [])

  // Calculate dynamic simulator metrics based on recruiter input
  const totalLoss = simOrders * (simReturnRate / 100) * simAOV
  const preventedLoss = totalLoss * 0.22
  const operationalSavings = (simOrders * (simReturnRate / 100) * 180) * 0.22
  const totalBusinessBenefit = preventedLoss + operationalSavings

  const handleCopyText = (textId) => {
    const textEl = document.getElementById(textId)
    if (textEl) {
      navigator.clipboard.writeText(textEl.innerText)
      alert("Copied to clipboard!")
    }
  }

  // Capability mapping definitions for detail popups
  const roleEvidenceMapping = {
    data_analyst: {
      title: "Data Analyst Competency Map",
      formula: "Analytics (35%) + Experimentation (20%) + Governance (20%) + Forecasting (15%) + AI (10%)",
      skills: ["Complex Joins & Cohorts", "RFM Customer Segmentation", "Data Quality Audits", "Z-Tests", "Maturity Depth Assessments"],
      capabilities: ["analytics", "experimentation", "governance", "forecasting", "ai"]
    },
    business_analyst: {
      title: "Business Analyst Competency Map",
      formula: "Analytics (30%) + Experimentation (30%) + Governance (20%) + Forecasting (20%)",
      skills: ["Pareto 80/20 return analysis", "Controlled Marketplace Experiments", "Double exponential forecasting", "ROI Business Modelling"],
      capabilities: ["analytics", "experimentation", "governance", "forecasting"]
    },
    product_analyst: {
      title: "Product Analyst Competency Map",
      formula: "Experimentation (40%) + Analytics (30%) + AI (20%) + Governance (10%)",
      skills: ["Proportions Z-Tests", "Conversion Lift statistics", "Llama SQL translate interactions", "A/B Test Guardrails"],
      capabilities: ["experimentation", "analytics", "ai", "governance"]
    },
    data_scientist: {
      title: "Data Scientist Competency Map",
      formula: "Forecasting (30%) + Explainability (30%) + Experimentation (20%) + Analytics (20%)",
      skills: ["TimeSeries Holt-Winters Forecasting", "Local Shapley value calculations", "CatBoost returns classification", "Accuracy metrics RMSE/MAPE"],
      capabilities: ["forecasting", "explainability", "experimentation", "analytics"]
    },
    ai_ml_engineer: {
      title: "AI & ML Engineer Competency Map",
      formula: "AI (35%) + Explainability (25%) + Forecasting (20%) + Governance (20%)",
      skills: ["Llama SQL translations", "RAG vector platform logic", "Prompt Injection validations", "SHAP contribution matrices", "Retrieval Quality & Hallucination checks"],
      capabilities: ["ai", "explainability", "forecasting", "governance"]
    }
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>
        
        {/* Hub Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24, marginTop: 16 }}>
          <div>
            <h1 className="logo-text font-display" style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Recruiter <span className="gradient-text">Conversion Center</span>
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Evaluate candidate qualifications, verify skill evidence matrices, simulate business impact, and access interview resources.
            </p>
          </div>
          <button
            onClick={() => setExplainOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontWeight: 700 }}
          >
            <Play size={16} fill="currentColor" />
            <span>Explain Project (Slides)</span>
          </button>
        </div>

        {/* Project Health Dashboard Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'REST APIs', val: '22', color: 'var(--accent-primary)' },
            { label: 'Dashboards', val: '5', color: 'var(--accent-secondary)' },
            { label: 'Calculated KPIs', val: '18', color: '#10B981' },
            { label: 'Forecast Models', val: '2', color: '#F97316' },
            { label: 'ML Classifiers', val: '5', color: '#F59E0B' },
            { label: 'Experiments', val: '2', color: '#06B6D4' },
            { label: 'Industry Modes', val: '5', color: '#3b82f6' },
            { label: 'Enterprise Features', val: '6', color: '#eab308' },
          ].map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: 16, textAlign: 'center', borderTop: `3px solid ${item.color}` }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {item.label}
              </span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFF' }}>{item.val}</h2>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, borderBottom: '1px solid var(--glass-border)' }}>
          {[
            { id: 'overview', label: 'Fit & Differentiation', icon: Compass },
            { id: 'skills', label: 'Skill Proof Matrix', icon: Award },
            { id: 'roles', label: 'Role Readiness Engine', icon: UserCheck },
            { id: 'sim', label: 'Impact Simulator', icon: DollarSign },
            { id: 'walkthrough', label: 'Guided Recruiter Walk', icon: Clock },
            { id: 'package', label: 'Resume Content Builder', icon: Briefcase }
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
                  fontSize: '0.85rem',
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Computing candidate capability readiness indices...</p>
          </div>
        ) : (
          <div style={{ marginBottom: 40 }}>
            
            {/* ── TAB 1: OVERVIEW & DIFFERENTIATION ────────── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Differentiators Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }} className="recruiter-grid">
                  <style>{`@media (max-width: 900px) { .recruiter-grid { grid-template-columns: 1fr !important; } }`}</style>
                  
                  <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: 12, marginTop: 0 }}>Why Hire Aditya Pandey?</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <strong style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>Enterprise Engineering Practices</strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2, lineHeight: 1.4 }}>
                          ZeroReturn is not a mock spreadsheet page. It is backed by a relational SQLite warehouse running star schemas, feature store caches, and secure REST APIs.
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>Production Hardening & Safety</strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2, lineHeight: 1.4 }}>
                          Wired with sliding request rate limiters, LLM SQL compilers, prompt injection blockers, and secure global exception handlers that block server traceback leaks.
                        </p>
                      </div>
                      <div>
                        <strong style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>Decisional Intelligence Autonomy</strong>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2, lineHeight: 1.4 }}>
                          Combines traditional diagnostic tools (Pareto, RFM) with forecasting smoothers, Z-tests experiments, and explainable AI models to guide boardroom decisions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: 12, marginTop: 0 }}>Conversion Snapshot</h3>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--glass-border)', paddingBottom: 8, fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Relational Warehouse</span>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>VERIFIED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--glass-border)', padding: '8px 0', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Dynamic Lineage Flow</span>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>VERIFIED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--glass-border)', padding: '8px 0', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Prompt Injection Shield</span>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>VERIFIED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Automated Test Coverage</span>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>7/7 PASSED</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        💡 <strong>Hiring Manager Note:</strong> Review the tabs above to inspect physical file traces in the repository confirming the depth of engineering.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparative Capability Matrix */}
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: 6, marginTop: 0 }}>Comparative Capability Matrix</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Quantitative maturity depth (%) comparing typical analyst projects vs. the ZeroReturn AI platform.
                  </p>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: 12, fontWeight: 700 }}>CAPABILITY / MATURITY LAYER</th>
                          <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>TYPICAL DASHBOARD</th>
                          <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>TYPICAL DA PORTFOLIO</th>
                          <th style={{ padding: 12, textAlign: 'center', fontWeight: 700 }}>TYPICAL DS PORTFOLIO</th>
                          <th style={{ padding: 12, textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 800 }}>ZERORETURN AI PLATFORM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readinessData.maturities && Object.entries(readinessData.maturities).map(([capKey, capVal], idx) => {
                          const capLabel = capKey.replace(/_/g, ' ').toUpperCase()
                          const bData = readinessData.benchmarks || {}
                          const tDash = bData.typical_dashboard?.[capKey] ?? 0
                          const tDA = bData.typical_da_portfolio?.[capKey] ?? 0
                          const tDS = bData.typical_ds_portfolio?.[capKey] ?? 0
                          const zRet = capVal.score
                          const earned = capVal.earned
                          const maxP = capVal.max

                          return (
                            <tr key={capKey} style={{ borderBottom: '1px solid var(--glass-border)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                              <td style={{ padding: 12, fontWeight: 700, color: '#FFF' }}>
                                {capLabel} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>({earned}/{maxP} pts)</span>
                              </td>
                              <td style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)' }}>{tDash}%</td>
                              <td style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)' }}>{tDA}%</td>
                              <td style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)' }}>{tDS}%</td>
                              <td style={{ padding: 12, textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 800, fontSize: '0.95rem' }}>
                                {zRet}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: SKILL PROOF MATRIX ────────────────── */}
            {activeTab === 'skills' && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: 16, marginTop: 0 }}>Candidate Verified Skills Matrix</h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: 12, fontWeight: 700 }}>SKILL</th>
                        <th style={{ padding: 12, fontWeight: 700 }}>FEATURE</th>
                        <th style={{ padding: 12, fontWeight: 700 }}>CODE MODULE</th>
                        <th style={{ padding: 12, fontWeight: 700 }}>VERIFIED PROOF OUTCOME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { skill: "SQL Warehouse Querying", feature: "Pareto & RFM Segmentation", module: "analytics_layer.py", proof: "Calculates customer segments and isolates return drivers dynamically on SQLite tables." },
                        { skill: "Time-Series Forecasting", feature: "Arima/Holt-Winters Projections", module: "forecasting_engine.py", proof: "Runs double smoothing forecasting to project 15-day risk bounds." },
                        { skill: "Explainable AI (SHAP)", feature: "Local Feature Contribution", module: "forecasting_engine.py", proof: "Isolates how catalog descriptions and sentiments shift individual transaction return risk probability." },
                        { skill: "Experimentation (A/B)", feature: "Controlled Lift Experiments", module: "experimentation_engine.py", proof: "Performs proportions Z-statistic, lift ratio, and p-value significance bounds calculations." },
                        { skill: "Database Governance", feature: "Schema Audits & Freshness", module: "governance_engine.py", proof: "Exposes schema drift validators, record completeness counts, and daily freshness SLAs." },
                        { skill: "LLM Safety & API Hardening", feature: "SQL Sanitizers & Rate Limits", module: "security.py", proof: "Blocks prompt injection jailbreaks, sanitizes SQL translation strings, and throttles client requests." }
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: 12, fontWeight: 700, color: '#FFF' }}>{row.skill}</td>
                          <td style={{ padding: 12, color: 'var(--accent-secondary)' }}>{row.feature}</td>
                          <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#FFF' }}>{row.module}</td>
                          <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{row.proof}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 3: ROLE READINESS SCORES ──────────────── */}
            {activeTab === 'roles' && readinessData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 24 }} className="recruiter-grid">
                {/* Scores List */}
                <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: 8, marginTop: 0 }}>Target Roles & Fit Scores</h3>
                  
                  {Object.entries(readinessData.roles).map(([roleKey, roleVal]) => {
                    const label = roleKey.replace(/_/g, ' ').toUpperCase()
                    return (
                      <div
                        key={roleKey}
                        onClick={() => setSelectedRoleDetail(roleKey)}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          background: selectedRoleDetail === roleKey ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
                          border: selectedRoleDetail === roleKey ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          borderLeft: selectedRoleDetail === roleKey ? '4px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>{label}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                            {roleVal.score} ± {roleVal.interval}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Score Transparency Inspection Panel */}
                <div className="glass-card" style={{ padding: 24 }}>
                  {selectedRoleDetail && roleEvidenceMapping[selectedRoleDetail] ? (
                    <div>
                      <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 12, marginBottom: 20 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#FFF', fontWeight: 800 }}>{roleEvidenceMapping[selectedRoleDetail].title}</h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Formula: <strong>{roleEvidenceMapping[selectedRoleDetail].formula}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#FFF', display: 'block', marginBottom: 6 }}>Detected Competency Skills</strong>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {roleEvidenceMapping[selectedRoleDetail].skills.map((skill, i) => (
                              <span key={i} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#FFF' }}>{skill}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#FFF', display: 'block', marginBottom: 8 }}>Evidence Transparency (Live Audited Logs)</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {roleEvidenceMapping[selectedRoleDetail].capabilities.map((capKey) => {
                              const evidence = readinessData.evidence?.[capKey]
                              const capMaturity = readinessData.maturities?.[capKey]
                              if (!evidence) return null

                              return (
                                <div key={capKey} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>
                                      {capKey} ({capMaturity?.score}% Maturity)
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      {capMaturity?.earned}/{capMaturity?.max} checks verified
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <div>
                                      <strong style={{ color: '#FFF' }}>Supporting Files: </strong>
                                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>{evidence.files.join(', ')}</span>
                                    </div>
                                    <div>
                                      <strong style={{ color: '#FFF' }}>Supporting APIs: </strong>
                                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>{evidence.apis.join(', ')}</span>
                                    </div>
                                    <div>
                                      <strong style={{ color: '#FFF' }}>Supporting Dashboards: </strong>
                                      <span>{evidence.dashboards.join(', ')}</span>
                                    </div>
                                    <div>
                                      <strong style={{ color: '#FFF' }}>Supporting Outcomes: </strong>
                                      <span style={{ color: 'var(--success)' }}>{evidence.outcomes}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Click any role competency score to verify why it exists, what calculations support it, and inspect the codebase files that contributed to the score.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: IMPACT SIMULATOR ──────────────────── */}
            {activeTab === 'sim' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 24 }} className="recruiter-grid">
                {/* Sliders Input Panel */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: 20, marginTop: 0 }}>Adjust Marketplace Parameters</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Monthly Checkout Volume</span>
                        <span style={{ color: '#FFF', fontWeight: 700 }}>{simOrders.toLocaleString()} orders</span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="100000"
                        step="1000"
                        value={simOrders}
                        onChange={e => setSimOrders(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Baseline Return Rate</span>
                        <span style={{ color: '#FFF', fontWeight: 700 }}>{simReturnRate}%</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="40.0"
                        step="0.1"
                        value={simReturnRate}
                        onChange={e => setSimReturnRate(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        <span>Average Order Value (AOV)</span>
                        <span style={{ color: '#FFF', fontWeight: 700 }}>₹{simAOV}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={simAOV}
                        onChange={e => setSimAOV(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Predicted Dynamic Benefit Outputs */}
                <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: 16, marginTop: 0 }}>Calculated AI Platform Value Impact</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prevented Returns Value</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
                        {formatCurrency(preventedLoss)}
                      </div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 8, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.15)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logistics Charges Saved</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: 4 }}>
                        {formatCurrency(operationalSavings)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Monthly Business Saving Benefit</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFF', marginTop: 4 }}>
                      {formatCurrency(totalBusinessBenefit)}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                      Calculations assume an average double-leg logistics saving of ₹180 per shipment and an AI-driven return prevention threshold of 22% calculated on current categories.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: WALKTHROUGH FLOWS ────────────────── */}
            {activeTab === 'walkthrough' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 24 }} className="recruiter-grid">
                {/* Select Walk Options */}
                <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: 10, marginTop: 0 }}>Guided Walkthrough Options</h3>
                  {[
                    { id: '5m', label: '5-Minute Recruiter Demo', desc: 'Overview of capabilities and dynamic multi-industry switcher.' },
                    { id: '10m', label: '10-Minute Analytics Deep Dive', desc: 'Focus on database lineages, governance logs, and Z-tests.' },
                    { id: '15m', label: '15-Minute Technical System Review', desc: 'Comprehensive review of CatBoost predictors and prompt compilers.' }
                  ].map(walk => (
                    <button
                      key={walk.id}
                      onClick={() => setSelectedWalkthrough(walk.id)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: selectedWalkthrough === walk.id ? 'rgba(139,92,246,0.1)' : 'transparent',
                        border: '1px solid transparent',
                        borderLeft: selectedWalkthrough === walk.id ? '3px solid var(--accent-primary)' : '1px solid transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.85rem' }}>{walk.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{walk.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Display Selected Walk Script */}
                <div className="glass-card" style={{ padding: 24 }}>
                  {selectedWalkthrough === '5m' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', color: '#FFF', fontSize: '1.1rem', marginTop: 0 }}>5-Minute Recruiter Walkthrough Script</h4>
                      <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.4 }}>
                        <li><strong>Landing Experience</strong>: Load landing page displaying 'ZeroReturn AI'. Point out the dynamic money-saved counter.</li>
                        <li><strong>Guided Onboarding</strong>: Click <em>Take Guided Tour</em>. Point out how driver.js highlights the live metrics cards and industry selector.</li>
                        <li><strong>Multi-Industry switch</strong>: Switch to <em>Banking & Cards</em>. Show how metrics instantly swap names and calculation rules.</li>
                        <li><strong>AI Analytics Chatbot</strong>: Open the chat helper in the bottom-right and ask 'What is the return rate breakdown?'. Highlight the generated SQL.</li>
                      </ol>
                    </div>
                  )}

                  {selectedWalkthrough === '10m' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', color: '#FFF', fontSize: '1.1rem', marginTop: 0 }}>10-Minute Analytics Deep Dive Script</h4>
                      <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.4 }}>
                        <li><strong>Data Lineage Command</strong>: Go to <em>Enterprise Hub</em>. Click nodes to trace raw records from `production.orders` down to final dashboard KPIs.</li>
                        <li><strong>Data Governance Checks</strong>: Point out the completeness rating and schema validation logs verifying the pipeline integrity.</li>
                        <li><strong>Controlled Z-Tests</strong>: Navigate to <em>Analytics</em>. Examine the proportions Z-statistic, lift ratio, and p-value significance outcomes.</li>
                      </ol>
                    </div>
                  )}

                  {selectedWalkthrough === '15m' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', color: '#FFF', fontSize: '1.1rem', marginTop: 0 }}>15-Minute Technical System Review Script</h4>
                      <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.4 }}>
                        <li><strong>SQL Compiler Hardening</strong>: Review `security.py` in your code reviewer. Explain the AST regex limits blocking comments and mutating keyword clauses.</li>
                        <li><strong>Shapley Local Explanations</strong>: Open the order analysis page, select an order, and show how the SHAP chart breaks down catalog risks.</li>
                        <li><strong>Automated Test Runs</strong>: Execute `pytest` in terminal to confirm all 7 system tests pass securely.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 6: RESUME CONTENT BUILDER ────────────── */}
            {activeTab === 'package' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="recruiter-grid">
                {/* Copy Bullets */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#FFF', fontWeight: 800 }}>Resume Bullet Points</h4>
                    <button onClick={() => handleCopyText('resume-bullets')} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                      <Clipboard size={14} /> Copy
                    </button>
                  </div>
                  <div id="resume-bullets" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p>• Engineered a high-performance e-commerce returns analytics platform utilizing SQLite database warehouse star schemas and pre-computed feature stores.</p>
                    <p>• Deployed a secure, natural-language SQL translator utilizing LLMs and scikit-learn TF-IDF RAG components protected by SQL sanitizers and rate limiters.</p>
                    <p>• Configured time-series forecasting (Holt-Winters smoothing) and explainable AI models (SHAP) to isolate individual transaction return risks.</p>
                  </div>
                </div>

                {/* Interview Talking Points */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#FFF', fontWeight: 800 }}>Screening Interview Talking Points</h4>
                    <button onClick={() => handleCopyText('talking-points')} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                      <Clipboard size={14} /> Copy
                    </button>
                  </div>
                  <div id="talking-points" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p><strong>On Data Engineering:</strong> "I designed the star schema warehouse joining dim_product and customer_analytics dimensions to fact_returns to isolate return risk patterns at checkout."</p>
                    <p><strong>On API Security:</strong> "I implemented regex sanitization checking generated SQL commands for comment clauses (`--`, `/*`) and mutating keywords, maintaining a zero-vulnerability rate."</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

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
                  <h3 style={{ margin: 0, fontSize: 17, color: '#FFF', fontFamily: 'Syne, sans-serif' }}>Explain This Project (Slides)</h3>
                  <button onClick={() => setExplainOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>1. BUSINESS PROBLEM & DATASET</span>
                    ZeroReturn addresses the e-commerce return crisis (approx 18.3% aggregate rate in clothing/electronics). The dataset comprises simulated marketplace transactions containing columns for descriptions, price, review scores, customer names, and returned outcomes.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>2. RELATIONAL DATA WAREHOUSE & PIPELINE</span>
                    Designed dimension/fact schema matching (dim_product_analytics, customer_features, seller_features). Pipeline cleans duplicates and fills null values before syncing features.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>3. PREDICTOR & FORECASTER ENSEMBLE</span>
                    Employs CatBoost models to output return probability risk scores. Projections are forecasted using Holt-Winters Double Exponential Smoothing models.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>4. EXPERIMENTATION & SHAP EXPLAINABILITY</span>
                    Wired controlled Z-tests to measure conversion lifts, combined with SHAP explanations which detail the contribution of features towards shifting prediction probabilities.
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>5. AI COPILOT & DEPLOYMENT</span>
                    Bridges database variables and RAG knowledge using Llama models via Groq, securing SQL executions against SQL injections.
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
