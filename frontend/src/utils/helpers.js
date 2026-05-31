// Format currency in Indian format
export const formatCurrency = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

export const formatCurrencyFull = (amount) =>
  `₹${amount.toLocaleString('en-IN')}`

// Format number with commas
export const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString('en-IN')
}

// Risk level helpers
export const getRiskColor = (level) => {
  const colors = {
    Low: 'var(--success)',
    Medium: 'var(--warning)',
    High: '#F97316',
    Critical: 'var(--danger)',
  }
  return colors[level] || colors.Low
}

export const getRiskBadgeClass = (level) => {
  const classes = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
    Critical: 'badge-critical',
  }
  return classes[level] || 'badge-low'
}

export const getRiskFromScore = (score) => {
  if (score > 75) return 'Critical'
  if (score > 50) return 'High'
  if (score > 25) return 'Medium'
  return 'Low'
}

// Gauge color based on value
export const getGaugeColor = (value) => {
  if (value > 75) return '#EF4444'
  if (value > 50) return '#F97316'
  if (value > 25) return '#F59E0B'
  return '#10B981'
}

// Date helpers
export const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export const getDaysAgo = (dateStr) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff} days ago`
}

// Truncate text
export const truncate = (str, n = 40) =>
  str && str.length > n ? str.slice(0, n) + '...' : str

// Generate mock sparkline data
export const generateSparkline = (length = 10, min = 0, max = 100) =>
  Array.from({ length }, () => Math.floor(Math.random() * (max - min) + min))

// Animate counter to value
export const animateCounter = (start, end, duration, setter) => {
  const startTime = performance.now()
  const update = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
    setter(Math.floor(start + (end - start) * eased))
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

// Debounce
export const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Generate random ID
export const genId = () => Math.random().toString(36).slice(2, 11)

// Chart theme colors
export const getChartColors = () => {
  const style = getComputedStyle(document.documentElement)
  return {
    chart1: style.getPropertyValue('--chart-1').trim() || '#8B5CF6',
    chart2: style.getPropertyValue('--chart-2').trim() || '#06B6D4',
    chart3: style.getPropertyValue('--chart-3').trim() || '#F472B6',
    chart4: style.getPropertyValue('--chart-4').trim() || '#10B981',
    chart5: style.getPropertyValue('--chart-5').trim() || '#F59E0B',
    accent: style.getPropertyValue('--accent-primary').trim() || '#8B5CF6',
    secondary: style.getPropertyValue('--accent-secondary').trim() || '#06B6D4',
    bg: style.getPropertyValue('--bg-tertiary').trim() || '#141428',
    border: style.getPropertyValue('--glass-border').trim() || 'rgba(255,255,255,0.1)',
    text: style.getPropertyValue('--text-secondary').trim() || '#94A3B8',
  }
}
