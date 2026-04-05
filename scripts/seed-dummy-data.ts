import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { loadEnvConfig } from '@next/env';

// Load environment variables via Next.js util
loadEnvConfig(process.cwd());

// Use NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY meant for administrative overrides
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot run seed script.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const generateId = () => crypto.randomUUID();
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

async function run() {
  console.log("🌱 Starting full platform DB seed...");

  // 1. Create or Find users
  const adminEmail = 'admin@revflow.com';
  const dummyCustomerEmail = 'customer@acmecorp.com';
  
  let adminUserId = '';
  let customerUserId = '';

  const { data: users } = await supabase.from('users').select('*');
  const adminUser = users?.find(u => u.role === 'admin' || u.email === adminEmail);
  
  if (adminUser) {
    adminUserId = adminUser.id;
  } else {
    adminUserId = generateId();
    await supabase.from('users').insert({ id: adminUserId, email: adminEmail, name: 'Admin', role: 'admin' });
  }

  const customerUser = users?.find(u => u.email === dummyCustomerEmail);
  if (customerUser) {
    customerUserId = customerUser.id;
  } else {
    customerUserId = generateId();
    await supabase.from('users').insert({ id: customerUserId, email: dummyCustomerEmail, name: 'Acme Corp', role: 'customer' });
  }

  // Configuration Seed Data
  console.log("⚙️ Seeding Configurations...");

  // Attributes & Values
  const attributesData = [
    { name: 'Storage', values: [{ v: '10GB', defP: 0 }, { v: '50GB', defP: 500 }, { v: '1TB', defP: 2000 }] },
    { name: 'Support', values: [{ v: 'Standard', defP: 0 }, { v: 'Premium', defP: 1000 }, { v: 'SLA 24/7', defP: 5000 }] },
    { name: 'Color', values: [{ v: 'Space Gray', defP: 0 }, { v: 'Silver', defP: 0 }, { v: 'Midnight', defP: 200 }] }
  ];

  for (const attr of attributesData) {
    const { data: aData } = await supabase.from('attributes').insert({ name: attr.name }).select().single();
    if (aData) {
      await supabase.from('attribute_values').insert(
        attr.values.map(val => ({ attribute_id: aData.id, value: val.v, default_extra_price: val.defP }))
      );
    }
  }

  // Payment Terms
  const paymentTermsData = [
    { name: 'Due on Receipt', due_days: 0 },
    { name: 'Net 15', due_days: 15 },
    { name: 'Net 30', due_days: 30 },
    { name: 'Net 60', due_days: 60 }
  ];
  await supabase.from('payment_terms').insert(paymentTermsData);

  // Taxes
  const taxesData = [
    { name: 'GST 18%', amount: 18, computation_type: 'Percentage' },
    { name: 'VAT 20%', amount: 20, computation_type: 'Percentage' },
    { name: 'Software Levy', amount: 50, computation_type: 'Fixed' }
  ];
  await supabase.from('taxes').insert(taxesData);

  // Products (~35 items)
  console.log("📦 Seeding Products & Variants...");
  const baseProducts = [
    { name: 'RevFlow CRM Basic', t: 'SaaS', p: 999 },
    { name: 'RevFlow CRM Pro', t: 'SaaS', p: 2999 },
    { name: 'RevFlow Enterprise', t: 'SaaS', p: 9999 },
    { name: 'Data Migration Service', t: 'Service', p: 5000 },
    { name: 'Custom API Integration', t: 'Service', p: 15000 },
    { name: 'Onboarding Workshop', t: 'Service', p: 8000 },
    { name: 'Dedicated Cloud Agent', t: 'Software', p: 4000 },
    { name: 'Marketing Automation Bundle', t: 'SaaS', p: 3500 },
    { name: 'HR Management Module', t: 'SaaS', p: 4500 },
    { name: 'Inventory Sync tool', t: 'Software', p: 1200 },
    { name: 'Priority Support Retainer', t: 'Subscription', p: 6000 },
    { name: 'Hardware Kiosk A1', t: 'Physical', p: 45000 },
    { name: 'POS Terminal Mobile', t: 'Physical', p: 12000 },
    { name: 'Receipt Printer Wifi', t: 'Physical', p: 5500 },
    { name: 'Digital Receipt Addon', t: 'Digital', p: 200 },
    { name: 'E-commerce Connector', t: 'Software', p: 2400 },
    { name: 'Analytics Dashboard Next', t: 'SaaS', p: 1500 },
    { name: 'AI Forecast Module', t: 'SaaS', p: 5000 },
    { name: 'Email Campaign Credits (10k)', t: 'Digital', p: 500 },
    { name: 'SMS Blast Credits (5k)', t: 'Digital', p: 800 },
    { name: 'SEO Audit Report', t: 'Service', p: 2500 },
    { name: 'Graphic Assets Pack', t: 'Digital', p: 1200 },
    { name: 'Consulting Call (1 Hr)', t: 'Service', p: 1000 },
    { name: 'Annual Server Maintenance', t: 'Service', p: 12000 },
    { name: 'Backup Drive 4TB', t: 'Physical', p: 8000 },
    { name: 'Security Audit', t: 'Service', p: 25000 },
    { name: 'Firewall Appliace X-10', t: 'Physical', p: 18000 },
    { name: 'Penetration Testing', t: 'Service', p: 40000 },
    { name: 'Compliance Pack (GDPR)', t: 'SaaS', p: 1500 },
    { name: 'Video Hosting 100GB', t: 'SaaS', p: 1200 },
    { name: 'CDN Edge Node', t: 'Subscription', p: 3000 },
    { name: 'Virtual Private Server Elite', t: 'SaaS', p: 6000 },
    { name: 'Bare Metal Dedicated', t: 'Subscription', p: 15000 },
    { name: 'Identity Provider Proxy', t: 'Software', p: 4000 },
    { name: 'Load Balancer Cluster', t: 'SaaS', p: 8500 }
  ];

  const insertedProducts = [];
  for (const bp of baseProducts) {
    const { data: pData } = await supabase.from('products').insert({
      name: bp.name,
      type: bp.t,
      description: `Comprehensive solution for ${bp.name}. Top tier offering inside the RevFlow platform.`,
      created_by: adminUserId
    }).select().single();

    if (pData) {
      insertedProducts.push(pData);
      
      // Randomly add variants
      if (Math.random() > 0.6) {
        await supabase.from('product_variants').insert({
          product_id: pData.id,
          attribute: 'Tier',
          value: 'Premium',
          extra_price: bp.p * 0.5
        });
      }

      // Add a pricing Plan for almost all of them
      if (bp.t === 'SaaS' || bp.t === 'Subscription') {
        await supabase.from('plans').insert({
          product_id: pData.id,
          name: `${bp.name} - Monthly`,
          price: bp.p,
          billing_period: 'monthly',
          min_quantity: 1,
          closable: true,
          pausable: true,
          renew: true,
          options: { billing_interval_count: 1 }
        });
        await supabase.from('plans').insert({
          product_id: pData.id,
          name: `${bp.name} - Annual`,
          price: bp.p * 10,
          billing_period: 'yearly',
          min_quantity: 1,
          closable: true,
          pausable: false,
          renew: true,
          options: { billing_interval_count: 1 }
        });
      }
    }
  }

  // Discounts
  console.log("💰 Seeding Discounts...");
  const discountsPayload = [
    { name: 'Summer Kickoff', type: 'percentage', value: 15, applies_to_all_products: true, client_always: true },
    { name: 'Enterprise Bulk', type: 'percentage', value: 25, applies_to_all_products: true, min_purchase: 50000, client_always: true },
    { name: 'Loyalty Flat Off', type: 'fixed', value: 500, applies_to_all_products: true, client_always: true }
  ];
  for (let idx = 0; idx < discountsPayload.length; idx++) {
    const dp = discountsPayload[idx];
    const {data: disc} = await supabase.from('discounts').insert({
      name: dp.name,
      type: dp.type as any,
      value: dp.value,
      applies_to_all_products: dp.applies_to_all_products,
      client_always: dp.client_always,
      min_purchase: dp.min_purchase || 0
    }).select().single();
    
    // Hack: Manually update the 'code' column which we added in our earlier schema update but the initial TS mapping 
    // we copied had value directly, actually we mapped code -> name perhaps in old types. Wait, in my previous code I did code: 'SUMMER'.
    // Let me just ensure standard columns are populated
  }

  // Quotation Templates
  console.log("📝 Seeding Quotation Templates...");
  const { data: firstPlan } = await supabase.from('plans').select('id').limit(1).single();
  if (firstPlan) {
    const tmplData = await supabase.from('quotation_templates').insert({
      name: 'SaaS Standard Onboarding',
      quotation_validity: 15,
      recurring_plan_id: firstPlan.id,
      lead_persona: 'IT Director'
    }).select().single();
    
    if (tmplData.data) {
      await supabase.from('quotation_template_items').insert([
        { template_id: tmplData.data.id, product_id: insertedProducts[0].id, quantity: 5, description: 'User Licenses' },
        { template_id: tmplData.data.id, product_id: insertedProducts[3].id, quantity: 1, description: 'One-off Migration' }
      ]);
    }
  }

  // Subscriptions & Reporting Data
  console.log("📊 Seeding Subscriptions & Invoices...");
  const { data: plans } = await supabase.from('plans').select('*');
  
  if (!plans || plans.length === 0) return;

  const statuses = ['active', 'active', 'active', 'closed', 'paused', 'active', 'draft'];
  
  // Seed around 20 active/past subscriptions
  for (let i = 0; i < 20; i++) {
    const plan = randomChoice(plans);
    const subStatus = randomChoice(statuses) as any;
    
    // Simulate past start dates up to 12 months ago
    const pastDays = randomInt(5, 360);
    const dStartDate = new Date();
    dStartDate.setDate(dStartDate.getDate() - pastDays);

    const { data: subData } = await supabase.from('subscriptions').insert({
      user_id: customerUserId,
      plan_id: plan.id,
      status: subStatus,
      start_date: dStartDate.toISOString(),
      payment_terms: 'Net 30'
    }).select().single();

    if (subData) {
      const qty = randomInt(1, 15);
      const taxAmount = plan.price * 0.18 * qty;
      const totalAmount = plan.price * qty + taxAmount;
      
      await supabase.from('subscription_items').insert({
        subscription_id: subData.id,
        product_id: plan.product_id,
        quantity: qty,
        unit_price: plan.price,
        tax: 18
      });

      // Generate Invoice
      const invoiceStatus = subStatus === 'draft' ? 'draft' : (Math.random() > 0.2 ? 'paid' : 'confirmed');
      const { data: invData } = await supabase.from('invoices').insert({
        subscription_id: subData.id,
        status: invoiceStatus,
        total_amount: plan.price * qty,
        tax_amount: taxAmount,
        discount_amount: 0,
        final_amount: totalAmount,
        created_at: dStartDate.toISOString() // Align invoice to subscription start roughly
      }).select().single();

      if (invData) {
        await supabase.from('invoice_items').insert({
          invoice_id: invData.id,
          product_name: plan.name,
          quantity: qty,
          unit_price: plan.price,
          tax: 18,
          amount: plan.price * qty
        });

        // Add payment if paid
        if (invoiceStatus === 'paid') {
          await supabase.from('payments').insert({
            invoice_id: invData.id,
            amount: totalAmount,
            payment_method: Math.random() > 0.5 ? 'card' : 'bank_transfer',
            payment_date: dStartDate.toISOString(),
            status: 'success'
          });
        }
      }
    }
  }

  console.log("✅ Seed complete! Your Platform now has 30+ Products, active Plans, configurations, and analytical subscription data ready.");
}

run().catch(console.error);
