-- supabase/migrations/001_init.sql
-- RevFlow SaaS Platform - Complete Database Schema

-- ============================================================
-- TABLE CREATION (ordered to satisfy FK constraints)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'internal', 'customer')) DEFAULT 'customer',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  price          NUMERIC(12,2) NOT NULL,
  billing_period TEXT CHECK (billing_period IN ('daily', 'weekly', 'monthly', 'yearly')),
  min_quantity   INT DEFAULT 1,
  start_date     DATE,
  end_date       DATE,
  options        JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute   TEXT NOT NULL,
  value       TEXT NOT NULL,
  extra_price NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT CHECK (type IN ('fixed', 'percentage')),
  value        NUMERIC(10,2) NOT NULL,
  min_purchase NUMERIC(12,2) DEFAULT 0,
  min_quantity INT DEFAULT 1,
  start_date   DATE,
  end_date     DATE,
  usage_limit  INT
);

CREATE TABLE IF NOT EXISTS taxes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  plan_id       UUID REFERENCES plans(id),
  status        TEXT CHECK (status IN ('draft', 'active', 'paused', 'closed')) DEFAULT 'draft',
  start_date    DATE,
  end_date      DATE,
  payment_terms TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id),
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL,
  tax             NUMERIC(5,2) DEFAULT 0,
  amount          NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax / 100)) STORED
);

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  total_amount    NUMERIC(12,2),
  tax_amount      NUMERIC(12,2),
  discount_amount NUMERIC(12,2) DEFAULT 0,
  final_amount    NUMERIC(12,2),
  status          TEXT CHECK (status IN ('draft', 'confirmed', 'paid')) DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity     INT NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  tax          NUMERIC(5,2) DEFAULT 0,
  amount       NUMERIC(12,2)
);

CREATE TABLE IF NOT EXISTS payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id           UUID REFERENCES invoices(id),
  amount               NUMERIC(12,2) NOT NULL,
  payment_method       TEXT DEFAULT 'razorpay',
  payment_date         TIMESTAMPTZ DEFAULT now(),
  status               TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  razorpay_signature   TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id     ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id     ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id  ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id       ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order   ON payments(razorpay_order_id);

-- ============================================================
-- RLS HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — users
-- ============================================================

DROP POLICY IF EXISTS "users_admin_select_all"    ON users;
DROP POLICY IF EXISTS "users_self_select"          ON users;
DROP POLICY IF EXISTS "users_admin_insert"         ON users;
DROP POLICY IF EXISTS "users_admin_update"         ON users;
DROP POLICY IF EXISTS "users_admin_delete"         ON users;
DROP POLICY IF EXISTS "users_self_update"          ON users;

CREATE POLICY "users_admin_select_all" ON users
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "users_self_select" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_admin_insert" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "users_admin_update" ON users
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "users_admin_delete" ON users
  FOR DELETE USING (get_user_role() = 'admin');

-- Allow users to update their own profile (non-role fields)
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid() AND get_user_role() != 'admin');

-- ============================================================
-- RLS POLICIES — products
-- ============================================================

DROP POLICY IF EXISTS "products_admin_all"      ON products;
DROP POLICY IF EXISTS "products_internal_select" ON products;
DROP POLICY IF EXISTS "products_customer_select" ON products;

CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "products_internal_select" ON products
  FOR SELECT USING (get_user_role() = 'internal');

CREATE POLICY "products_customer_select" ON products
  FOR SELECT USING (get_user_role() = 'customer');

-- ============================================================
-- RLS POLICIES — plans
-- ============================================================

DROP POLICY IF EXISTS "plans_admin_all"       ON plans;
DROP POLICY IF EXISTS "plans_internal_select"  ON plans;
DROP POLICY IF EXISTS "plans_customer_select"  ON plans;

CREATE POLICY "plans_admin_all" ON plans
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "plans_internal_select" ON plans
  FOR SELECT USING (get_user_role() = 'internal');

CREATE POLICY "plans_customer_select" ON plans
  FOR SELECT USING (get_user_role() = 'customer');

-- ============================================================
-- RLS POLICIES — product_variants
-- ============================================================

DROP POLICY IF EXISTS "variants_admin_all"       ON product_variants;
DROP POLICY IF EXISTS "variants_internal_select"  ON product_variants;
DROP POLICY IF EXISTS "variants_customer_select"  ON product_variants;

CREATE POLICY "variants_admin_all" ON product_variants
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "variants_internal_select" ON product_variants
  FOR SELECT USING (get_user_role() = 'internal');

CREATE POLICY "variants_customer_select" ON product_variants
  FOR SELECT USING (get_user_role() = 'customer');

-- ============================================================
-- RLS POLICIES — discounts
-- ============================================================

DROP POLICY IF EXISTS "discounts_admin_all"       ON discounts;
DROP POLICY IF EXISTS "discounts_internal_select"  ON discounts;
DROP POLICY IF EXISTS "discounts_customer_select"  ON discounts;

CREATE POLICY "discounts_admin_all" ON discounts
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "discounts_internal_select" ON discounts
  FOR SELECT USING (get_user_role() = 'internal');

CREATE POLICY "discounts_customer_select" ON discounts
  FOR SELECT USING (get_user_role() = 'customer');

-- ============================================================
-- RLS POLICIES — taxes
-- ============================================================

DROP POLICY IF EXISTS "taxes_admin_all"       ON taxes;
DROP POLICY IF EXISTS "taxes_internal_select"  ON taxes;
DROP POLICY IF EXISTS "taxes_customer_select"  ON taxes;

CREATE POLICY "taxes_admin_all" ON taxes
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "taxes_internal_select" ON taxes
  FOR SELECT USING (get_user_role() = 'internal');

CREATE POLICY "taxes_customer_select" ON taxes
  FOR SELECT USING (get_user_role() = 'customer');

-- ============================================================
-- RLS POLICIES — subscriptions
-- ============================================================

DROP POLICY IF EXISTS "subscriptions_admin_all"       ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_customer_select"  ON subscriptions;

CREATE POLICY "subscriptions_admin_all" ON subscriptions
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "subscriptions_customer_select" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "subscriptions_customer_insert" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid() AND get_user_role() = 'customer');

-- ============================================================
-- RLS POLICIES — subscription_items
-- ============================================================

DROP POLICY IF EXISTS "sub_items_admin_all"       ON subscription_items;
DROP POLICY IF EXISTS "sub_items_customer_select"  ON subscription_items;

CREATE POLICY "sub_items_admin_all" ON subscription_items
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "sub_items_customer_select" ON subscription_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_items.subscription_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES — invoices
-- ============================================================

DROP POLICY IF EXISTS "invoices_admin_all"       ON invoices;
DROP POLICY IF EXISTS "invoices_customer_select"  ON invoices;

CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "invoices_customer_select" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = invoices.subscription_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES — invoice_items
-- ============================================================

DROP POLICY IF EXISTS "inv_items_admin_all"       ON invoice_items;
DROP POLICY IF EXISTS "inv_items_customer_select"  ON invoice_items;

CREATE POLICY "inv_items_admin_all" ON invoice_items
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "inv_items_customer_select" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN subscriptions s ON s.id = i.subscription_id
      WHERE i.id = invoice_items.invoice_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES — payments
-- ============================================================

DROP POLICY IF EXISTS "payments_admin_all"       ON payments;
DROP POLICY IF EXISTS "payments_customer_select"  ON payments;

CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "payments_customer_select" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN subscriptions s ON s.id = i.subscription_id
      WHERE i.id = payments.invoice_id
        AND s.user_id = auth.uid()
    )
  );
