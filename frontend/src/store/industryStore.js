import { create } from 'zustand'

export const INDUSTRIES = {
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce',
    icon: '🛒',
    companyExample: 'Amazon, Flipkart, Meesho',
    concepts: {
      return: 'Return',
      returns: 'Returns',
      seller: 'Seller',
      sellers: 'Sellers',
      product: 'Product',
      products: 'Products',
      lossMetric: 'Revenue at Risk',
      preventedMetric: 'Returns Prevented'
    },
    kpis: {
      total_orders: {
        title: 'Total Orders',
        rawValue: 12847,
        format: 'number',
        trend: 12.5,
        trendGoodDown: false,
        icon: 'ShoppingCart',
        color: '#3B82F6',
        formula: 'COUNT(order_id)',
        definition: 'Aggregate purchase logs received in the active warehouse database partition.',
        meaning: 'Top-line sales activity. Helps normalize return rates across channels.',
        action: 'Compare trend with historical baseline to isolate seasonal spikes.'
      },
      return_rate: {
        title: 'Return Rate',
        rawValue: 18.3,
        format: 'percentage',
        trend: -3.2,
        trendGoodDown: true,
        icon: 'RefreshCw',
        color: '#EF4444',
        formula: '(COUNT(returned_orders) / COUNT(total_orders)) * 100',
        definition: 'Percentage of shipped products returned by customers.',
        meaning: 'Primary cost leakage driver. High rates indicate listing mismatches or quality defects.',
        action: 'Audit size charts and high-return seller accounts via Pareto analysis.'
      },
      revenue_at_risk: {
        title: 'Revenue at Risk',
        rawValue: 2341800,
        format: 'currency',
        trend: -8.1,
        trendGoodDown: true,
        icon: 'AlertCircle',
        color: '#F97316',
        formula: 'SUM(returned_price_value)',
        definition: 'Estimated GMV tied to orders currently flagged with high return probability.',
        meaning: 'Immediate financial impact. Direct representation of potential reverse logistics claims.',
        action: 'Deploy interactive product detail checks or alert seller support to inspect inventory.'
      },
      returns_prevented: {
        title: 'Returns Prevented',
        rawValue: 1847,
        format: 'number',
        trend: 24.7,
        trendGoodDown: false,
        icon: 'Shield',
        color: '#10B981',
        formula: 'SUM(prevented_instances)',
        definition: 'Total returns blocked through automated size/specification alerts and catalog corrections.',
        meaning: 'Business value generated. Realized margin protection and logistics cost savings.',
        action: 'Expand RAG description optimization rules to lower-performing categories.'
      }
    },
    categories: [
      { name: 'Electronics', score: 82, color: '#EF4444', orders: 2847, returns: 512, revenue_at_risk: 1240000 },
      { name: 'Clothing', score: 74, color: '#F97316', orders: 3921, returns: 784, revenue_at_risk: 392000 },
      { name: 'Footwear', score: 68, color: '#F97316', orders: 1834, returns: 329, revenue_at_risk: 264000 },
      { name: 'Home & Kitchen', score: 55, color: '#F59E0B', orders: 2103, returns: 315, revenue_at_risk: 189000 },
      { name: 'Beauty', score: 45, color: '#10B981', orders: 1456, returns: 161, revenue_at_risk: 96600 },
      { name: 'Toys', score: 61, color: '#F59E0B', orders: 743, returns: 134, revenue_at_risk: 80400 },
      { name: 'Sports', score: 48, color: '#F59E0B', orders: 956, returns: 137, revenue_at_risk: 109600 },
      { name: 'Books', score: 22, color: '#10B981', orders: 987, returns: 59, revenue_at_risk: 17700 }
    ],
    anomaly: {
      message: 'Return rate spike detected in Electronics (+34% vs last week). Primary cause: Missing size charts in 847 listings.',
      severity: 'high'
    },
    insights: [
      { id: 1, message: 'Size mismatches accounted for 54% of apparel returns this month.', type: 'critical' },
      { id: 2, message: 'Top 5 sellers drive 42% of Electronics returns. Inspect seller health cards.', type: 'warning' },
      { id: 3, message: 'Automatic size chart updates prevented ₹1.8L in clothing returns yesterday.', type: 'success' }
    ],
    recommendations: [
      'Implement size recommendation wizard for Apparel category.',
      'Require seller specifications check for Electronics listing validation.',
      'Apply dynamic return policy bounds for high-risk customer segments.'
    ],
    forecast: {
      metric: 'Projected Return Rate',
      value: '18.1%',
      lower: '15.4%',
      upper: '20.8%',
      stability: '91.8%',
      trends: [18.5, 18.2, 18.4, 18.1, 18.3, 18.0, 18.2, 17.9, 18.1, 17.8]
    },
    experiment: {
      name: 'Dynamic Size Guide v2.1',
      metric: 'Return Rate Reduction',
      baseline: '22.4%',
      variant: '18.1%',
      zScore: 3.42,
      pValue: 0.0006,
      status: 'Statistically Significant (p < 0.05)'
    }
  },
  food: {
    id: 'food',
    name: 'Food Delivery',
    icon: '🍕',
    companyExample: 'Zomato, Swiggy',
    concepts: {
      return: 'Cancellation',
      returns: 'Cancellations',
      seller: 'Restaurant',
      sellers: 'Restaurants',
      product: 'Menu Item',
      products: 'Menu Items',
      lossMetric: 'Refund Cost',
      preventedMetric: 'Cancellations Avoided'
    },
    kpis: {
      total_orders: {
        title: 'Total Food Orders',
        rawValue: 34820,
        format: 'number',
        trend: 18.4,
        trendGoodDown: false,
        icon: 'ShoppingCart',
        color: '#3B82F6',
        formula: 'COUNT(order_id)',
        definition: 'Total meal deliveries completed within the active region.',
        meaning: 'Operational volume indicator. Critical for kitchen resource planning.',
        action: 'Correlate peak-hour order load with courier dispatch efficiency.'
      },
      return_rate: {
        title: 'Cancellation Rate',
        rawValue: 4.8,
        format: 'percentage',
        trend: 8.2,
        trendGoodDown: true,
        icon: 'RefreshCw',
        color: '#EF4444',
        formula: '(COUNT(cancelled_orders) / COUNT(total_orders)) * 100',
        definition: 'Percentage of placed orders cancelled by users or restaurants.',
        meaning: 'SLA breach driver. Highly correlated with restaurant delays and courier shortages.',
        action: 'Flag restaurants taking longer than 15 minutes to confirm preparations.'
      },
      revenue_at_risk: {
        title: 'Refund Cost',
        rawValue: 489000,
        format: 'currency',
        trend: 12.1,
        trendGoodDown: true,
        icon: 'AlertCircle',
        color: '#F97316',
        formula: 'SUM(refund_compensation_value)',
        definition: 'Direct payout cost generated by late deliveries, wrong orders, and packaging faults.',
        meaning: 'Pure profit margin erosion. Direct operational overhead leaks.',
        action: 'Impose courier reassignment limits and set strict preparation SLAs.'
      },
      returns_prevented: {
        title: 'Cancellations Avoided',
        rawValue: 3120,
        format: 'number',
        trend: 15.3,
        trendGoodDown: false,
        icon: 'Shield',
        color: '#10B981',
        formula: 'SUM(rerouted_instances)',
        definition: 'Cancellations preempted through automated courier rerouting and smart prep estimators.',
        meaning: 'Retained GMV. Measures quality and efficiency optimization savings.',
        action: 'Scale up dynamic route prediction thresholds for rainy/peak periods.'
      }
    },
    categories: [
      { name: 'North Indian', score: 78, color: '#EF4444', orders: 8470, returns: 660, revenue_at_risk: 180000 },
      { name: 'Biryani', score: 72, color: '#F97316', orders: 9210, returns: 663, revenue_at_risk: 130000 },
      { name: 'Pizzas & Burgers', score: 65, color: '#F97316', orders: 5834, returns: 379, revenue_at_risk: 84000 },
      { name: 'Desserts', score: 42, color: '#10B981', orders: 3103, returns: 130, revenue_at_risk: 25000 },
      { name: 'Chinese', score: 58, color: '#F59E0B', orders: 4456, returns: 258, revenue_at_risk: 42000 },
      { name: 'Beverages', score: 28, color: '#10B981', orders: 1743, returns: 48, revenue_at_risk: 8000 },
      { name: 'Healthy', score: 51, color: '#F59E0B', orders: 1256, returns: 64, revenue_at_risk: 15000 },
      { name: 'South Indian', score: 35, color: '#10B981', orders: 956, returns: 33, revenue_at_risk: 5000 }
    ],
    anomaly: {
      message: 'Cancellation spike detected in Biryani segment (+28% vs normal baseline). Cause: Courier delays due to local rain waterlogging.',
      severity: 'high'
    },
    insights: [
      { id: 1, message: 'Delivery delays contributed to 38% of cancellations this Sunday.', type: 'critical' },
      { id: 2, message: 'Dessert preparation delays are averaging 18m, breaching standard SLA.', type: 'warning' },
      { id: 3, message: 'Automated courier swap algorithm saved ₹42K in potential cancellation compensations.', type: 'success' }
    ],
    recommendations: [
      'Increase active courier allocation coefficients near waterlogged clusters.',
      'Audit restaurant onboarding prep times for North Indian cuisine sellers.',
      'Promote express delivery insurance to high-frequency corporate subscribers.'
    ],
    forecast: {
      metric: 'Projected Cancellation Rate',
      value: '4.2%',
      lower: '3.6%',
      upper: '4.8%',
      stability: '94.2%',
      trends: [4.7, 4.6, 4.5, 4.4, 4.3, 4.1, 4.3, 4.0, 4.2, 3.9]
    },
    experiment: {
      name: 'Dynamic Prep SLA Estimator',
      metric: 'Cancellation Rate Reduction',
      baseline: '5.8%',
      variant: '4.2%',
      zScore: 4.11,
      pValue: 0.0001,
      status: 'Statistically Significant (p < 0.05)'
    }
  },
  grocery: {
    id: 'grocery',
    name: 'Grocery Delivery',
    icon: '🥦',
    companyExample: 'Blinkit, Zepto, Instamart',
    concepts: {
      return: 'Missing Item Claim',
      returns: 'Missing Items',
      seller: 'Dark Store',
      sellers: 'Dark Stores',
      product: 'Grocery Item',
      products: 'Grocery Items',
      lossMetric: 'Inventory Write-Off',
      preventedMetric: 'Fulfillments Secured'
    },
    kpis: {
      total_orders: {
        title: 'Total Grocery Orders',
        rawValue: 42950,
        format: 'number',
        trend: 22.1,
        trendGoodDown: false,
        icon: 'ShoppingCart',
        color: '#3B82F6',
        formula: 'COUNT(order_id)',
        definition: 'Total completed baskets routed through localized micro-warehouses (dark stores).',
        meaning: 'Demand scale indicator. Helps measure logistics throughput efficiency.',
        action: 'Track order density maps to balance dark store inventory allocations.'
      },
      return_rate: {
        title: 'Missing Item Rate',
        rawValue: 2.9,
        format: 'percentage',
        trend: -1.4,
        trendGoodDown: true,
        icon: 'RefreshCw',
        color: '#EF4444',
        formula: '(COUNT(orders_with_missing_items) / COUNT(total_orders)) * 100',
        definition: 'Percentage of dispatched baskets containing missing, damaged, or expired items.',
        meaning: 'Key loyalty metric. High rates signal packing errors or inventory lag.',
        action: 'Implement barcode scanners at packer desks for top 3 affected items.'
      },
      revenue_at_risk: {
        title: 'Inventory Write-Off',
        rawValue: 184500,
        format: 'currency',
        trend: -5.4,
        trendGoodDown: true,
        icon: 'AlertCircle',
        color: '#F97316',
        formula: 'SUM(spoiled_and_lost_inventory_cost)',
        definition: 'Direct capital loss due to spoiled fresh items and stockout refunds.',
        meaning: 'Direct impact on bottom-line retail margin. Indicates supply chain leakage.',
        action: 'Set dynamic price drops for fresh produce items approaching 24h stock age.'
      },
      returns_prevented: {
        title: 'Fulfillments Secured',
        rawValue: 2840,
        format: 'number',
        trend: 18.2,
        trendGoodDown: false,
        icon: 'Shield',
        color: '#10B981',
        formula: 'SUM(out_of_stock_substitutions)',
        definition: 'Items preserved from refund through real-time alternative stock recommendations.',
        meaning: 'Basket value preservation rate. Quantifies customer satisfaction save.',
        action: 'Promote matching inventory substitutions for private-label products.'
      }
    },
    categories: [
      { name: 'Fresh Fruits', score: 85, color: '#EF4444', orders: 9840, returns: 836, revenue_at_risk: 62000 },
      { name: 'Vegetables', score: 79, color: '#EF4444', orders: 12500, returns: 987, revenue_at_risk: 54000 },
      { name: 'Dairy & Eggs', score: 62, color: '#F59E0B', orders: 8340, returns: 517, revenue_at_risk: 31000 },
      { name: 'Snacks', score: 32, color: '#10B981', orders: 6100, returns: 195, revenue_at_risk: 12000 },
      { name: 'Staple Grains', score: 25, color: '#10B981', orders: 3450, returns: 86, revenue_at_risk: 9000 },
      { name: 'Beverages', score: 41, color: '#10B981', orders: 1740, returns: 71, revenue_at_risk: 6000 },
      { name: 'Cleaning', score: 18, color: '#10B981', orders: 1250, returns: 22, revenue_at_risk: 2500 },
      { name: 'Frozen', score: 55, color: '#F59E0B', orders: 950, returns: 52, revenue_at_risk: 8000 }
    ],
    anomaly: {
      message: 'Spoilage spike flagged in Fresh Fruits category at DarkStore-North (+42% write-off cost). Inspect cooling unit parameters.',
      severity: 'high'
    },
    insights: [
      { id: 1, message: 'Stock accuracy mismatch in DarkStore-West caused 210 refund claims today.', type: 'critical' },
      { id: 2, message: 'Fresh produce shelf life limits triggered ₹12K in markdown sales.', type: 'warning' },
      { id: 3, message: 'Real-time item replacement engine secured 420 grocery baskets from cancellation.', type: 'success' }
    ],
    recommendations: [
      'Upgrade packer validation rules with mandatory scale checks.',
      'Deploy localized alerts for fruits nearing inventory threshold limits.',
      'Re-route delivery couriers based on cool-chain insulation requirements.'
    ],
    forecast: {
      metric: 'Projected Missing Item Rate',
      value: '2.5%',
      lower: '2.1%',
      upper: '2.9%',
      stability: '96.8%',
      trends: [2.9, 2.8, 2.7, 2.7, 2.6, 2.5, 2.5, 2.4, 2.3, 2.2]
    },
    experiment: {
      name: 'Weight-Based Packing Validation',
      metric: 'Missing Item Rate Reduction',
      baseline: '3.6%',
      variant: '2.5%',
      zScore: 5.12,
      pValue: 0.00001,
      status: 'Statistically Significant (p < 0.05)'
    }
  },
  banking: {
    id: 'banking',
    name: 'Banking & Cards',
    icon: '💳',
    companyExample: 'American Express, Kotak, JPMorgan',
    concepts: {
      return: 'Complaint',
      returns: 'Complaints',
      seller: 'Branch/Product',
      sellers: 'Branches/Products',
      product: 'Financial Service',
      products: 'Financial Services',
      lossMetric: 'Compensation Claims',
      preventedMetric: 'Complaints Resolved'
    },
    kpis: {
      total_orders: {
        title: 'Total Transactions',
        rawValue: 895400,
        format: 'number',
        trend: 8.7,
        trendGoodDown: false,
        icon: 'ShoppingCart',
        color: '#3B82F6',
        formula: 'COUNT(txn_id)',
        definition: 'Total volume of transactions routed through the processing network.',
        meaning: 'Network activity health. Indicates customer engagement and spending limits.',
        action: 'Track authorization success trends to prevent network outage delays.'
      },
      return_rate: {
        title: 'Complaint Rate',
        rawValue: 1.15,
        format: 'percentage',
        trend: 14.2,
        trendGoodDown: true,
        icon: 'RefreshCw',
        color: '#EF4444',
        formula: '(COUNT(disputed_transactions) / COUNT(total_transactions)) * 100',
        definition: 'Percentage of settlements disputed or reported as customer complaints.',
        meaning: 'Reputational and operational risk driver. Measures service quality index.',
        action: 'Trigger audit of auto-debit failure logs for the top bank branch partner.'
      },
      revenue_at_risk: {
        title: 'Compensation Claims',
        rawValue: 1280000,
        format: 'currency',
        trend: 18.5,
        trendGoodDown: true,
        icon: 'AlertCircle',
        color: '#F97316',
        formula: 'SUM(disputed_claim_payouts)',
        definition: 'Disputed volume liable to customer chargebacks, refunds, or regulatory penalties.',
        meaning: 'Direct credit and compliance risk. Capital loss exposure.',
        action: 'Review chargeback queues and fraud models for international merchant categories.'
      },
      returns_prevented: {
        title: 'Complaints Resolved',
        rawValue: 4320,
        format: 'number',
        trend: 9.8,
        trendGoodDown: false,
        icon: 'Shield',
        color: '#10B981',
        formula: 'SUM(automated_dispute_saves)',
        definition: 'Disputes resolved instantly using automated clearing filters and self-service bots.',
        meaning: 'Operating margin protected. Quantifies support center resource savings.',
        action: 'Expand NL2SQL models to customer support terminals to speed up search audits.'
      }
    },
    categories: [
      { name: 'Credit Cards', score: 88, color: '#EF4444', orders: 284000, returns: 3120, revenue_at_risk: 720000 },
      { name: 'Personal Loans', score: 76, color: '#F97316', orders: 125000, returns: 1420, revenue_at_risk: 310000 },
      { name: 'Home Loans', score: 61, color: '#F59E0B', orders: 48000, returns: 292, revenue_at_risk: 180000 },
      { name: 'Savings Accounts', score: 45, color: '#10B981', orders: 320000, returns: 1440, revenue_at_risk: 42000 },
      { name: 'Net Banking', score: 55, color: '#F59E0B', orders: 84000, returns: 462, revenue_at_risk: 18000 },
      { name: 'Wealth', score: 32, color: '#10B981', orders: 18000, returns: 57, revenue_at_risk: 8000 },
      { name: 'Demat', score: 28, color: '#10B981', orders: 11000, returns: 30, revenue_at_risk: 2000 },
      { name: 'Insurance', score: 58, color: '#F59E0B', orders: 5400, returns: 31, revenue_at_risk: 10000 }
    ],
    anomaly: {
      message: 'Complaint rate spike detected in Credit Cards (+24% vs historical median). Cause: Late delivery of monthly statements.',
      severity: 'high'
    },
    insights: [
      { id: 1, message: 'Disputed online txn claims increased by 14.2% on premium accounts.', type: 'critical' },
      { id: 2, message: 'Average chargeback resolution time increased to 4.8 days, breaching target SLA.', type: 'warning' },
      { id: 3, message: 'Instant dispute check algorithm prevented ₹80K in cardholder refunds.', type: 'success' }
    ],
    recommendations: [
      'Implement real-time txn verification prompts for premium cardholders.',
      'Audit card courier delivery milestones for high-complaint branches.',
      'Configure auto-compensation triggers for verified merchant network failures.'
    ],
    forecast: {
      metric: 'Projected Complaint Rate',
      value: '1.02%',
      lower: '0.88%',
      upper: '1.16%',
      stability: '95.4%',
      trends: [1.25, 1.22, 1.18, 1.15, 1.12, 1.05, 1.08, 1.01, 0.98, 0.95]
    },
    experiment: {
      name: 'Dynamic Txn Verification Prompts',
      metric: 'Complaint Rate Reduction',
      baseline: '1.54%',
      variant: '1.15%',
      zScore: 3.84,
      pValue: 0.0001,
      status: 'Statistically Significant (p < 0.05)'
    }
  },
  saas: {
    id: 'saas',
    name: 'B2B SaaS',
    icon: '⚡',
    companyExample: 'Salesforce, HubSpot, Stripe',
    concepts: {
      return: 'Account Churn',
      returns: 'Churned Accounts',
      seller: 'Account Tier',
      sellers: 'Account Tiers',
      product: 'Subscription Plan',
      products: 'Subscription Plans',
      lossMetric: 'ARR at Risk',
      preventedMetric: 'Renewals Secured'
    },
    kpis: {
      total_orders: {
        title: 'Active Accounts',
        rawValue: 4820,
        format: 'number',
        trend: 14.8,
        trendGoodDown: false,
        icon: 'ShoppingCart',
        color: '#3B82F6',
        formula: 'COUNT(tenant_id)',
        definition: 'Total paying enterprise subscription accounts active on the cloud platform.',
        meaning: 'Core portfolio expansion metric. Primary driver of monthly recurring revenue.',
        action: 'Audit usage frequency metrics for recently activated enterprise tenants.'
      },
      return_rate: {
        title: 'Churn Rate',
        rawValue: 3.4,
        format: 'percentage',
        trend: -1.2,
        trendGoodDown: true,
        icon: 'RefreshCw',
        color: '#EF4444',
        formula: '(COUNT(churned_accounts) / COUNT(total_accounts)) * 100',
        definition: 'Percentage of customer accounts that terminated their subscription.',
        meaning: 'Platform value health checker. High churn indicates feature friction or bad onboarding.',
        action: 'Review support ticket queues for accounts showing drops in API usage.'
      },
      revenue_at_risk: {
        title: 'ARR at Risk',
        rawValue: 9450000,
        format: 'currency',
        trend: -15.4,
        trendGoodDown: true,
        icon: 'AlertCircle',
        color: '#F97316',
        formula: 'SUM(tenant_arr_value) WHERE health_score < 40',
        definition: 'Total annualized recurring revenue belonging to tenants showing low health index.',
        meaning: 'Revenue expansion risk. Directly impacts forward valuation metrics.',
        action: 'Coordinate customer success call triggers for enterprise plans in critical health.'
      },
      returns_prevented: {
        title: 'Renewals Secured',
        rawValue: 450,
        format: 'number',
        trend: 18.7,
        trendGoodDown: false,
        icon: 'Shield',
        color: '#10B981',
        formula: 'SUM(prevented_churn_value)',
        definition: 'Accounts successfully renewed after triggering customer success alert sequences.',
        meaning: 'Retained ARR. Measures proactive account management performance.',
        action: 'Expand self-service upgrade promotions inside standard platform dashboards.'
      }
    },
    categories: [
      { name: 'Enterprise Tier', score: 84, color: '#EF4444', orders: 480, returns: 16, revenue_at_risk: 7200000 },
      { name: 'Growth Tier', score: 68, color: '#F97316', orders: 1250, returns: 42, revenue_at_risk: 1650000 },
      { name: 'Startup Tier', score: 55, color: '#F59E0B', orders: 2100, returns: 115, revenue_at_risk: 420000 },
      { name: 'API Addons', score: 41, color: '#10B981', orders: 310, returns: 13, revenue_at_risk: 80000 },
      { name: 'Professional Tier', score: 48, color: '#F59E0B', orders: 450, returns: 22, revenue_at_risk: 60000 },
      { name: 'Custom Plan', score: 62, color: '#F97316', orders: 110, returns: 7, revenue_at_risk: 30000 },
      { name: 'Integrations', score: 28, color: '#10B981', orders: 90, returns: 3, revenue_at_risk: 8000 },
      { name: 'Support SLA', score: 35, color: '#10B981', orders: 30, returns: 1, revenue_at_risk: 2000 }
    ],
    anomaly: {
      message: 'Churn risk spike detected in Enterprise Tier (+32% vs monthly benchmark). Primary cause: Long queue resolution times on critical support tickets.',
      severity: 'high'
    },
    insights: [
      { id: 1, message: 'Support ticket resolution delays contributed to 42% of churn risk indicators.', type: 'critical' },
      { id: 2, message: 'API usage rates dropped 22% on Growth Tier accounts this week.', type: 'warning' },
      { id: 3, message: 'Automated CS notification flow secured 12 enterprise renewals yesterday.', type: 'success' }
    ],
    recommendations: [
      'Increase support personnel allocations for critical priority ticket queues.',
      'Deploy localized alerts for Growth accounts showing sudden API rate drops.',
      'Configure auto-discount emails for accounts experiencing platform outages.'
    ],
    forecast: {
      metric: 'Projected Churn Rate',
      value: '3.1%',
      lower: '2.5%',
      upper: '3.7%',
      stability: '93.6%',
      trends: [3.8, 3.7, 3.6, 3.5, 3.4, 3.3, 3.4, 3.2, 3.1, 2.9]
    },
    experiment: {
      name: 'Interactive Onboarding Tour v3',
      metric: 'Account Churn Rate Reduction',
      baseline: '4.8%',
      variant: '3.4%',
      zScore: 3.12,
      pValue: 0.0018,
      status: 'Statistically Significant (p < 0.05)'
    }
  }
}

export const useIndustryStore = create((set) => ({
  activeIndustry: 'ecommerce',
  setIndustry: (industryId) => set({ activeIndustry: industryId }),
  getIndustryData: (industryId) => INDUSTRIES[industryId] || INDUSTRIES.ecommerce
}))
