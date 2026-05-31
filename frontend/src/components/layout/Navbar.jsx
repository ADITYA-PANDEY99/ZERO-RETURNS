import { useState } from 'react'
import { Bell, Search, User, Menu, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeSwitcher from '../features/ThemeSwitcher'
import LanguageSwitcher from '../features/LanguageSwitcher'
import { useDashboardStore } from '../../store/dashboardStore'

export default function Navbar({ onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { orders } = useDashboardStore()

  const searchResults = searchQuery.length > 1
    ? orders.filter(o =>
        o.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.order_id.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : []

  const notifications = [
    { id: 1, type: 'critical', message: 'ORD-10023 has Critical risk (92%)', time: '2m ago' },
    { id: 2, type: 'anomaly', message: 'Electronics return spike detected', time: '18m ago' },
    { id: 3, type: 'success', message: '47 returns prevented today', time: '1h ago' },
    { id: 4, type: 'info', message: 'New CSV analysis complete', time: '3h ago' },
  ]

  return (
    <div className="navbar">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="btn btn-ghost btn-sm" style={{ display: 'none' }} id="mobile-menu-btn">
        <Menu size={20} />
      </button>

      {/* Logo (mobile) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrendingDown size={18} color="white" />
        </div>
        <span className="font-display gradient-text" style={{ fontWeight: 800, fontSize: '1rem' }}>ZeroReturn</span>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, margin: '0 16px', position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search orders, products..."
            className="input"
            style={{ paddingLeft: 36, fontSize: '0.85rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            id="global-search"
          />
        </div>

        <AnimatePresence>
          {searchOpen && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0, right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: 'var(--card-shadow)',
                zIndex: 100,
              }}
            >
              {searchResults.map(order => (
                <div key={order.order_id} style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={order.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{order.product_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.order_id} · Risk: {order.risk_level}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
        <LanguageSwitcher />
        <ThemeSwitcher />

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm tooltip-container"
            style={{ position: 'relative', padding: '8px 10px' }}
            onClick={() => setNotifOpen(!notifOpen)}
            id="notifications-btn"
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--danger)', border: '2px solid var(--bg-primary)',
            }} />
            <span className="tooltip">Notifications</span>
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 999,
                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                    borderRadius: 14, padding: 8, width: 320, boxShadow: 'var(--card-shadow)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{ padding: '4px 12px 10px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Notifications
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                      borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                        background: n.type === 'critical' ? 'var(--danger)' :
                          n.type === 'anomaly' ? 'var(--warning)' :
                          n.type === 'success' ? 'var(--success)' : 'var(--info)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{n.message}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm tooltip-container"
            style={{ padding: '4px', borderRadius: '50%' }}
            onClick={() => setProfileOpen(!profileOpen)}
            id="profile-btn"
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: 'white',
            }}>
              R
            </div>
            <span className="tooltip">Profile</span>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 999,
                    background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                    borderRadius: 14, padding: 12, width: 200, boxShadow: 'var(--card-shadow)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{ padding: '4px 8px 12px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Rahul Sharma</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>rahul@example.com</div>
                  </div>
                  {['My Profile', 'API Keys', 'Billing', 'Sign Out'].map((item) => (
                    <button key={item} style={{
                      display: 'block', width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: 'none', background: 'transparent', textAlign: 'left',
                      color: item === 'Sign Out' ? 'var(--danger)' : 'var(--text-secondary)',
                      fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s', marginTop: 4,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
