import { create } from 'zustand'

// ─── Mock Data ────────────────────────────────────────────────
const generateOrders = () => {
  const categories = ['Electronics', 'Clothing', 'Footwear', 'Books', 'Home & Kitchen', 'Beauty', 'Toys', 'Sports']
  const reasons = [
    'Description mismatch', 'Poor image quality', 'Size issue',
    'Defective product', 'Late delivery', 'Wrong item shipped',
    'Color difference', 'Missing accessories'
  ]
  const products = [
    'Samsung 65" 4K QLED TV', 'Nike Air Max 270', 'Boat Rockerz 450 Headphones',
    "Men's Slim Fit Jeans", 'OnePlus Nord CE 3', 'Philips Air Fryer XL',
    'Lakme Foundation Kit', 'Adidas Running Shoes', 'Instant Pot Duo 7-in-1',
    'Apple AirPods Pro', 'Puma T-Shirt Pack', 'Fossil Gen 6 Smartwatch',
    'KitchenAid Stand Mixer', 'Levi\'s 511 Jeans', 'Noise ColorFit Pro 4',
    'Dyson V11 Vacuum', 'Saree - Kanjivaram Silk', 'Yoga Mat Premium',
    'Prestige Cooker 5L', 'Sony WH-1000XM5 Headphones'
  ]
  const customers = [
    'Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel',
    'Vikram Nair', 'Ananya Gupta', 'Rajesh Verma', 'Pooja Mehta',
    'Arjun Reddy', 'Kavya Iyer', 'Suresh Joshi', 'Meera Pillai'
  ]

  return Array.from({ length: 50 }, (_, i) => {
    const riskScore = Math.floor(Math.random() * 100)
    const riskLevel = riskScore > 75 ? 'Critical' : riskScore > 50 ? 'High' : riskScore > 25 ? 'Medium' : 'Low'
    const cat = categories[i % categories.length]
    const price = Math.floor(Math.random() * 50000) + 500
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    return {
      order_id: `ORD-${String(10001 + i).padStart(5, '0')}`,
      product_name: products[i % products.length],
      category: cat,
      price,
      risk_score: riskScore,
      risk_level: riskLevel,
      reason: reasons[i % reasons.length],
      customer_name: customers[i % customers.length],
      seller_name: 'ZeroStore Official',
      order_date: date.toISOString().split('T')[0],
      image_url: `https://picsum.photos/seed/${i + 100}/400/400`,
      description_quality_score: Math.floor(Math.random() * 100),
      review_sentiment_score: Math.floor(Math.random() * 100),
      status: ['Processing', 'Shipped', 'Delivered', 'Pending'][i % 4],
    }
  })
}

const generateTrends = () => {
  const data = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const orders = Math.floor(Math.random() * 200) + 300
    const returnRate = Math.random() * 0.25 + 0.10
    data.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      orders,
      returns: Math.floor(orders * returnRate),
      revenue: orders * (Math.floor(Math.random() * 3000) + 1500),
      prevented: Math.floor(Math.random() * 30) + 10,
    })
  }
  return data
}

const generateHeatmap = () => [
  { category: 'Electronics', risk_score: 82, orders: 2847, returns: 512, revenue_at_risk: 1240000 },
  { category: 'Clothing', risk_score: 74, orders: 3921, returns: 784, revenue_at_risk: 392000 },
  { category: 'Footwear', risk_score: 68, orders: 1834, returns: 329, revenue_at_risk: 264000 },
  { category: 'Home & Kitchen', risk_score: 55, orders: 2103, returns: 315, revenue_at_risk: 189000 },
  { category: 'Beauty', risk_score: 45, orders: 1456, returns: 161, revenue_at_risk: 96600 },
  { category: 'Books', risk_score: 22, orders: 987, returns: 59, revenue_at_risk: 17700 },
  { category: 'Toys', risk_score: 61, orders: 743, returns: 134, revenue_at_risk: 80400 },
  { category: 'Sports', risk_score: 48, orders: 956, returns: 137, revenue_at_risk: 109600 },
]

export const useDashboardStore = create((set, get) => ({
  kpis: {
    total_orders: 12847,
    return_rate: 18.3,
    revenue_at_risk: 2341800,
    returns_prevented: 1847,
    trend_total_orders: 12.5,
    trend_return_rate: -3.2,
    trend_revenue_at_risk: -8.1,
    trend_returns_prevented: 24.7,
  },
  orders: generateOrders(),
  trends: generateTrends(),
  heatmap: generateHeatmap(),
  anomaly: {
    active: true,
    message: 'Return rate spike detected in Electronics (+34% vs last week). Primary cause: Missing size charts in 847 listings.',
    severity: 'high',
    timestamp: new Date().toISOString(),
  },
  isLoading: false,
  selectedOrder: null,

  setSelectedOrder: (order) => set({ selectedOrder: order }),

  dismissAnomaly: () => set({ anomaly: null }),

  getOrderById: (id) => get().orders.find(o => o.order_id === id),

  getFilteredOrders: (filters) => {
    let orders = get().orders
    if (filters.risk_level) orders = orders.filter(o => o.risk_level === filters.risk_level)
    if (filters.category) orders = orders.filter(o => o.category === filters.category)
    if (filters.search) orders = orders.filter(o =>
      o.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      o.order_id.toLowerCase().includes(filters.search.toLowerCase())
    )
    return orders
  },

  addLiveOrder: (order) => set(state => ({
    orders: [order, ...state.orders],
    kpis: { ...state.kpis, total_orders: state.kpis.total_orders + 1 }
  })),
}))
