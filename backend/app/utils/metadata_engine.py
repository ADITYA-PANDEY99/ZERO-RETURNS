# ZeroReturn Enterprise Analytics Metadata Engine
# Stores central metrics catalog, definitions, data sources, formulas, and operational dependencies.

# Centralized KPI Dictionary serving metadata to all client-side explorer portals
KPI_CATALOG = {
    "total_orders": {
        "id": "kpi-001",
        "name": "Total Volume / Orders",
        "category": "Volume & Scale",
        "definition": "The cumulative count of customer checkout transactions processed in the active tracking window.",
        "formula": "COUNT(id) FROM orders",
        "data_source": "production.orders",
        "refresh_frequency": "Near Real-Time (30s WebSocket stream)",
        "owner": "Marketplace Operations Team",
        "business_meaning": "Measures total throughput. Critical for operations, logistics planning, and server sizing.",
        "industry_variants": {
            "ecommerce": "Total checkout transactions of goods",
            "food": "Total menu items ordered & dispatched",
            "grocery": "Total home-delivery grocery carts fulfilled",
            "banking": "Total transactional/card swipe events logged",
            "saas": "Total active subscriber usage licenses"
        },
        "interview_explanation": "This metric represents the denominator for all return risk calculations. Scale determines model tuning frequencies — small cohorts require weekly parameter adjustments, while high-volume tables run dynamic, daily updating weights.",
        "use_cases": ["Infrastructure capacity planning", "Seasonal growth adjustments"],
        "common_mistakes": "Including canceled checkouts before validation is complete."
    },
    "return_rate": {
        "id": "kpi-002",
        "name": "Aggregate Return Rate",
        "category": "Satisfaction & Risk",
        "definition": "The percentage of shipped orders that result in returns or cancellations.",
        "formula": "(COUNT(id WHERE returned = 1) / COUNT(id)) * 100",
        "data_source": "warehouse.fact_returns",
        "refresh_frequency": "Hourly batch run",
        "owner": "Merchant Relations Director",
        "business_meaning": "Measures quality leakage and customer disappointment. Values exceeding 15% degrade margins.",
        "industry_variants": {
            "ecommerce": "Product return rate post-delivery",
            "food": "Order cancellation rate before/during delivery",
            "grocery": "Product refund rate (missing/damaged goods)",
            "banking": "Customer complaint/dispute rates per branch",
            "saas": "Monthly subscriber cancellation / churn rate"
        },
        "interview_explanation": "We calculate Return Rate on the fact table. High return rates trigger catalog audits via NLP. In production, we segment this by category to identify individual listing errors or fraud vectors.",
        "use_cases": ["Listing catalog audits", "Vendor penalization trigger rules"],
        "common_mistakes": "Failing to exclude orders canceled pre-shipping which falsely inflates operational return rates."
    },
    "revenue_at_risk": {
        "id": "kpi-003",
        "name": "Revenue at Risk",
        "category": "Financial Risk",
        "definition": "The monetary value of active orders that have a high probability of being returned.",
        "formula": "SUM(price * predicted_risk_score) / 100",
        "data_source": "warehouse.fact_returns & ml.predictions",
        "refresh_frequency": "Dynamic (Calculated per order checkout)",
        "owner": "Financial Risk Committee",
        "business_meaning": "Represents the potential cash flow loss. Crucial for balance sheet reserve allocation.",
        "industry_variants": {
            "ecommerce": "Refund/return values currently in transit",
            "food": "Cost of cancellations/refunds of prepared meals",
            "grocery": "Fulfillment errors and damaged stock valuation",
            "banking": "Value at risk from fraudulent transaction claims",
            "saas": "Contingent contract values from clients in high churn risk"
        },
        "interview_explanation": "This metric links prediction probabilities to financial values. By multiplying price by the output of our classifier, we determine potential loss in rupees before it hits the books.",
        "use_cases": ["Cash reserve ratio optimization", "Pre-shipment order hold workflow"],
        "common_mistakes": "Applying static risk averages instead of order-specific risk percentages, losing prediction granularity."
    },
    "returns_prevented": {
        "id": "kpi-004",
        "name": "Returns Prevented by AI",
        "category": "Platform Impact",
        "definition": "The estimated count of orders saved from returns due to listing catalog page corrections.",
        "formula": "SUM(historical_base_rate - active_rate) * active_volume",
        "data_source": "warehouse.kpi_monthly",
        "refresh_frequency": "Weekly analysis run",
        "owner": "BI Analytics Lead",
        "business_meaning": "Verifies AI application ROI by measuring drop in return occurrences post-listing updates.",
        "industry_variants": {
            "ecommerce": "Returns saved by fixing listing text & images",
            "food": "Cancellations prevented by correcting delivery times",
            "grocery": "Fulfillment errors saved by barcode audits",
            "banking": "Disputes resolved via automated clearings",
            "saas": "Customers saved from churn via automated promotions"
        },
        "interview_explanation": "We establish a control baseline. When a seller applies our recommendation, we trace their return rate over a 30-day window against historical cohorts to determine the prevented count.",
        "use_cases": ["Platform impact reporting", "AI model performance validation"],
        "common_mistakes": "Ignoring global seasonal improvements which can falsely credit the model with return drops."
    }
}

