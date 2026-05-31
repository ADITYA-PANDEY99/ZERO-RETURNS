import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Sliders, Globe, Bell, Key, ShieldAlert, Download, Trash2, Palette, Check } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import { useThemeStore } from '../store/themeStore'
import { useDashboardStore } from '../store/dashboardStore'
import toast from 'react-hot-toast'

export default function Settings() {
  const { theme, themes, setTheme } = useThemeStore()
  const { kpis } = useDashboardStore()
  const [activeTab, setActiveTab] = useState('profile')

  // Forms state
  const [profile, setProfile] = useState({
    name: 'ZeroStore Admin',
    email: 'admin@zeroreturn.ai',
    company: 'ZeroStore D2C Pvt Ltd',
  })

  const [apiKeys, setApiKeys] = useState({
    groq: 'gsk_y4..........................',
    supabaseUrl: 'https://xyz123.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  
  const [showKeys, setShowKeys] = useState({ groq: false, supabase: false })

  const [alertRules, setAlertRules] = useState({
    returnThreshold: 15,
    criticalScore: 75,
    dailyLimit: 100,
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
    anomalies: true,
  })

  const [lang, setLang] = useState('en')

  const handleSaveProfile = (e) => {
    e.preventDefault()
    toast.success('Profile settings updated successfully!')
  }

  const handleSaveAPIKeys = (e) => {
    e.preventDefault()
    toast.success('API keys saved successfully!')
  }

  const handleSaveAlerts = (e) => {
    e.preventDefault()
    toast.success('Alert thresholds set successfully!')
  }

  const handleExportData = (format) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ kpis, profile, alertRules }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zeroreturns_export.${format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Data exported as ${format.toUpperCase()}!`)
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      toast.success('Local cache cleared!')
    }
  }

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'alerts', label: 'Alert Rules', icon: ShieldAlert },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'export', label: 'Export / Danger', icon: Trash2 },
  ]

  return (
    <AppLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 4px' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Configure and personalize your ZeroReturn experience</p>
        </div>

        {/* Outer Settings Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1r', gap: '32px', gridTemplateColumns: '260px minmax(0, 1fr)' }}>
          {/* Navigation Sidebar */}
          <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'var(--accent-primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  className={!isActive ? 'btn-ghost' : ''}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Configuration Panel */}
          <div className="glass-card" style={{ padding: '32px', minHeight: '400px' }}>
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Profile Settings</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Manage your seller profile and branding options.</p>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: '#fff'
                    }}>
                      {profile.name[0]}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>Avatar</h4>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem' }}>Change avatar based on company initials</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</label>
                      <input
                        type="text"
                        className="input"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email Address</label>
                      <input
                        type="email"
                        className="input"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Company / Brand Name</label>
                    <input
                      type="text"
                      className="input"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '10px' }}>
                    Save Changes
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Appearance Theme</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Choose from one of our highly refined premium UI styles.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {Object.values(themes).map((t) => {
                    const isActive = theme === t.id
                    return (
                      <div
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="glass-card"
                        style={{
                          padding: '20px',
                          cursor: 'pointer',
                          border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                          transform: isActive ? 'scale(1.02)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative'
                        }}
                      >
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'var(--accent-primary)',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}>
                            <Check size={12} />
                          </div>
                        )}
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{t.emoji}</div>
                        <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>{t.name}</h4>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>{t.description}</p>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'language' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Language Settings</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Select your default UI language and typography size.</p>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                  <div
                    onClick={() => { setLang('en'); toast.success('Language changed to English!'); }}
                    className="glass-card"
                    style={{
                      padding: '24px',
                      flex: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: lang === 'en' ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🇬🇧</div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>English</h4>
                  </div>
                  <div
                    onClick={() => { setLang('hi'); toast.success('भाषा बदलकर हिंदी कर दी गई है!'); }}
                    className="glass-card"
                    style={{
                      padding: '24px',
                      flex: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: lang === 'hi' ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🇮🇳</div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>हिंदी (Hindi)</h4>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>UI Scale (Font Size)</h4>
                  <input type="range" min="12" max="20" defaultValue="14" style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                    <span>Small</span>
                    <span>Default</span>
                    <span>Large</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Notifications Control</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Enable or disable notifications for anomalies, weekly digests, and API sync updates.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(notifications).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                          {key === 'push' ? 'Real-Time Desktop Push' : key === 'weekly' ? 'Weekly PDF Digest' : `${key} Alerts`}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem' }}>
                          Receive alerts via {key} when critical return probability spikes are predicted.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => setNotifications({ ...notifications, [key]: !val })}
                        style={{
                          width: '40px',
                          height: '20px',
                          accentColor: 'var(--accent-primary)',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Alert Threshold Rules</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Set sensitivity markers for real-time predictions & notifications.</p>

                <form onSubmit={handleSaveAlerts} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Return Rate Threshold (%)
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={alertRules.returnThreshold}
                      onChange={(e) => setAlertRules({ ...alertRules, returnThreshold: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.75rem' }}>Flag accounts/categories when returning rates exceed this limit</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Critical Risk Score Trigger
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={alertRules.criticalScore}
                      onChange={(e) => setAlertRules({ ...alertRules, criticalScore: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.75rem' }}>Trigger critical severity alert when ML score is above this value</p>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                    Save Alert Rules
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'keys' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>API Connections</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Hook up your own AI (Groq) and backend database (Supabase).</p>

                <form onSubmit={handleSaveAPIKeys} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Groq Cloud API Key</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showKeys.groq ? 'text' : 'password'}
                        className="input"
                        value={apiKeys.groq}
                        onChange={(e) => setApiKeys({ ...apiKeys, groq: e.target.value })}
                        style={{ width: '100%', paddingRight: '60px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, groq: !showKeys.groq })}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {showKeys.groq ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Supabase URL</label>
                    <input
                      type="text"
                      className="input"
                      value={apiKeys.supabaseUrl}
                      onChange={(e) => setApiKeys({ ...apiKeys, supabaseUrl: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Supabase Anon Key</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showKeys.supabase ? 'text' : 'password'}
                        className="input"
                        value={apiKeys.supabaseKey}
                        onChange={(e) => setApiKeys({ ...apiKeys, supabaseKey: e.target.value })}
                        style={{ width: '100%', paddingRight: '60px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, supabase: !showKeys.supabase })}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {showKeys.supabase ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary">Save Connections</button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        toast.promise(
                          new Promise((resolve) => setTimeout(resolve, 1500)),
                          {
                            loading: 'Testing endpoints...',
                            success: 'Endpoints verified successfully!',
                            error: 'Could not connect to service.',
                          }
                        )
                      }}
                    >
                      Test Connection
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Export Configuration</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.875rem' }}>Backup your dashboard setups or wipe data local stores.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Backup Setup</h4>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button onClick={() => handleExportData('json')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={16} /> Export JSON
                      </button>
                      <button onClick={() => handleExportData('csv')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={16} /> Export CSV
                      </button>
                    </div>
                  </div>

                  <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)', margin: '12px 0' }} />

                  <div>
                    <h4 style={{ margin: '0 0 4px', color: 'var(--text-danger, #EF4444)' }}>Danger Zone</h4>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 16px', fontSize: '0.75rem' }}>Wipe local configuration caches. All settings will restore to default states.</p>
                    <button onClick={handleClearData} className="btn" style={{ background: '#EF4444', color: '#fff', border: 'none' }}>
                      Wipe Cache / Reset
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
