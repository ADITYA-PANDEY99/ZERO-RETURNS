import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, X, ArrowRight, BarChart2, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import { formatCurrency } from '../utils/helpers'

const STEPS = ['Upload File', 'Map Columns', 'Processing', 'Results']

const FIELD_OPTIONS = [
  'order_id', 'product_name', 'category', 'price',
  'description', 'image_url', 'review_text', '[skip this column]',
]

const mockDetectedColumns = [
  'Order ID', 'Product', 'Category', 'Price (₹)', 'Description', 'Image Link', 'Customer Reviews', 'Seller SKU',
]

const defaultMapping = {
  'Order ID': 'order_id',
  'Product': 'product_name',
  'Category': 'category',
  'Price (₹)': 'price',
  'Description': 'description',
  'Image Link': 'image_url',
  'Customer Reviews': 'review_text',
  'Seller SKU': '[skip this column]',
}

const RISK_DIST = [
  { label: 'Critical', count: 8, color: '#EF4444' },
  { label: 'High', count: 17, color: '#F97316' },
  { label: 'Medium', count: 22, color: '#F59E0B' },
  { label: 'Low', count: 53, color: '#10B981' },
]

export default function Upload() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [mapping, setMapping] = useState({ ...defaultMapping })
  const [progress, setProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState(0)

  const PROCESSING_STEPS = [
    'File parsed successfully',
    'Columns mapped',
    'Running return predictor...',
    'Analyzing descriptions...',
    'Generating insights...',
  ]

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files[0]
    if (f) setFile(f)
  }, [])

  const handleFileInput = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const startProcessing = () => {
    setStep(2)
    let pStep = 0
    let prog = 0
    const interval = setInterval(() => {
      prog += 4
      setProgress(Math.min(prog, 100))
      if (prog % 20 === 0 && pStep < PROCESSING_STEPS.length - 1) {
        pStep++
        setProcessingStep(pStep)
      }
      if (prog >= 100) {
        clearInterval(interval)
        setTimeout(() => setStep(3), 600)
      }
    }, 90)
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{
            margin: '0 0 4px',
            fontFamily: 'Syne, sans-serif',
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Upload Data
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            Analyze your order data for return risk
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}>
                <motion.div
                  animate={{
                    background: i < step ? '#10B981' : i === step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                    borderColor: i <= step ? 'transparent' : 'rgba(255,255,255,0.15)',
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '2px solid',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: i <= step ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {i < step ? <CheckCircle size={18} /> : i + 1}
                </motion.div>
                <span style={{ fontSize: 11, fontWeight: i === step ? 700 : 400, color: i === step ? 'var(--accent-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: i < step ? '#10B981' : 'rgba(255,255,255,0.08)',
                  margin: '0 8px',
                  marginBottom: 24,
                  borderRadius: 1,
                  transition: 'background 0.4s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* ─── STEP 0: Dropzone ─── */}
            {step === 0 && (
              <div className="glass-card" style={{ padding: 32 }}>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent-primary)' : file ? '#10B981' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 16,
                    padding: '56px 32px',
                    textAlign: 'center',
                    background: dragOver
                      ? 'rgba(139,92,246,0.08)'
                      : file
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.25s',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.json"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                  />
                  <motion.div
                    animate={dragOver ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    style={{ marginBottom: 20 }}
                  >
                    {file
                      ? <CheckCircle size={56} color="#10B981" style={{ margin: '0 auto' }} />
                      : <UploadIcon size={56} color="var(--accent-primary)" style={{ margin: '0 auto', opacity: dragOver ? 1 : 0.7 }} />
                    }
                  </motion.div>
                  {file ? (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#10B981' }}>
                        {file.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                        {(file.size / 1024).toFixed(1)} KB — Ready to analyze
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {dragOver ? 'Drop your file here' : 'Drag & drop your data file'}
                      </p>
                      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                        Supports CSV, XLSX, JSON — max 50MB
                      </p>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {['CSV', 'XLSX', 'JSON'].map(t => (
                          <span key={t} style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            background: 'rgba(139,92,246,0.1)',
                            border: '1px solid rgba(139,92,246,0.25)',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--accent-primary)',
                          }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Demo upload option */}
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>or </span>
                  <button
                    onClick={() => setFile({ name: 'sample_orders.csv', size: 45600 })}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    use sample dataset →
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => file && setStep(1)}
                  disabled={!file}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 24, padding: '13px', fontSize: 15, fontWeight: 700, opacity: file ? 1 : 0.5 }}
                >
                  Upload & Analyze →
                </motion.button>
              </div>
            )}

            {/* ─── STEP 1: Column Mapping ─── */}
            {step === 1 && (
              <div className="glass-card" style={{ padding: 28 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Map Your Columns</h3>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
                  Tell us which columns in your file correspond to which fields
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        {['Detected Column', 'Mapped To ZeroReturn Field'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.02)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockDetectedColumns.map((col) => (
                        <tr key={col} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText size={14} color="var(--text-muted)" />
                              {col}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <select
                              className="input"
                              value={mapping[col] || '[skip this column]'}
                              onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                              style={{ fontSize: 13, padding: '7px 10px', minWidth: 220 }}
                            >
                              {FIELD_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button onClick={() => setStep(0)} className="btn btn-secondary" style={{ flex: 1 }}>← Back</button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startProcessing}
                    className="btn btn-primary"
                    style={{ flex: 2, fontSize: 15, fontWeight: 700 }}
                  >
                    Confirm Mapping & Process →
                  </motion.button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Processing ─── */}
            {step === 2 && (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid var(--accent-primary)', margin: '0 auto 24px' }}
                />
                <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Analyzing Your Data
                </h3>
                <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-muted)' }}>
                  ZeroReturn AI is processing 100 orders...
                </p>

                <div style={{ marginBottom: 24, textAlign: 'left', maxWidth: 400, margin: '0 auto 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Progress</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      style={{
                        height: '100%',
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                        boxShadow: '0 0 12px rgba(139,92,246,0.5)',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360, margin: '0 auto', textAlign: 'left' }}>
                  {PROCESSING_STEPS.map((s, i) => (
                    <motion.div
                      key={s}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: i <= processingStep ? 1 : 0.3 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                    >
                      {i < processingStep
                        ? <CheckCircle size={16} color="#10B981" />
                        : i === processingStep
                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ color: 'var(--accent-primary)' }}>⟳</motion.div>
                        : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }} />
                      }
                      <span style={{ color: i <= processingStep ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{s}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── STEP 3: Results ─── */}
            {step === 3 && (
              <div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                  style={{ textAlign: 'center', marginBottom: 28 }}
                >
                  <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 16px' }} />
                  <h2 style={{ margin: '0 0 8px', fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#10B981' }}>
                    Analysis Complete!
                  </h2>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                    Your data has been analyzed. Here's what we found:
                  </p>
                </motion.div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="result-grid">
                  <style>{`@media(max-width:600px){.result-grid{grid-template-columns:1fr!important}}`}</style>
                  {[
                    { label: 'Orders Analyzed', value: '100', color: '#3B82F6', icon: '📦' },
                    { label: 'High-Risk Detected', value: '25', color: '#EF4444', icon: '⚠️' },
                    { label: 'Revenue at Risk', value: formatCurrency(456000), color: '#F97316', icon: '💸' },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} style={{
                      padding: '20px',
                      borderRadius: 14,
                      background: `${color}12`,
                      border: `1px solid ${color}33`,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', color }}>{value}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Risk distribution bar chart */}
                <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Risk Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={RISK_DIST} margin={{ left: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1200}>
                        {RISK_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* CTA buttons */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <motion.a
                    href="/dashboard"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '13px', fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
                  >
                    Go to Dashboard →
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '13px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Download size={16} />
                    Download Report
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
