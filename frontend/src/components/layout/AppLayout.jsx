import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import {
  LayoutDashboard, ShoppingBag, BarChart3, Upload, Settings
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const BOTTOM_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/upload', icon: Upload, label: 'Upload' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 99, display: 'none'
            }}
            className="mobile-backdrop"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main */}
      <div style={{
        marginLeft: sidebarCollapsed ? 72 : 260,
        flex: 1,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Navbar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main style={{ flex: 1, padding: '24px', paddingBottom: '80px' }}>
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