# Lineage edges defining parent-child paths from source schemas to dashboards
LINEAGE_DATA = {
    "nodes": [
        {"id": "src_orders", "name": "production.orders", "type": "Source Table", "desc": "Raw transaction data database table"},
        {"id": "src_returns", "name": "production.returns", "type": "Source Table", "desc": "Customer return submissions table"},
        {"id": "feat_store", "name": "analytics.feature_store", "type": "Feature Table", "desc": "Pre-computed ML inputs (e.g. sentiment score, description length)"},
        {"id": "model_clf", "name": "ml.return_classifier", "type": "ML Model", "desc": "CatBoost classifier predicting risk probabilities"},
        {"id": "fact_ret", "name": "warehouse.fact_returns", "type": "Fact Table", "desc": "Enterprise analytics star-schema central table"},
        {"id": "kpi_orders", "name": "KPI: Total Orders", "type": "Calculated KPI", "desc": "Count of successful orders"},
        {"id": "kpi_rate", "name": "KPI: Return Rate", "type": "Calculated KPI", "desc": "Percentage of canceled or returned purchases"},
        {"id": "kpi_risk", "name": "KPI: Revenue at Risk", "type": "Calculated KPI", "desc": "Monomial sum of prices multiplied by risk"},
        {"id": "dashboard_exec", "name": "Executive Dashboard", "type": "Dashboard Output", "desc": "Central monitoring metrics and analytics board"}
    ],
    "edges": [
        {"source": "src_orders", "target": "feat_store", "transformation": "Aggregations by user & product"},
        {"source": "src_returns", "target": "feat_store", "transformation": "Sentiment extraction from raw reviews"},
        {"source": "feat_store", "target": "model_clf", "transformation": "Feature vector injection into CatBoost"},
        {"source": "model_clf", "target": "fact_ret", "transformation": "Insert predicted risk score"},
        {"source": "src_orders", "target": "fact_ret", "transformation": "Raw transactional pricing joins"},
        {"source": "fact_ret", "target": "kpi_orders", "transformation": "SUM(volume) aggregation"},
        {"source": "fact_ret", "target": "kpi_rate", "transformation": "COUNT(returned) / COUNT(total)"},
        {"source": "fact_ret", "target": "kpi_risk", "transformation": "SUM(price * risk_score)"},
        {"source": "kpi_orders", "target": "dashboard_exec", "transformation": "Dynamic UI widget rendering"},
        {"source": "kpi_rate", "target": "dashboard_exec", "transformation": "Dynamic UI widget rendering"},
        {"source": "kpi_risk", "target": "dashboard_exec", "transformation": "Dynamic UI widget rendering"}
    ]
}
