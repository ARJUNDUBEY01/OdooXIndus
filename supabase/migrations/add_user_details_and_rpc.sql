-- ============================================================
-- RevFlow ERP: Database Migration & Function Setup
-- Run this in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Add User Contact Fields
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India';

-- 2. Create/Update Invoice Generation Function
-- This function creates an invoice and line items from a subscription
CREATE OR REPLACE FUNCTION public.create_invoice_for_subscription(p_subscription_id uuid)
RETURNS uuid AS $$
DECLARE
  v_invoice_id uuid;
  v_plan_id uuid;
  v_plan_name text;
  v_plan_price decimal;
  v_product_name text;
  v_tax_pct decimal := 18.0; -- Default 18%
BEGIN
  -- Get plan and product info
  SELECT s.plan_id, p.name, p.price, pr.name
  INTO v_plan_id, v_plan_name, v_plan_price, v_product_name
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  JOIN public.products pr ON p.product_id = pr.id
  WHERE s.id = p_subscription_id;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Subscription plan not found';
  END IF;

  -- Create Invoice Header
  INSERT INTO public.invoices (
    subscription_id, 
    status, 
    total_amount, 
    tax_amount, 
    final_amount
  ) VALUES (
    p_subscription_id, 
    'draft', 
    v_plan_price, 
    (v_plan_price * v_tax_pct / 100), 
    (v_plan_price * (1 + v_tax_pct / 100))
  ) RETURNING id INTO v_invoice_id;

  -- Create Invoice Item
  INSERT INTO public.invoice_items (
    invoice_id, 
    product_name, 
    quantity, 
    unit_price, 
    tax, 
    amount
  ) VALUES (
    v_invoice_id, 
    v_product_name || ' (' || v_plan_name || ')', 
    1, 
    v_plan_price, 
    v_tax_pct, 
    v_plan_price
  );

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
