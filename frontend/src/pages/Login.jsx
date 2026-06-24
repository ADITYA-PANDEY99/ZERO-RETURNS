import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, ChevronRight, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        // API returned a 4xx/5xx — show the error detail from the response
        setError(data.detail || 'Login failed. Please check your credentials.')
        setLoading(false)
        return
      }

      // Store the REAL token returned by the API (not a hardcoded string)
      localStorage.setItem('zeroreturns-token', data.access_token)
      localStorage.setItem('zeroreturns-user', JSON.stringify(data.user || {}))
      toast.success(`Welcome back, ${data.user?.full_name || 'User'}!`)
      navigate('/dashboard')
    } catch (err) {
      // Network error (backend not running, etc.)
      setError('Cannot connect to server. Is the backend running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      {/* Decorative Orbs */}
      <div className="mesh-bg" aria-hidden="true" style={{ opacity: 0.8 }}>
        <div className="mesh-orb mesh-orb-1" style={{ width: '40vw', height: '40vw', top: '-10%', left: '-10%' }} />
        <div className="mesh-orb mesh-orb-2" style={{ width: '50vw', height: '50vw', bottom: '-20%', right: '-10%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '40px',
          position: 'relative',
          zIndex: 10,
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: '#fff',
            marginBottom: '16px'
          }}>
            <BarChart2 size={24} />
          </div>
          <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            ZeroReturn
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
            AI-Powered Return Prevention Platform
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            color: '#EF4444',
            fontSize: '0.875rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="admin@zeroreturns.ai"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Password
              </label>
              <a href="#" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                Forgot Password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }} />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          <span style={{ padding: '0 12px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        </div>

        {/* OAuth Buttons */}
        <button
          onClick={() => {
            toast.loading('Initializing Recruiter Guest Demo Tour...', { duration: 1000 })
            fetch(`${API_BASE}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'demo@zeroreturns.ai', password: 'demo1234' }),
            })
              .then(r => r.json())
              .then(data => {
                localStorage.setItem('zeroreturns-token', data.access_token)
                localStorage.setItem('zeroreturns-user', JSON.stringify(data.user || {}))
                navigate('/dashboard')
              })
              .catch(() => {
                toast.error('Backend not reachable')
              })
          }}
          className="btn btn-secondary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.875rem'
          }}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>Recruiter Guest Demo Tour (One-Click)</span>
        </button>

        {/* Demo credentials hint */}
        <p style={{ textAlign: 'center', marginTop: '8px', marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Demo: <code style={{ color: 'var(--accent-primary)' }}>demo@zeroreturns.ai</code> / <code style={{ color: 'var(--accent-primary)' }}>demo1234</code>
        </p>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '32px', marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
