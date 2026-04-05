-- supabase/seed.sql
-- RevFlow SaaS Platform - Sample Data
-- ============================================================
-- IMPORTANT: Auth users (auth.users) are created via Supabase Auth,
-- not via direct SQL. These inserts are for the public.users table only.
-- To create actual login-capable users:
--   1. Go to Supabase Dashboard → Authentication → Users → Add User
--   2. Create users with these emails: admin@revflow.com, internal@revflow.com, customer@revflow.com
--   3. After Auth users are created, the IDs from auth.users must match the UUIDs below,
--      OR you can use a trigger to auto-insert into public.users on auth.users insert.
-- ============================================================

-- Use deterministic UUIDs for referential integrity
DO $$
DECLARE
  v_admin_id    UUID := '00000000-0000-0000-0000-000000000001';
  v_internal_id UUID := '00000000-0000-0000-0000-000000000002';
  v_customer_id UUID := '00000000-0000-0000-0000-000000000003';

  v_prod_basic  UUID := '10000000-0000-0000-0000-000000000001';
  v_prod_pro    UUID := '10000000-0000-0000-0000-000000000002';
  v_prod_team   UUID := '10000000-0000-0000-0000-000000000003';

  v_plan_basic_mo UUID := '20000000-0000-0000-0000-000000000001';
  v_plan_basic_yr UUID := '20000000-0000-0000-0000-000000000002';
  v_plan_pro_mo   UUID := '20000000-0000-0000-0000-000000000003';
  v_plan_pro_yr   UUID := '20000000-0000-0000-0000-000000000004';
  v_plan_team_mo  UUID := '20000000-0000-0000-0000-000000000005';
  v_plan_team_yr  UUID := '20000000-0000-0000-0000-000000000006';

  v_gst_id       UUID := '30000000-0000-0000-0000-000000000001';
  v_igst_id      UUID := '30000000-0000-0000-0000-000000000002';

  v_disc_welcome UUID := '40000000-0000-0000-0000-000000000001';
  v_disc_annual  UUID := '40000000-0000-0000-0000-000000000002';

  v_sub_id  UUID;
  v_inv_id  UUID;
BEGIN

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, name, email, role) VALUES
  (v_admin_id,    'RevFlow Admin',    'admin@revflow.com',    'admin'),
  (v_internal_id, 'Internal Staff',   'internal@revflow.com', 'internal'),
  (v_customer_id, 'Sample Customer',  'customer@revflow.com', 'customer')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS
-- ============================================================
INSERT INTO products (id, name, description, type, created_by) VALUES
  (v_prod_basic, 'Basic Plan',
   'Perfect for individuals and small teams just getting started.',
   'saas', v_admin_id),
  (v_prod_pro,   'Pro Plan',
   'For growing teams that need advanced features and priority support.',
   'saas', v_admin_id),
  (v_prod_team,  'Team Plan',
   'Enterprise-grade features for large organizations and teams.',
   'saas', v_admin_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PLANS
-- ============================================================
INSERT INTO plans (id, product_id, name, price, billing_period, min_quantity, options) VALUES
  -- Basic
  (v_plan_basic_mo, v_prod_basic, 'Basic Monthly', 9.00,   'monthly', 1, '{"auto_renew": true}'),
  (v_plan_basic_yr, v_prod_basic, 'Basic Yearly',  90.00,  'yearly',  1, '{"auto_renew": true}'),
  -- Pro
  (v_plan_pro_mo,   v_prod_pro,   'Pro Monthly',   29.00,  'monthly', 1, '{"auto_renew": true}'),
  (v_plan_pro_yr,   v_prod_pro,   'Pro Yearly',    290.00, 'yearly',  1, '{"auto_renew": true}'),
  -- Team
  (v_plan_team_mo,  v_prod_team,  'Team Monthly',  79.00,  'monthly', 1, '{"auto_renew": true}'),
  (v_plan_team_yr,  v_prod_team,  'Team Yearly',   790.00, 'yearly',  1, '{"auto_renew": true}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TAXES
-- ============================================================
INSERT INTO taxes (id, name, percentage) VALUES
  (v_gst_id,  'GST',  18.00),
  (v_igst_id, 'IGST',  5.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DISCOUNTS
-- ============================================================
INSERT INTO discounts (id, name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit) VALUES
  (v_disc_welcome, 'WELCOME10', 'percentage', 10.00, 0.00, 1, NULL, NULL, NULL),
  (v_disc_annual,  'ANNUAL20',  'percentage', 20.00, 0.00, 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE SUBSCRIPTION (customer on Pro Monthly)
-- ============================================================
INSERT INTO subscriptions (id, user_id, plan_id, status, start_date, end_date, payment_terms)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  v_customer_id,
  v_plan_pro_mo,
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  'immediate'
) ON CONFLICT (id) DO NOTHING;

-- Subscription item
INSERT INTO subscription_items (id, subscription_id, product_id, quantity, unit_price, tax)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  v_prod_pro,
  1,
  29.00,
  18.0
) ON CONFLICT (id) DO NOTHING;

-- Invoice
INSERT INTO invoices (
  id, subscription_id, total_amount, tax_amount,
  discount_amount, final_amount, status
) VALUES (
  '70000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  29.00,
  5.22,
  0.00,
  34.22,
  'paid'
) ON CONFLICT (id) DO NOTHING;

-- Invoice item
INSERT INTO invoice_items (id, invoice_id, product_name, quantity, unit_price, tax, amount)
VALUES (
  '80000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  'Pro Plan',
  1,
  29.00,
  18.0,
  34.22
) ON CONFLICT (id) DO NOTHING;

-- Payment
INSERT INTO payments (
  id, invoice_id, amount, payment_method,
  payment_date, status,
  razorpay_order_id, razorpay_payment_id, razorpay_signature
) VALUES (
  '90000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  34.22,
  'razorpay',
  now(),
  'success',
  'order_seed_demo_001',
  'pay_seed_demo_001',
  'sig_seed_demo_001'
) ON CONFLICT (id) DO NOTHING;

END $$;
