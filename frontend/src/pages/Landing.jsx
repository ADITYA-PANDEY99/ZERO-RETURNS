import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, ArrowRight, ChevronDown, Zap, Search, BarChart3, Image, AlertTriangle, MessageSquare, Star, Users, Package, DollarSign } from 'lucide-react'
import { animateCounter, formatCurrency } from '../utils/helpers'

const FEATURES = [
  { icon: '🤖', title: 'AI Return Predictor', desc: '94% accuracy. Know which orders will be returned before they ship.', color: '#8B5CF6' },
  { icon: '🔍', title: 'Description Analyzer', desc: 'NLP detects listing-review mismatches that cause returns.', color: '#06B6D4' },
  { icon: '🖼️', title: 'Image Quality AI', desc: 'Computer vision scores product images for return risk.', color: '#F472B6' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Real-time dashboards with AI insights in English & Hindi.', color: '#10B981' },
  { icon: '🚨', title: 'Anomaly Detection', desc: 'Auto-detect unusual return spikes before they escalate.', color: '#F59E0B' },
  { icon: '💬', title: 'AI Chatbot', desc: 'Ask questions about your data in natural language.', color: '#EF4444' },
]

const STATS = [
  { label: 'Orders Analyzed', value: 1000000, suffix: 'M+', display: '1M+' },
  { label: 'Sellers Using ZeroReturn', value: 5000, suffix: '+', display: '5K+' },
  { label: 'Revenue Saved', value: 500, suffix: 'Cr+', display: '₹500Cr+' },
  { label: 'Prediction Accuracy', value: 94, suffix: '%', display: '94%' },
]

function StatCard({ stat, isVisible }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (isVisible) animateCounter(0, stat.value, 2000, setCount)
  }, [isVisible, stat.value])

  return (
    <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
      <div className="gradient-text font-display" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
        {stat.suffix === '%' ? `${count}%` :
         stat.suffix === 'M+' ? `${(count / 1000000).toFixed(1)}M+` :
         stat.suffix === 'Cr+' ? `₹${Math.floor(count / 100)}Cr+` :
         `${count.toLocaleString('en-IN')}+`}
      </div>
      <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.95rem', fontWeight: 500 }}>{stat.label}</div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [savedCounter, setSavedCounter] = useState(23418000)

  useEffect(() => {
    // Animate live counter
    const interval = setInterval(() => {
      setSavedCounter(prev => prev + Math.floor(Math.random() * 500 + 100))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Mesh background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="logo-text font-display" style={{ fontWeight: 800, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
          }}>
            <TrendingDown size={20} color="white" />
          </div>
          <span><span className="gradient-text">Zero</span>Return</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/dashboard" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px',
        position: 'relative',
      }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 24,
            fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600,
          }}
        >
          <Zap size={14} />
          Now live — AI-powered operational intelligence platform
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="logo-text font-display"
          style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, lineHeight: 0.95, marginBottom: 12, letterSpacing: '-0.02em' }}
        >
          <span className="gradient-text">Zero</span>
          <span style={{ color: 'var(--text-primary)' }}>Return AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: 'var(--text-secondary)', maxWidth: 700, marginBottom: 32, lineHeight: 1.4, fontWeight: 700 }}
        >
          AI-Powered Operational Intelligence & Decisional Analytics Platform
        </motion.p>

        {/* Supported Roles Showcase */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginBottom: 20 }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>SUPPORTED CANDIDATE ROLES</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 650 }}>
            {['Data Analyst', 'Business Analyst', 'Product Analyst', 'Data Scientist', 'AI/ML Engineer'].map(role => (
              <span key={role} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#FFF' }}>{role}</span>
            ))}
          </div>
        </motion.div>

        {/* Supported Industries Showcase */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          style={{ marginBottom: 36 }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>SUPPORTED INDUSTRIES</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 650 }}>
            {['Ecommerce', 'Food Delivery', 'Grocery Delivery', 'Banking & Cards', 'B2B SaaS'].map(ind => (
              <span key={ind} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', color: 'var(--accent-primary)', fontWeight: 600 }}>{ind}</span>
            ))}
          </div>
        </motion.div>

        {/* Live counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 40,
            background: 'color-mix(in srgb, var(--success) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
            borderRadius: 12, padding: '10px 20px',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulseBadge 2s infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--success)', fontWeight: 700, fontSize: '1rem' }}>
            ₹{savedCounter.toLocaleString('en-IN')} saved today
          </span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary btn-lg"
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--accent-glow)'
            }}
          >
            Explore Platform
          </button>
          
          <button
            onClick={() => {
              localStorage.setItem('zeroreturns-start-tour-on-dashboard', 'true')
              navigate('/dashboard')
            }}
            className="btn btn-secondary btn-lg"
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)'
            }}
          >
            Take Guided Tour
          </button>

          <button
            onClick={() => navigate('/recruiter')}
            className="btn btn-secondary btn-lg"
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              color: 'var(--accent-secondary)'
            }}
          >
            View Recruiter Mode
          </button>
        </motion.div>

        {/* Scroll arrow */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', animation: 'float 2s ease-in-out infinite' }}
        >
          <ChevronDown size={28} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
            Everything You Need to <span className="gradient-text">Stop Returns</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', fontSize: '1.05rem' }}>
            A complete AI platform built for Indian e-commerce sellers who want to stop losing money to returns.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{ padding: '28px', cursor: 'default', position: 'relative', overflow: 'hidden' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                borderRadius: '50%', background: `radial-gradient(circle, ${f.color}20, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              <div style={{ marginTop: 16, height: 3, width: 40, borderRadius: 999, background: f.color, opacity: 0.6 }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section style={{ padding: '80px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <motion.h2
          className="font-display"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 60 }}
        >
          How It <span className="gradient-text">Works</span>
        </motion.h2>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { num: '01', title: 'Connect Your Data', desc: 'Upload CSV/Excel or connect your store via API. Supports all major Indian marketplaces.', icon: '📤' },
            { num: '02', title: 'AI Analyzes Patterns', desc: '5 AI models scan listings, images, and reviews to find return risk patterns.', icon: '🧠' },
            { num: '03', title: 'Fix & Save Revenue', desc: 'Get priority-ranked action items. Apply fixes with one click. Watch returns drop.', icon: '💰' },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              style={{ flex: 1, minWidth: 260, maxWidth: 300, textAlign: 'center', padding: '0 20px', position: 'relative' }}
            >
              {i < 2 && (
                <div style={{
                  position: 'absolute', top: 40, right: -30, width: 60,
                  borderTop: '2px dashed var(--glass-border)',
                  zIndex: 1,
                }} />
              )}
              <div style={{
                width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', boxShadow: 'var(--accent-glow)',
                position: 'relative', zIndex: 2,
              }}>
                {step.icon}
              </div>
              <div className="font-mono" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>
                STEP {step.num}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}>{step.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────── */}
      <section ref={statsRef} style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.h2
          className="font-display"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 48 }}
        >
          Trusted by <span className="gradient-text">Thousands</span> of Sellers
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} isVisible={statsVisible} />
          ))}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '48px 40px',
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32,
      }}>
        <div>
          <div className="logo-text font-display" style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <TrendingDown size={20} style={{ color: 'var(--accent-primary)' }} />
            <span><span className="gradient-text">Zero</span>Return</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 280 }}>
            AI-powered return prediction & prevention for Indian e-commerce sellers.
          </p>
          <motion.div
            whileHover={{ scale: 1.05, y: -4, textShadow: '0 0 8px rgba(139,92,246,0.6)' }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{
              marginTop: 16,
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-block',
              background: 'linear-gradient(135deg, #FFF 0%, var(--accent-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 10px rgba(255,255,255,0.05)'
            }}
          >
            Planned, Designed & Built by Aditya Pandey
          </motion.div>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Platform</div>
            {[['Dashboard', '/dashboard'], ['Analytics', '/analytics'], ['Upload Data', '/upload'], ['Settings', '/settings']].map(([label, path]) => (
              <Link key={path} to={path} style={{ display: 'block', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 10, fontSize: '0.875rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account</div>
            {[['Login', '/login'], ['Sign Up', '/signup']].map(([label, path]) => (
              <Link key={path} to={path} style={{ display: 'block', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 10, fontSize: '0.875rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
