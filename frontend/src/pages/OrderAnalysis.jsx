import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts'
import {
  ArrowLeft, ChevronRight, AlertTriangle, CheckCircle, Zap,
  ImageIcon, FileText, Star, Lightbulb, TrendingDown, BarChart2
} from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { useDashboardStore } from '../store/dashboardStore'
import { formatCurrency, formatDate, getRiskColor, getRiskBadgeClass, getGaugeColor } from '../utils/helpers'

const TABS = ['Description', 'Image Quality', 'Review Sentiment', 'AI Suggestions']

// Semi-circle gauge using recharts PieChart
function ReturnGauge({ value }) {
  const color = getGaugeColor(value)
  const data = [
    { value, fill: color },
    { value: 100 - value, fill: 'rgba(255,255,255,0.05)' },
  ]
  return (
    <div style={{ position: 'relative', width: 220, height: 130, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            dataKey="value"
            animationDuration={1200}
            stroke="none"
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'Syne, sans-serif', color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Return Probability</div>
      </div>
    </div>
  )
}

// Description Tab
function DescriptionTab({ order }) {
  const badDesc = `This ${order.product_name} is a great product. It is available in various sizes. Made of quality material. Ships fast. Customer will love it.`
  const goodDesc = `Experience premium quality with the ${order.product_name}. Crafted from high-grade materials, this product features ${order.category.toLowerCase()}-grade specifications and has been tested for durability. Available in standard sizes (S, M, L, XL) with accurate measurements in the description. Includes complete accessories: charging cable, manual, and carry case. 100% compatible with all major platforms. Backed by 12-month manufacturer warranty.`
  const issues = ['No size chart included', 'Generic "quality material" claim', 'Missing SKU / model details', 'No warranty information', 'Poor use of keywords']

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Description Mismatch Score:</span>
        <span className={`badge badge-${order.description_quality_score < 40 ? 'critical' : order.description_quality_score < 70 ? 'medium' : 'low'}`}>
          {order.description_quality_score}/100
        </span>
      </div>

      {/* Original */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
          ⚠️ Current Description (Issues Highlighted)
        </h4>
        <div style={{
          padding: '16px',
          borderRadius: 10,
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
        }}>
          This <mark style={{ background: 'rgba(239,68,68,0.3)', borderRadius: 3, padding: '0 3px' }}>{order.product_name}</mark> is a{' '}
          <mark style={{ background: 'rgba(239,68,68,0.3)', borderRadius: 3, padding: '0 3px' }}>great product</mark>. It is available in{' '}
          <mark style={{ background: 'rgba(245,158,11,0.3)', borderRadius: 3, padding: '0 3px' }}>various sizes</mark>. Made of{' '}
          <mark style={{ background: 'rgba(239,68,68,0.3)', borderRadius: 3, padding: '0 3px' }}>quality material</mark>.{' '}
          Ships fast. Customer will love it.
        </div>
      </div>

      {/* Issues list */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Issues Found</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {issues.map((issue, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <AlertTriangle size={14} color="#F59E0B" />
              {issue}
            </div>
          ))}
        </div>
      </div>

      {/* AI-improved description */}
      <div>
        <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#10B981' }}>
          ✅ AI-Improved Description
        </h4>
        <div style={{
          padding: '16px',
          borderRadius: 10,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
        }}>
          {goodDesc}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 14, fontSize: 13 }}>
          Apply AI Description
        </button>
      </div>
    </div>
  )
}

// Image Quality Tab
function ImageQualityTab({ order }) {
  const score = order.description_quality_score
  const metrics = [
    { label: 'Brightness', value: 72, color: '#F59E0B' },
    { label: 'Contrast', value: 58, color: '#F97316' },
    { label: 'Sharpness', value: 85, color: '#10B981' },
    { label: 'Composition', value: 64, color: '#F59E0B' },
  ]
  const imageIssues = ['Background clutter detected', 'Low contrast in product edges', 'Missing white-background version', 'No multi-angle shots']

  return (
    <div>
      <div style={{ display: 'flex', align: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 140, height: 140,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          background: `conic-gradient(${getGaugeColor(score)} ${score}%, rgba(255,255,255,0.08) 0)`,
          boxShadow: `0 0 30px ${getGaugeColor(score)}44`,
        }}>
          <div style={{ background: 'var(--bg-secondary)', width: 100, height: 100, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: getGaugeColor(score) }}>{score}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quality Score</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.7 }}
                  style={{ height: '100%', borderRadius: 4, background: m.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Issues Detected</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {imageIssues.map((issue, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <ImageIcon size={14} color="#EF4444" />
            <span style={{ color: 'var(--text-secondary)' }}>{issue}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: '#10B981' }}>Recommendation:</strong> Use a plain white background, ensure 3+ product angles, and increase image resolution to at least 1000×1000px. Expected return reduction: ~18%.
        </p>
      </div>
    </div>
  )
}

// Review Sentiment Tab
function ReviewSentimentTab({ order }) {
  const score = order.review_sentiment_score
  const positive = Math.round(score * 0.6)
  const negative = Math.round((100 - score) * 0.7)
  const neutral = 100 - positive - negative
  const data = [
    { name: 'Positive', value: positive, color: '#10B981' },
    { name: 'Negative', value: negative, color: '#EF4444' },
    { name: 'Neutral', value: neutral, color: '#6B7280' },
  ]
  const complaints = ['Wrong size received', 'Not as described', 'Poor packaging', 'Missing accessories', 'Color mismatch']
  const negPhrases = [
    '"The product looks nothing like the picture"',
    '"Size chart is completely wrong"',
    '"Would not recommend to anyone"',
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Donut chart */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Sentiment Distribution</h4>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" animationDuration={1200} stroke="none">
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,8,32,0.95)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v, n) => [`${v}%`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {data.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{d.name}: </span>
                <span style={{ color: d.color, fontWeight: 700 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complaint words */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Common Complaints</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {complaints.map((c, i) => (
              <span key={i} style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: `rgba(239,68,68,${0.1 + i * 0.03})`,
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#FCA5A5',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Top Negative Phrases</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {negPhrases.map((phrase, i) => (
          <div key={i} style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            fontSize: 13,
            color: '#FCA5A5',
            fontStyle: 'italic',
          }}>
            {phrase}
          </div>
        ))}
      </div>
    </div>
  )
}

// AI Suggestions Tab
function AISuggestionsTab({ order }) {
  const suggestions = [
    {
      priority: 'P1',
      priorityColor: '#EF4444',
      title: 'Add Detailed Size Chart',
      reason: 'Size mismatch is the #1 return reason for this category. 67% of returns cite sizing issues.',
      reduction: 28,
      effort: 'Low',
    },
    {
      priority: 'P2',
      priorityColor: '#F97316',
      title: 'Replace Main Product Image',
      reason: 'Current image has background clutter and low contrast. Clean white-background image reduces returns by improving buyer confidence.',
      reduction: 18,
      effort: 'Medium',
    },
    {
      priority: 'P2',
      priorityColor: '#F97316',
      title: 'Rewrite Product Description',
      reason: 'Generic description lacks specifics. AI has generated an enhanced version ready to apply.',
      reduction: 15,
      effort: 'Low',
    },
    {
      priority: 'P3',
      priorityColor: '#F59E0B',
      title: 'Add Customer Q&A Section',
      reason: 'Orders with answered questions have 23% lower return rates.',
      reduction: 10,
      effort: 'Medium',
    },
    {
      priority: 'P3',
      priorityColor: '#F59E0B',
      title: 'Offer Free Return Window',
      reason: 'Paradoxically, offering a clear return policy reduces impulse returns by building trust.',
      reduction: 8,
      effort: 'High',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {suggestions.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: `${s.priorityColor}22`,
            border: `1px solid ${s.priorityColor}44`,
            color: s.priorityColor,
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0,
            letterSpacing: '0.05em',
          }}>
            {s.priority}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</h4>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#10B981',
                background: 'rgba(16,185,129,0.12)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(16,185,129,0.3)',
                flexShrink: 0,
              }}>
                -{s.reduction}% returns
              </span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.reason}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Effort: <strong style={{ color: 'var(--text-secondary)' }}>{s.effort}</strong></span>
              <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: 12 }}>
                Apply Fix
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Risk Factors
const mockRiskFactors = [
  { icon: FileText, label: 'Description mismatch with reviews', severity: 'high' },
  { icon: ImageIcon, label: 'Low image quality score', severity: 'medium' },
  { icon: Star, label: 'Negative review sentiment spike', severity: 'high' },
  { icon: AlertTriangle, label: 'Category historically high-risk', severity: 'medium' },
]

