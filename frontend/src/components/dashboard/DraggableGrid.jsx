import { useState, useCallback, useEffect } from 'react'
import { GripHorizontal, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import KPICards from '../dashboard/KPICards'
import ReturnTrendChart from '../charts/ReturnTrendChart'
import CategoryHeatmap from '../charts/CategoryHeatmap'
import RiskTable from '../dashboard/RiskTable'
import AnomalyBanner from '../dashboard/AnomalyBanner'

// react-grid-layout is imported dynamically to handle the ESM export difference
// We'll use a simple CSS grid fallback with drag-to-reorder via mouse events

const STORAGE_KEY = 'zeroreturns-grid-order'

const ALL_WIDGETS = [
  {
    id: 'anomaly',
    title: 'Anomaly Alert',
    Component: AnomalyBanner,
    defaultSpan: 12,
    minHeight: 80,
  },
  {
    id: 'kpis',
    title: 'KPI Overview',
    Component: KPICards,
    defaultSpan: 12,
    minHeight: 140,
  },
  {
    id: 'trend',
    title: 'Return Trend (30 Days)',
    Component: ReturnTrendChart,
    defaultSpan: 8,
    minHeight: 320,
  },
  {
    id: 'heatmap',
    title: 'Category Risk Heatmap',
    Component: CategoryHeatmap,
    defaultSpan: 4,
    minHeight: 320,
  },
  {
    id: 'table',
    title: 'Orders Risk Table',
    Component: RiskTable,
    defaultSpan: 12,
    minHeight: 400,
  },
]

function loadOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const ids = JSON.parse(saved)
      // Reorder ALL_WIDGETS based on saved order
      const map = Object.fromEntries(ALL_WIDGETS.map(w => [w.id, w]))
      return ids.map(id => map[id]).filter(Boolean)
    }
  } catch {}
  return ALL_WIDGETS
}

function saveOrder(widgets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets.map(w => w.id)))
  } catch {}
}

// Drag handle widget card
function GridCard({ widget, onDragStart, onDragOver, onDrop, isDragOver }) {
  const { Component, title, minHeight } = widget

  return (
    <motion.div
      layout
      className="glass-card"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight,
        gridColumn: `span ${widget.defaultSpan}`,
        border: isDragOver ? '2px dashed var(--accent-primary)' : undefined,
        background: isDragOver ? 'color-mix(in srgb, var(--accent-primary) 8%, var(--glass-bg))' : undefined,
        transition: 'border 0.2s, background 0.2s',
        cursor: 'grab',
      }}
      transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
    >
      {/* Drag handle header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <GripHorizontal size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          opacity: 0.4,
        }}>
          drag to rearrange
        </span>
      </div>

      {/* Widget content */}
      <div style={{ flex: 1, padding: 14, overflow: 'auto', minHeight: 0 }}>
        <Component />
      </div>
    </motion.div>
  )
}

export default function DraggableGrid() {
  const [widgets, setWidgets] = useState(loadOrder)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleReset = useCallback(() => {
    setWidgets(ALL_WIDGETS)
    saveOrder(ALL_WIDGETS)
  }, [])

  const handleDragStart = (id) => {
    setDraggingId(id)
  }

  const handleDragOver = (e, id) => {
    e.preventDefault()
    if (id !== draggingId) setDragOverId(id)
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    setWidgets(prev => {
      const next = [...prev]
      const fromIdx = next.findIndex(w => w.id === draggingId)
      const toIdx = next.findIndex(w => w.id === targetId)
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      saveOrder(next)
      return next
    })

    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6, margin: 0 }}>
          Drag widget cards to rearrange. Layout is saved automatically.
        </p>
        <button
          onClick={handleReset}
          className="btn btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px' }}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 16,
        }}
        onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
      >
        {widgets.map(widget => (
          <GridCard
            key={widget.id}
            widget={widget}
            isDragOver={dragOverId === widget.id}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDrop={(e) => handleDrop(e, widget.id)}
          />
        ))}
      </div>
    </div>
  )
}
