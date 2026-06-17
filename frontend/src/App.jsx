import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './store/themeStore'
import CursorTrail from './components/features/CursorTrail'
import OnboardingTour from './components/features/OnboardingTour'
import { useWebSocket } from './hooks/useWebSocket'
import './i18n'

// Lazy load pages for performance
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const OrderAnalysis = lazy(() => import('./pages/OrderAnalysis'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Upload = lazy(() => import('./pages/Upload'))
const Settings = lazy(() => import('./pages/Settings'))
const Recruiter = lazy(() => import('./pages/Recruiter'))

// Mesh background component
function MeshBackground() {
  return (
    <div className="mesh-bg" aria-hidden="true">
      <div className="mesh-orb mesh-orb-1" />
      <div className="mesh-orb mesh-orb-2" />
      <div className="mesh-orb mesh-orb-3" />
    </div>
  )
}

// Page loader
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading ZeroReturn...</p>
      </div>
    </div>
  )
}

// Auth guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('zeroreturns-token')
  // For demo: allow access without token by setting a demo token
  if (!token) {
    localStorage.setItem('zeroreturns-token', 'demo-token-2024')
  }
  return children
}

// Lazy Chatbot (to avoid loading on landing/auth pages)
const Chatbot = lazy(() => import('./components/features/Chatbot'))

// Inner app with hooks that need Router context
function AppInner() {
  const { initTheme } = useThemeStore()

  // Initialize theme on mount
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Connect WebSocket for live updates (silently fails if backend offline)
  useWebSocket()

  return (
    <>
      <MeshBackground />
      <CursorTrail />
      <OnboardingTour />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><OrderAnalysis /></ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute><OrderAnalysis /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Analytics /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute><Upload /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
          <Route path="/recruiter" element={
            <ProtectedRoute><Recruiter /></ProtectedRoute>
          } />
          <Route path="/enterprise" element={
            <ProtectedRoute><Enterprise /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Floating Chatbot (on all pages except landing/auth) */}
      <Suspense fallback={null}>
        <BotGate />
      </Suspense>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast',
          duration: 4000,
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            fontFamily: "'DM Sans', sans-serif",
          },
        }}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}

// Only show chatbot on authenticated pages
function BotGate() {
  const path = window.location.pathname
  const hidePaths = ['/', '/login', '/signup']
  if (hidePaths.includes(path)) return null
  return <Chatbot />
}

export default App
