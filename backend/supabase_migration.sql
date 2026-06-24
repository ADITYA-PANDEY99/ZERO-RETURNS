-- ===========================================================================
-- Supabase PostgreSQL Star Schema & pgvector Migration Script
-- ===========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS product_embeddings;
DROP TABLE IF EXISTS customer_features;
DROP TABLE IF EXISTS seller_features;
DROP TABLE IF EXISTS orders;

-- 3. Create Fact Table: orders
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    customer_name TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    returned INTEGER DEFAULT 0,
    review_score REAL DEFAULT 4.0,
    seller_rating REAL DEFAULT 4.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Dimension Table: customer_features
CREATE TABLE customer_features (
    customer_id TEXT PRIMARY KEY,
    total_orders INTEGER DEFAULT 0,
    total_returns INTEGER DEFAULT 0,
    return_ratio REAL DEFAULT 0.0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Dimension Table: seller_features
CREATE TABLE seller_features (
    seller_name TEXT PRIMARY KEY,
    total_orders INTEGER DEFAULT 0,
    total_returns INTEGER DEFAULT 0,
    risk_score REAL DEFAULT 0.0,
    rating REAL DEFAULT 4.0
);

-- 6. Create Vector Store Table (pgvector architecture)
CREATE TABLE product_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    category TEXT,
    embedding vector(384), -- Standard dimension for lightweight embeddings (MiniLM-L6-v2)
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Performance Optimized Indexes for Analytics & RAG
CREATE INDEX idx_orders_category ON orders(category);
CREATE INDEX idx_orders_returned ON orders(returned);
CREATE INDEX idx_orders_seller ON orders(seller_name);
CREATE INDEX idx_embeddings_product ON product_embeddings(product_id);
-- HNSW Vector index for fast approximate nearest neighbor search
CREATE INDEX idx_product_embeddings_vector ON product_embeddings USING hnsw (embedding vector_cosine_ops);

-- 8. Hardening: Row Level Security (RLS) Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;

-- Select policies for guest/read-only recruiter access (no auth needed for demo mode)
CREATE POLICY select_orders_policy ON orders FOR SELECT USING (true);
CREATE POLICY select_customer_policy ON customer_features FOR SELECT USING (true);
CREATE POLICY select_seller_policy ON seller_features FOR SELECT USING (true);
CREATE POLICY select_embeddings_policy ON product_embeddings FOR SELECT USING (true);

-- Restrictive insert/update/delete write policies
CREATE POLICY write_orders_policy ON orders FOR ALL USING (
    auth.role() = 'service_role'
);
CREATE POLICY write_customer_policy ON customer_features FOR ALL USING (
    auth.role() = 'service_role'
);
CREATE POLICY write_seller_policy ON seller_features FOR ALL USING (
    auth.role() = 'service_role'
);
CREATE POLICY write_embeddings_policy ON product_embeddings FOR ALL USING (
    auth.role() = 'service_role'
);
