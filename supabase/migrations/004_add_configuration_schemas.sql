-- supabase/migrations/004_add_configuration_schemas.sql

-- 1. Attributes & Attribute Values
CREATE TABLE IF NOT EXISTS public.attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    default_extra_price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modify Plans for Recurring Plan configurations
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS closable BOOLEAN DEFAULT true;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS pausable BOOLEAN DEFAULT true;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS renew BOOLEAN DEFAULT true;

-- 3. Quotation Templates
CREATE TABLE IF NOT EXISTS public.quotation_templates (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT,
   quotation_validity INT,
   recurring_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
   lead_persona TEXT,
   end_after_months INT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotation_template_items (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   template_id UUID NOT NULL REFERENCES public.quotation_templates(id) ON DELETE CASCADE,
   product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
   description TEXT,
   quantity INT DEFAULT 1,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payment Terms
CREATE TABLE IF NOT EXISTS public.payment_terms (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT NOT NULL,
   due_days INT NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Discounts specific linkage
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS client_always BOOLEAN DEFAULT false;
ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS applies_to_all_products BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.discount_products (
  discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_id, product_id)
);

-- 6. Taxes Computation Changes
ALTER TABLE public.taxes ADD COLUMN IF NOT EXISTS computation_type TEXT DEFAULT 'percentage';

DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='taxes' and column_name='percentage')
  THEN
      ALTER TABLE public.taxes RENAME COLUMN percentage TO amount;
  END IF;
END $$;
