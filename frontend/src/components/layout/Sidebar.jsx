import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, ShoppingBag, BarChart3, Upload,
  Settings, LogOut, ChevronLeft, ChevronRight, Zap, TrendingDown
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'orders', path: '/orders', icon: ShoppingBag, label: 'Orders' },
  { key: 'analytics', path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { key: 'upload', path: '/upload', icon: Upload, label: 'Upload Data' },
  { key: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('zeroreturns-token')
    navigate('/login')
  }

  return (
    <motion.div
      className="sidebar"
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
        minHeight: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
          }}>
            <TrendingDown size={20} color="white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="logo-text font-display"
              style={{ fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap' }}
            >
              <span className="gradient-text">Zero</span>Return
            </motion.span>
          )}
        </div>

        <button
          onClick={onToggle}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px', borderRadius: '8px', flexShrink: 0 }}
          id="sidebar-toggle-btn"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!collapsed && (
          <div style={{ padding: '4px 12px 8px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Main Menu
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={collapsed ? { justifyContent: 'center', padding: '10px 0' } : {}}
              title={collapsed ? item.label : ''}
              id={`nav-${item.key}`}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: '0.875rem', fontWeight: 500 }}
                >
                  {t(`nav.${item.key}`, item.label)}
                </motion.span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Live indicator */}
      {!collapsed && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px',
            background: 'color-mix(in srgb, var(--success) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
            borderRadius: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulseBadge 2s infinite' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>Live Monitoring Active</span>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ padding: '8px 8px 16px', borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: 'var(--danger)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 16px',
          }}
          id="logout-btn"
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Logout</span>}
        </button>
      </div>
    </motion.div>
  )
}
