import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, User, ShieldAlert, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Signup failed. Please try again.')
        setLoading(false)
        return
      }

      // Store the REAL token returned by the API
      localStorage.setItem('zeroreturns-token', data.access_token)
      localStorage.setItem('zeroreturns-user', JSON.stringify(data.user || {}))
      toast.success(`Account created! Welcome, ${data.user?.full_name || name}!`)
      navigate('/dashboard')
    } catch (err) {
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
        <div className="mesh-orb mesh-orb-1" style={{ width: '45vw', height: '45vw', top: '-10%', right: '-10%' }} />
        <div className="mesh-orb mesh-orb-2" style={{ width: '40vw', height: '40vw', bottom: '-10%', left: '-10%' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '40px',
          position: 'relative',
          zIndex: 10,
          border: '1px solid var(--glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
          <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            ZeroReturn
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
            Predict returns before shipping, maximize D2C margins.
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

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
              Brand Administrator Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Rohan Sen"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="admin@mybrand.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Password
              </label>
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

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Confirm
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '40px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0' }}>
            <input type="checkbox" required style={{ marginTop: '3px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              I agree to the Terms of Service and Privacy Policy, enabling ML processing on order metadata.
            </span>
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
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }} />
            ) : (
              <span>Create Free Account</span>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