export default function OrderAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getOrderById } = useDashboardStore()
  const [activeTab, setActiveTab] = useState(0)

  const order = getOrderById(id) || {
    order_id: id,
    product_name: 'Samsung 65" 4K QLED TV',
    category: 'Electronics',
    price: 89999,
    risk_score: 82,
    risk_level: 'Critical',
    reason: 'Description mismatch',
    customer_name: 'Rahul Sharma',
    order_date: new Date().toISOString().split('T')[0],
    image_url: 'https://picsum.photos/seed/101/400/400',
    description_quality_score: 34,
    review_sentiment_score: 41,
    status: 'Shipped',
  }

  const tabComponents = [
    <DescriptionTab order={order} />,
    <ImageQualityTab order={order} />,
    <ReviewSentimentTab order={order} />,
    <AISuggestionsTab order={order} />,
  ]

  return (
    <AppLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Orders</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 14, color: 'var(--accent-primary)', fontWeight: 600 }}>{order.order_id}</span>
        </div>

        {/* Top section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}
          className="order-top-grid">
          <style>{`
            @media (max-width: 900px) { .order-top-grid { grid-template-columns: 1fr 1fr !important; } }
            @media (max-width: 600px) { .order-top-grid { grid-template-columns: 1fr !important; } }
          `}</style>

          {/* Product overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: 20 }}
          >
            <img
              src={order.image_url}
              alt={order.product_name}
              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }}
            />
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {order.product_name}
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge ${getRiskBadgeClass(order.risk_level)}`}>{order.risk_level}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.category}</span>
            </div>
            {[
              { label: 'Price', value: formatCurrency(order.price) },
              { label: 'Order Date', value: formatDate(order.order_date) },
              { label: 'Customer', value: order.customer_name },
              { label: 'Status', value: order.status },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </motion.div>

          {/* Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Return Probability
            </h3>
            <ReturnGauge value={order.risk_score} />
            <div style={{
              marginTop: 20,
              padding: '10px 16px',
              borderRadius: 10,
              background: `${getRiskColor(order.risk_level)}18`,
              border: `1px solid ${getRiskColor(order.risk_level)}44`,
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong style={{ color: getRiskColor(order.risk_level) }}>High risk</strong> — recommend immediate action to reduce return probability
              </p>
            </div>
          </motion.div>

          {/* Risk factors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={{ padding: 20 }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>
              Risk Factors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mockRiskFactors.map(({ icon: Icon, label, severity }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  }}
                >
                  <Icon size={16} color={severity === 'high' ? '#EF4444' : '#F59E0B'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Risk Score</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: getRiskColor(order.risk_level) }}>{order.risk_score}/100</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${order.risk_score}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ height: '100%', borderRadius: 4, background: getRiskColor(order.risk_level) }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{ padding: 24 }}
        >
          {/* Tab headers */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 0 }}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '10px 20px',
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tabComponents[activeTab]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  )
}
