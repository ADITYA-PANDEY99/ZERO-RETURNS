-- ============================================================
-- ZeroReturn Enterprise Analytics Warehouse Schema (Sprint Upgrade)
-- ============================================================

-- ------------------------------------------------------------
-- 1. DIMENSION TABLES
-- ------------------------------------------------------------

-- Time Dimension Table (dim_time)
CREATE TABLE IF NOT EXISTS public.dim_time (
    time_key            DATE PRIMARY KEY,
    day_name            VARCHAR(10) NOT NULL,
    day_of_week         INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    day_of_month        INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    week_of_year        INTEGER NOT NULL CHECK (week_of_year BETWEEN 1 AND 53),
    month_name          VARCHAR(10) NOT NULL,
    month_number        INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
    quarter             INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    year                INTEGER NOT NULL,
    is_weekend          BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dim_time_month ON public.dim_time(month_number);
CREATE INDEX IF NOT EXISTS idx_dim_time_year ON public.dim_time(year);

-- Product Analytics Dimension Table (dim_product_analytics)
CREATE TABLE IF NOT EXISTS public.dim_product_analytics (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name                TEXT UNIQUE NOT NULL,
    category                    TEXT NOT NULL,
    base_price                  NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    -- Analytical Features / Store Metrics
    product_health_score        NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    avg_review_score            NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    sentiment_score             NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    historical_return_rate      NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    total_returns_count         INTEGER NOT NULL DEFAULT 0,
    total_sales_count           INTEGER NOT NULL DEFAULT 0,
    last_updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dim_prod_cat ON public.dim_product_analytics(category);
CREATE INDEX IF NOT EXISTS idx_dim_prod_health ON public.dim_product_analytics(product_health_score);

-- Customer Analytics Table (customer_analytics)
CREATE TABLE IF NOT EXISTS public.customer_analytics (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name               TEXT UNIQUE NOT NULL,
    -- Enterprise Analytics Metrics
    customer_lifetime_value     NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    purchase_frequency_days     NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    return_frequency_pct        NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    complaint_frequency_pct      NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    customer_risk_score         NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_orders_placed         INTEGER NOT NULL DEFAULT 0,
    total_items_returned        INTEGER NOT NULL DEFAULT 0,
    last_updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_risk ON public.customer_analytics(customer_risk_score);
CREATE INDEX IF NOT EXISTS idx_cust_clv ON public.customer_analytics(customer_lifetime_value);

-- Seller Analytics Table (seller_analytics)
CREATE TABLE IF NOT EXISTS public.seller_analytics (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_name                 TEXT UNIQUE NOT NULL,
    -- Analytical Metrics
    seller_health_score         NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    revenue_contribution_pct    NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    risk_contribution_pct       NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    total_sales_volume          NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_returns_volume        NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    last_updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_health ON public.seller_analytics(seller_health_score);

-- ------------------------------------------------------------
-- 2. FACT TABLES
-- ------------------------------------------------------------

-- Fact Returns Table (fact_returns)
CREATE TABLE IF NOT EXISTS public.fact_returns (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id                    TEXT NOT NULL,
    time_key                    DATE NOT NULL REFERENCES public.dim_time(time_key),
    product_analytics_id        UUID REFERENCES public.dim_product_analytics(id) ON DELETE SET NULL,
    customer_analytics_id       UUID REFERENCES public.customer_analytics(id) ON DELETE SET NULL,
    seller_analytics_id         UUID REFERENCES public.seller_analytics(id) ON DELETE SET NULL,
    
    -- Transactional metrics
    price                       NUMERIC(12, 2) NOT NULL,
    predicted_risk_score        NUMERIC(5, 2) NOT NULL,
    actual_returned             BOOLEAN NOT NULL DEFAULT FALSE,
    mismatch_detected           BOOLEAN NOT NULL DEFAULT FALSE,
    image_issue_detected        BOOLEAN NOT NULL DEFAULT FALSE,
    revenue_saved               NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    days_to_delivery            INTEGER,
    last_updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fact_returns_time ON public.fact_returns(time_key);
CREATE INDEX IF NOT EXISTS idx_fact_returns_user ON public.fact_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_fact_returns_risk ON public.fact_returns(predicted_risk_score);

-- ------------------------------------------------------------
-- 3. KPI SUMMARIES (Aggregated Layers)
-- ------------------------------------------------------------

-- Daily KPI Summary
CREATE TABLE IF NOT EXISTS public.kpi_daily (
    time_key                    DATE PRIMARY KEY REFERENCES public.dim_time(time_key),
    total_orders                INTEGER NOT NULL DEFAULT 0,
    total_returns               INTEGER NOT NULL DEFAULT 0,
    total_revenue               NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    revenue_at_risk             NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    revenue_saved               NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    return_rate                 NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    refund_rate                 NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    complaint_rate              NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    system_avg_health_score     NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    last_updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Monthly KPI Summary
CREATE TABLE IF NOT EXISTS public.kpi_monthly (
    year                        INTEGER NOT NULL,
    month_number                INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
    total_orders                INTEGER NOT NULL DEFAULT 0,
    total_returns               INTEGER NOT NULL DEFAULT 0,
    total_revenue               NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    revenue_at_risk             NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    revenue_saved               NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    return_rate                 NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    refund_rate                 NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    complaint_rate              NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    last_updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (year, month_number)
);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ------------------------------------------------------------

ALTER TABLE public.dim_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_monthly ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Public read profiles allowed for authenticated users" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "View own user analytical facts" 
    ON public.fact_returns FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Insert own user analytical facts"
    ON public.fact_returns FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow view products to all auth users" 
    ON public.dim_product_analytics FOR SELECT USING (true);

CREATE POLICY "Allow view customers to all auth users" 
    ON public.customer_analytics FOR SELECT USING (true);

CREATE POLICY "Allow view sellers to all auth users" 
    ON public.seller_analytics FOR SELECT USING (true);

CREATE POLICY "Allow view daily KPIs to all auth users" 
    ON public.kpi_daily FOR SELECT USING (true);

CREATE POLICY "Allow view monthly KPIs to all auth users" 
    ON public.kpi_monthly FOR SELECT USING (true);

CREATE POLICY "Allow view time dimension to all auth users" 
    ON public.dim_time FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 5. AUTOMATIC TIME DIMENSION POPULATOR FUNCTION
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.populate_dim_time_range(start_date DATE, end_date DATE)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    curr_date DATE := start_date;
BEGIN
    WHILE curr_date <= end_date LOOP
        INSERT INTO public.dim_time (
            time_key, day_name, day_of_week, day_of_month,
            week_of_year, month_name, month_number, quarter, year, is_weekend
        ) VALUES (
            curr_date,
            TO_CHAR(curr_date, 'FMDay'),
            EXTRACT(ISODOW FROM curr_date)::INTEGER,
            EXTRACT(DAY FROM curr_date)::INTEGER,
            EXTRACT(WEEK FROM curr_date)::INTEGER,
            TO_CHAR(curr_date, 'FMMonth'),
            EXTRACT(MONTH FROM curr_date)::INTEGER,
            EXTRACT(QUARTER FROM curr_date)::INTEGER,
            EXTRACT(YEAR FROM curr_date)::INTEGER,
            CASE WHEN EXTRACT(ISODOW FROM curr_date) IN (6, 7) THEN TRUE ELSE FALSE END
        ) ON CONFLICT (time_key) DO NOTHING;
        
        curr_date := curr_date + 1;
    END LOOP;
END;
$$;

-- Populate default window (from 2023-01-01 to 2028-12-31)
SELECT public.populate_dim_time_range('2023-01-01'::DATE, '2028-12-31'::DATE);
