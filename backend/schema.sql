-- ============================================================
-- ZeroReturn Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT,
    role        TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin', 'analyst')),
    company     TEXT,
    avatar_url  TEXT,
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 2. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id                    TEXT UNIQUE NOT NULL,
    product_name                TEXT NOT NULL,
    category                    TEXT NOT NULL,
    price                       NUMERIC(12, 2) NOT NULL,
    customer_name               TEXT,
    seller_name                 TEXT,
    order_date                  DATE,
    image_url                   TEXT,
    description                 TEXT,
    description_quality_score   NUMERIC(5, 2),
    review_sentiment_score      NUMERIC(5, 2),
    avg_review_score            NUMERIC(3, 2),
    review_count                INTEGER DEFAULT 0,
    seller_rating               NUMERIC(3, 2),
    days_to_delivery            INTEGER,
    risk_score                  NUMERIC(5, 2),
    risk_level                  TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    reason                      TEXT,
    fix_applied                 BOOLEAN DEFAULT FALSE,
    fix_applied_at              TIMESTAMPTZ,
    metadata                    JSONB DEFAULT '{}',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_risk_level ON public.orders(risk_level);
CREATE INDEX IF NOT EXISTS idx_orders_category   ON public.orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_id   ON public.orders(order_id);

-- ============================================================
-- 3. PREDICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.predictions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    probability         NUMERIC(6, 4) NOT NULL,
    risk_level          TEXT NOT NULL,
    risk_score          NUMERIC(5, 2) NOT NULL,
    risk_factors        JSONB DEFAULT '[]',
    model_version       TEXT DEFAULT '1.0',
    description_analysis JSONB,
    image_analysis      JSONB,
    sentiment_analysis  JSONB,
    ai_suggestions      JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_order_id ON public.predictions(order_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created  ON public.predictions(created_at DESC);

-- ============================================================
-- 4. CHAT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    language    TEXT DEFAULT 'en',
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_session  ON public.chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id  ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created  ON public.chat_history(created_at DESC);

-- ============================================================
-- 5. UPLOAD JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.upload_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    filename        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    rows_total      INTEGER DEFAULT 0,
    rows_processed  INTEGER DEFAULT 0,
    progress_pct    NUMERIC(5, 2) DEFAULT 0,
    result_summary  JSONB,
    error           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.upload_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status  ON public.upload_jobs(status);

-- ============================================================
-- 6. ANOMALIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anomalies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric          TEXT NOT NULL,         -- e.g., 'return_rate', 'orders'
    value           NUMERIC NOT NULL,
    expected_min    NUMERIC,
    expected_max    NUMERIC,
    z_score         NUMERIC,
    severity        TEXT NOT NULL DEFAULT 'warning'
                        CHECK (severity IN ('normal', 'warning', 'critical')),
    reason          TEXT,
    category        TEXT,
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_anomalies_user_id     ON public.anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected_at ON public.anomalies(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity    ON public.anomalies(severity);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Orders: users can CRUD their own orders
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    USING (auth.uid() = user_id);

-- Predictions: accessible via order ownership
CREATE POLICY "Users can view predictions for own orders"
    ON public.predictions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = predictions.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Chat history: users own their sessions
CREATE POLICY "Users can view own chat history"
    ON public.chat_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
    ON public.chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Upload jobs: users own their jobs
CREATE POLICY "Users can view own upload jobs"
    ON public.upload_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create upload jobs"
    ON public.upload_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Anomalies: users own their anomalies
CREATE POLICY "Users can view own anomalies"
    ON public.anomalies FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- VIEWS (for dashboard queries)
-- ============================================================

CREATE OR REPLACE VIEW public.order_risk_summary AS
SELECT
    user_id,
    COUNT(*)                                            AS total_orders,
    AVG(risk_score)                                     AS avg_risk_score,
    COUNT(*) FILTER (WHERE risk_level = 'Critical')     AS critical_count,
    COUNT(*) FILTER (WHERE risk_level = 'High')         AS high_count,
    COUNT(*) FILTER (WHERE risk_level = 'Medium')       AS medium_count,
    COUNT(*) FILTER (WHERE risk_level = 'Low')          AS low_count,
    SUM(price * (risk_score / 100.0) * 0.7)            AS estimated_revenue_at_risk,
    COUNT(*) FILTER (WHERE fix_applied = TRUE)          AS fixes_applied
FROM public.orders
GROUP BY user_id;

-- Category breakdown view
CREATE OR REPLACE VIEW public.category_return_rates AS
SELECT
    user_id,
    category,
    COUNT(*)                                AS total_orders,
    AVG(risk_score)                         AS avg_risk_score,
    COUNT(*) FILTER (WHERE risk_score >= 55) AS high_risk_orders,
    SUM(price * (risk_score / 100.0) * 0.7) AS revenue_at_risk
FROM public.orders
GROUP BY user_id, category
ORDER BY revenue_at_risk DESC;
