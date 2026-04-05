-- supabase/functions/rpc.sql
-- RevFlow SaaS Platform - PostgreSQL RPC Functions

-- ============================================================
-- 1. create_subscription
-- ============================================================

CREATE OR REPLACE FUNCTION create_subscription(
  p_user_id   UUID,
  p_plan_id   UUID,
  p_quantity  INT,
  p_start_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_invoice_id      UUID;
  v_plan            plans%ROWTYPE;
  v_product         products%ROWTYPE;
BEGIN
  -- Fetch plan details
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found: %', p_plan_id;
  END IF;

  -- Fetch product details
  SELECT * INTO v_product FROM products WHERE id = v_plan.product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found for plan: %', p_plan_id;
  END IF;

  -- Insert subscription
  INSERT INTO subscriptions (user_id, plan_id, status, start_date, payment_terms)
  VALUES (p_user_id, p_plan_id, 'draft', p_start_date, 'immediate')
  RETURNING id INTO v_subscription_id;

  -- Insert subscription item
  INSERT INTO subscription_items (subscription_id, product_id, quantity, unit_price, tax)
  VALUES (v_subscription_id, v_plan.product_id, p_quantity, v_plan.price, 18.0);

  -- Create invoice
  v_invoice_id := create_invoice_for_subscription(v_subscription_id);

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. create_invoice_for_subscription
-- ============================================================

CREATE OR REPLACE FUNCTION create_invoice_for_subscription(
  p_subscription_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_subtotal   NUMERIC(12,2) := 0;
  v_tax_amount NUMERIC(12,2) := 0;
  v_final      NUMERIC(12,2) := 0;
  v_item       RECORD;
  v_product    products%ROWTYPE;
  v_item_amount NUMERIC(12,2);
  v_item_tax    NUMERIC(12,2);
BEGIN
  -- Compute totals from subscription_items
  FOR v_item IN
    SELECT si.*, p.name AS product_name
    FROM subscription_items si
    JOIN products p ON p.id = si.product_id
    WHERE si.subscription_id = p_subscription_id
  LOOP
    v_item_amount  := v_item.quantity * v_item.unit_price;
    v_item_tax     := v_item_amount * (v_item.tax / 100);
    v_subtotal     := v_subtotal + v_item_amount;
    v_tax_amount   := v_tax_amount + v_item_tax;
  END LOOP;

  v_final := v_subtotal + v_tax_amount;

  -- Insert invoice
  INSERT INTO invoices (
    subscription_id, total_amount, tax_amount,
    discount_amount, final_amount, status
  ) VALUES (
    p_subscription_id, v_subtotal, v_tax_amount,
    0, v_final, 'draft'
  )
  RETURNING id INTO v_invoice_id;

  -- Insert invoice items
  FOR v_item IN
    SELECT si.*, p.name AS product_name
    FROM subscription_items si
    JOIN products p ON p.id = si.product_id
    WHERE si.subscription_id = p_subscription_id
  LOOP
    INSERT INTO invoice_items (
      invoice_id, product_name, quantity,
      unit_price, tax, amount
    ) VALUES (
      v_invoice_id,
      v_item.product_name,
      v_item.quantity,
      v_item.unit_price,
      v_item.tax,
      v_item.amount
    );
  END LOOP;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. apply_discount_to_invoice
-- ============================================================

CREATE OR REPLACE FUNCTION apply_discount_to_invoice(
  p_invoice_id  UUID,
  p_discount_id UUID
)
RETURNS NUMERIC(12,2) AS $$
DECLARE
  v_discount     discounts%ROWTYPE;
  v_invoice      invoices%ROWTYPE;
  v_discount_amt NUMERIC(12,2);
  v_new_final    NUMERIC(12,2);
BEGIN
  -- Fetch discount
  SELECT * INTO v_discount FROM discounts WHERE id = p_discount_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount not found: %', p_discount_id;
  END IF;

  -- Fetch invoice
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
  END IF;

  -- Validate discount date range
  IF v_discount.start_date IS NOT NULL AND CURRENT_DATE < v_discount.start_date THEN
    RAISE EXCEPTION 'Discount is not yet valid';
  END IF;
  IF v_discount.end_date IS NOT NULL AND CURRENT_DATE > v_discount.end_date THEN
    RAISE EXCEPTION 'Discount has expired';
  END IF;

  -- Validate usage_limit (count existing invoices that used this discount)
  IF v_discount.usage_limit IS NOT NULL THEN
    DECLARE
      v_usage INT;
    BEGIN
      -- A real implementation would track usage in a separate table; 
      -- here we check via a simple heuristic (placeholder for tracking table)
      v_usage := 0;
      IF v_usage >= v_discount.usage_limit THEN
        RAISE EXCEPTION 'Discount usage limit reached';
      END IF;
    END;
  END IF;

  -- Validate minimum purchase
  IF v_invoice.total_amount < v_discount.min_purchase THEN
    RAISE EXCEPTION 'Invoice total does not meet minimum purchase requirement';
  END IF;

  -- Calculate discount amount
  IF v_discount.type = 'percentage' THEN
    v_discount_amt := ROUND((v_discount.value / 100) * v_invoice.total_amount, 2);
  ELSE
    v_discount_amt := v_discount.value;
  END IF;

  -- Ensure discount doesn't exceed final amount
  v_discount_amt := LEAST(v_discount_amt, v_invoice.final_amount);
  v_new_final    := v_invoice.final_amount - v_discount_amt;

  -- Update invoice
  UPDATE invoices
  SET discount_amount = v_discount_amt,
      final_amount    = v_new_final
  WHERE id = p_invoice_id;

  RETURN v_new_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. confirm_invoice
-- ============================================================

CREATE OR REPLACE FUNCTION confirm_invoice(p_invoice_id UUID)
RETURNS invoices AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
BEGIN
  UPDATE invoices
  SET status = 'confirmed'
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
  END IF;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. create_razorpay_order
-- ============================================================

CREATE OR REPLACE FUNCTION create_razorpay_order(p_invoice_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invoice    invoices%ROWTYPE;
  v_payment_id UUID;
  v_amount_paise BIGINT;
BEGIN
  -- Fetch invoice
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
  END IF;

  -- Convert to paise (INR smallest unit): 1 INR = 100 paise
  v_amount_paise := (v_invoice.final_amount * 100)::BIGINT;

  -- Insert pending payment record
  INSERT INTO payments (invoice_id, amount, payment_method, status)
  VALUES (p_invoice_id, v_invoice.final_amount, 'razorpay', 'pending')
  RETURNING id INTO v_payment_id;

  RETURN json_build_object(
    'payment_id',     v_payment_id,
    'amount_in_paise', v_amount_paise,
    'invoice_id',     p_invoice_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. verify_and_activate
-- ============================================================

CREATE OR REPLACE FUNCTION verify_and_activate(
  p_payment_id          UUID,
  p_razorpay_payment_id TEXT,
  p_razorpay_order_id   TEXT,
  p_razorpay_signature  TEXT
)
RETURNS JSON AS $$
DECLARE
  v_payment        payments%ROWTYPE;
  v_invoice        invoices%ROWTYPE;
  v_subscription   subscriptions%ROWTYPE;
  v_plan           plans%ROWTYPE;
  v_end_date       DATE;
BEGIN
  -- Fetch payment
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  -- Fetch invoice
  SELECT * INTO v_invoice FROM invoices WHERE id = v_payment.invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found for payment: %', p_payment_id;
  END IF;

  -- Fetch subscription
  SELECT * INTO v_subscription FROM subscriptions WHERE id = v_invoice.subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found for invoice: %', v_invoice.id;
  END IF;

  -- Fetch plan for billing period
  SELECT * INTO v_plan FROM plans WHERE id = v_subscription.plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found for subscription: %', v_subscription.id;
  END IF;

  -- Compute end_date based on billing_period
  CASE v_plan.billing_period
    WHEN 'daily'   THEN v_end_date := CURRENT_DATE + INTERVAL '1 day';
    WHEN 'weekly'  THEN v_end_date := CURRENT_DATE + INTERVAL '7 days';
    WHEN 'monthly' THEN v_end_date := CURRENT_DATE + INTERVAL '1 month';
    WHEN 'yearly'  THEN v_end_date := CURRENT_DATE + INTERVAL '1 year';
    ELSE v_end_date := CURRENT_DATE + INTERVAL '1 month';
  END CASE;

  -- Update payment: mark success
  UPDATE payments
  SET razorpay_payment_id = p_razorpay_payment_id,
      razorpay_order_id   = p_razorpay_order_id,
      razorpay_signature  = p_razorpay_signature,
      status              = 'success',
      payment_date        = now()
  WHERE id = p_payment_id;

  -- Update invoice: mark paid
  UPDATE invoices
  SET status = 'paid'
  WHERE id = v_invoice.id;

  -- Update subscription: mark active
  UPDATE subscriptions
  SET status     = 'active',
      start_date = CURRENT_DATE,
      end_date   = v_end_date
  WHERE id = v_subscription.id;

  RETURN json_build_object(
    'subscription_id', v_subscription.id,
    'status',          'active',
    'end_date',        v_end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. generate_renewal_invoice
-- ============================================================

CREATE OR REPLACE FUNCTION generate_renewal_invoice(p_subscription_id UUID)
RETURNS UUID AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan         plans%ROWTYPE;
  v_invoice_id   UUID;
  v_new_end_date DATE;
BEGIN
  SELECT * INTO v_subscription FROM subscriptions WHERE id = p_subscription_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;

  -- Check if within 3 days of end
  IF v_subscription.end_date > CURRENT_DATE + INTERVAL '3 days' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = v_subscription.plan_id;

  -- Check auto_renew flag
  IF (v_plan.options->>'auto_renew')::TEXT != 'true' THEN
    RETURN NULL;
  END IF;

  -- Create renewal invoice
  v_invoice_id := create_invoice_for_subscription(p_subscription_id);

  -- Extend subscription end_date by billing_period
  CASE v_plan.billing_period
    WHEN 'daily'   THEN v_new_end_date := v_subscription.end_date + INTERVAL '1 day';
    WHEN 'weekly'  THEN v_new_end_date := v_subscription.end_date + INTERVAL '7 days';
    WHEN 'monthly' THEN v_new_end_date := v_subscription.end_date + INTERVAL '1 month';
    WHEN 'yearly'  THEN v_new_end_date := v_subscription.end_date + INTERVAL '1 year';
    ELSE v_new_end_date := v_subscription.end_date + INTERVAL '1 month';
  END CASE;

  UPDATE subscriptions
  SET end_date = v_new_end_date
  WHERE id = p_subscription_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. get_total_revenue
-- ============================================================

CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success';
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 9. get_active_subscriptions_count
-- ============================================================

CREATE OR REPLACE FUNCTION get_active_subscriptions_count()
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM subscriptions WHERE status = 'active';
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 10. get_pending_invoices
-- ============================================================

CREATE OR REPLACE FUNCTION get_pending_invoices()
RETURNS SETOF invoices AS $$
  SELECT * FROM invoices WHERE status IN ('draft', 'confirmed') ORDER BY created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 11. get_monthly_revenue
-- ============================================================

CREATE OR REPLACE FUNCTION get_monthly_revenue(p_year INT)
RETURNS TABLE(month INT, revenue NUMERIC) AS $$
  SELECT
    EXTRACT(MONTH FROM payment_date)::INT AS month,
    COALESCE(SUM(amount), 0)             AS revenue
  FROM payments
  WHERE status = 'success'
    AND EXTRACT(YEAR FROM payment_date) = p_year
  GROUP BY EXTRACT(MONTH FROM payment_date)
  ORDER BY month;
$$ LANGUAGE sql SECURITY DEFINER;
