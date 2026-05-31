import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Zap, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../../store/dashboardStore'
import { formatCurrency, formatDate, getRiskBadgeClass, getRiskColor, truncate } from '../../utils/helpers'

const ITEMS_PER_PAGE = 10

export default function RiskTable({ maxRows }) {
  const { getFilteredOrders } = useDashboardStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortKey, setSortKey] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [slideOver, setSlideOver] = useState(null)

  const allOrders = getFilteredOrders({ search, risk_level: riskFilter, category: categoryFilter })

  const sorted = useMemo(() => {
    return [...allOrders].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [allOrders, sortKey, sortDir])

  const displayed = maxRows ? sorted.slice(0, maxRows) : sorted
  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE)
  const paginated = displayed.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronDown size={14} style={{ opacity: 0.3 }} />
    return sortDir === 'asc' ? <ChevronUp size={14} color="var(--accent-primary)" /> : <ChevronDown size={14} color="var(--accent-primary)" />
  }

  const categories = [...new Set(getFilteredOrders({}).map(o => o.category))]

  return (
    <>
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          flexWrap: 'wrap',
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
            Orders Risk Table
          </h3>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search orders..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 32, height: 36, fontSize: 13, width: 200 }}
            />
          </div>
          {/* Risk filter */}
          <select
            className="input"
            value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
            style={{ height: 36, fontSize: 13, paddingLeft: 10, paddingRight: 10 }}
          >
            <option value="">All Risk Levels</option>
            {['Critical', 'High', 'Medium', 'Low'].map(r => <option key={r}>{r}</option>)}
          </select>
          {/* Category filter */}
          <select
            className="input"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            style={{ height: 36, fontSize: 13, paddingLeft: 10, paddingRight: 10 }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {displayed.length} orders
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {[
                  { key: null, label: '#', width: 48 },
                  { key: 'product_name', label: 'Product', width: 220 },
                  { key: 'order_id', label: 'Order ID', width: 120 },
                  { key: 'category', label: 'Category', width: 120 },
                  { key: 'price', label: 'Price', width: 100 },
                  { key: 'risk_score', label: 'Risk Score', width: 140 },
                  { key: 'risk_level', label: 'Level', width: 100 },
                  { key: 'order_date', label: 'Date', width: 110 },
                  { key: null, label: 'Action', width: 100 },
                ].map((col) => (
                  <th
                    key={col.label}
                    onClick={() => col.key && toggleSort(col.key)}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: col.key ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      minWidth: col.width,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {paginated.map((order, idx) => (
                  <motion.tr
                    key={order.order_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                    }}
                    whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={order.image_url}
                          alt=""
                          style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {truncate(order.product_name, 30)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-primary)' }}>
                        {order.order_id}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {order.category}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(order.price)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', minWidth: 60 }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${order.risk_score}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.04 }}
                            style={{
                              height: '100%',
                              borderRadius: 3,
                              background: order.risk_score > 75 ? '#EF4444'
                                : order.risk_score > 50 ? '#F97316'
                                : order.risk_score > 25 ? '#F59E0B'
                                : '#10B981',
                              boxShadow: `0 0 6px ${getRiskColor(order.risk_level)}88`,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: getRiskColor(order.risk_level), minWidth: 28 }}>
                          {order.risk_score}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${getRiskBadgeClass(order.risk_level)}`}>
                        {order.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(order.order_date)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSlideOver(order)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: 'rgba(139,92,246,0.15)',
                            border: '1px solid rgba(139,92,246,0.4)',
                            color: 'var(--accent-primary)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Zap size={12} />
                          Fix
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => navigate(`/orders/${order.order_id}`)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <ExternalLink size={12} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!maxRows && totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid var(--glass-border)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page} of {totalPages} ({displayed.length} orders)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: p === page ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: p === page ? 'rgba(139,92,246,0.2)' : 'transparent',
                      color: p === page ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: p === page ? 700 : 400,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Panel */}
      <AnimatePresence>
        {slideOver && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSlideOver(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 200,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              style={{
                position: 'fixed', right: 0, top: 0, bottom: 0,
                width: 420,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRight: 'none',
                padding: 28,
                zIndex: 201,
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>
                  Order Details
                </h3>
                <button onClick={() => setSlideOver(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <img src={slideOver.image_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {slideOver.product_name}
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                  {slideOver.category} • {slideOver.order_id}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className={`badge ${getRiskBadgeClass(slideOver.risk_level)}`}>{slideOver.risk_level} Risk</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(slideOver.price)}</span>
                </div>
              </div>

              {/* Risk score visual */}
              <div style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Risk Score</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: getRiskColor(slideOver.risk_level) }}>
                    {slideOver.risk_score}/100
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${slideOver.risk_score}%`,
                    height: '100%',
                    borderRadius: 4,
                    background: getRiskColor(slideOver.risk_level),
                  }} />
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong>Primary reason:</strong> {slideOver.reason}
                </p>
              </div>

              {/* Details grid */}
              {[
                { label: 'Customer', value: slideOver.customer_name },
                { label: 'Order Date', value: formatDate(slideOver.order_date) },
                { label: 'Status', value: slideOver.status },
                { label: 'Desc. Quality', value: `${slideOver.description_quality_score}/100` },
                { label: 'Review Sentiment', value: `${slideOver.review_sentiment_score}/100` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => navigate(`/orders/${slideOver.order_id}`)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Full Analysis
                </button>
                <button onClick={() => setSlideOver(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
