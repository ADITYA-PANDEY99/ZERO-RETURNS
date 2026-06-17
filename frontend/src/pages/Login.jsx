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
            // NOTE: Google OAuth requires Supabase configured in backend/.env
            // This simulates login with the demo account for local development
            toast.loading('Simulating demo login...', { duration: 1000 })
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
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fillRule="evenodd" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Demo Login (no Supabase needed)</span>
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
