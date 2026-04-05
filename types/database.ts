// types/database.ts
// RevFlow SaaS Platform - Complete TypeScript Database Types

export type UserRole = 'admin' | 'internal' | 'customer';
export type BillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'draft' | 'active' | 'paused' | 'closed';
export type InvoiceStatus = 'draft' | 'confirmed' | 'paid';
export type PaymentStatus = 'pending' | 'success' | 'failed';
export type DiscountType = 'fixed' | 'percentage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  product_id: string;
  name: string;
  price: number;
  billing_period: BillingPeriod | null;
  min_quantity: number;
  start_date: string | null;
  end_date: string | null;
  options: Record<string, unknown>;
  closable: boolean | null;
  pausable: boolean | null;
  renew: boolean | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  attribute: string;
  value: string;
  extra_price: number;
}

export interface Discount {
  id: string;
  name: string;
  type: DiscountType | null;
  value: number;
  min_purchase: number;
  min_quantity: number;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  client_always: boolean | null;
  applies_to_all_products: boolean | null;
}

export interface DiscountProduct {
  discount_id: string;
  product_id: string;
}

export interface Tax {
  id: string;
  name: string;
  amount: number;
  computation_type: string | null;
}

export interface Attribute {
  id: string;
  name: string;
  created_at: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  default_extra_price: number | null;
  created_at: string;
}

export interface QuotationTemplate {
  id: string;
  name: string | null;
  quotation_validity: number | null;
  recurring_plan_id: string | null;
  lead_persona: string | null;
  end_after_months: number | null;
  created_at: string;
}

export interface QuotationTemplateItem {
  id: string;
  template_id: string;
  product_id: string | null;
  description: string | null;
  quantity: number | null;
  created_at: string;
}

export interface PaymentTerm {
  id: string;
  name: string;
  due_days: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: SubscriptionStatus;
  start_date: string | null;
  end_date: string | null;
  payment_terms: string | null;
  created_at: string;
}

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  tax: number;
  amount: number; // GENERATED ALWAYS AS STORED
}

export interface Invoice {
  id: string;
  subscription_id: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  discount_amount: number;
  final_amount: number | null;
  status: InvoiceStatus;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax: number;
  amount: number | null;
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
}

// ============================================================
// Supabase-compatible Database generic type
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      plans: {
        Row: Plan;
        Insert: {
          id?: string;
          product_id?: string;
          name: string;
          price: number;
          billing_period?: BillingPeriod | null;
          min_quantity?: number;
          start_date?: string | null;
          end_date?: string | null;
          options?: Json;
          closable?: boolean | null;
          pausable?: boolean | null;
          renew?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          price?: number;
          billing_period?: BillingPeriod | null;
          min_quantity?: number;
          start_date?: string | null;
          end_date?: string | null;
          options?: Json;
          closable?: boolean | null;
          pausable?: boolean | null;
          renew?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plans_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      product_variants: {
        Row: ProductVariant;
        Insert: {
          id?: string;
          product_id: string;
          attribute: string;
          value: string;
          extra_price?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          attribute?: string;
          value?: string;
          extra_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      discounts: {
        Row: Discount;
        Insert: {
          id?: string;
          name: string;
          type?: DiscountType | null;
          value: number;
          min_purchase?: number;
          min_quantity?: number;
          start_date?: string | null;
          end_date?: string | null;
          usage_limit?: number | null;
          client_always?: boolean | null;
          applies_to_all_products?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: DiscountType | null;
          value?: number;
          min_purchase?: number;
          min_quantity?: number;
          start_date?: string | null;
          end_date?: string | null;
          usage_limit?: number | null;
          client_always?: boolean | null;
          applies_to_all_products?: boolean | null;
        };
        Relationships: [];
      };
      taxes: {
        Row: Tax;
        Insert: {
          id?: string;
          name: string;
          amount: number;
          computation_type?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          computation_type?: string | null;
        };
        Relationships: [];
      };
      attributes: {
        Row: Attribute;
        Insert: { id?: string; name: string; created_at?: string; };
        Update: { id?: string; name?: string; created_at?: string; };
        Relationships: [];
      };
      attribute_values: {
        Row: AttributeValue;
        Insert: { id?: string; attribute_id: string; value: string; default_extra_price?: number | null; created_at?: string; };
        Update: { id?: string; attribute_id?: string; value?: string; default_extra_price?: number | null; created_at?: string; };
        Relationships: [{ foreignKeyName: 'attribute_values_attribute_id_fkey'; columns: ['attribute_id']; isOneToOne: false; referencedRelation: 'attributes'; referencedColumns: ['id']; }];
      };
      quotation_templates: {
        Row: QuotationTemplate;
        Insert: { id?: string; name?: string | null; quotation_validity?: number | null; recurring_plan_id?: string | null; lead_persona?: string | null; end_after_months?: number | null; created_at?: string; };
        Update: { id?: string; name?: string | null; quotation_validity?: number | null; recurring_plan_id?: string | null; lead_persona?: string | null; end_after_months?: number | null; created_at?: string; };
        Relationships: [{ foreignKeyName: 'quotation_templates_recurring_plan_id_fkey'; columns: ['recurring_plan_id']; isOneToOne: false; referencedRelation: 'plans'; referencedColumns: ['id']; }];
      };
      quotation_template_items: {
        Row: QuotationTemplateItem;
        Insert: { id?: string; template_id: string; product_id?: string | null; description?: string | null; quantity?: number | null; created_at?: string; };
        Update: { id?: string; template_id?: string; product_id?: string | null; description?: string | null; quantity?: number | null; created_at?: string; };
        Relationships: [
          { foreignKeyName: 'qti_template_id_fkey'; columns: ['template_id']; isOneToOne: false; referencedRelation: 'quotation_templates'; referencedColumns: ['id']; },
          { foreignKeyName: 'qti_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id']; }
        ];
      };
      payment_terms: {
        Row: PaymentTerm;
        Insert: { id?: string; name: string; due_days: number; created_at?: string; };
        Update: { id?: string; name?: string; due_days?: number; created_at?: string; };
        Relationships: [];
      };
      discount_products: {
        Row: DiscountProduct;
        Insert: { discount_id: string; product_id: string; };
        Update: { discount_id?: string; product_id?: string; };
        Relationships: [
          { foreignKeyName: 'dp_discount_id_fkey'; columns: ['discount_id']; isOneToOne: false; referencedRelation: 'discounts'; referencedColumns: ['id']; },
          { foreignKeyName: 'dp_product_id_fkey'; columns: ['product_id']; isOneToOne: false; referencedRelation: 'products'; referencedColumns: ['id']; }
        ];
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          id?: string;
          user_id?: string | null;
          plan_id?: string | null;
          status?: SubscriptionStatus;
          start_date?: string | null;
          end_date?: string | null;
          payment_terms?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          plan_id?: string | null;
          status?: SubscriptionStatus;
          start_date?: string | null;
          end_date?: string | null;
          payment_terms?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          }
        ];
      };
      subscription_items: {
        Row: SubscriptionItem;
        Insert: {
          id?: string;
          subscription_id: string;
          product_id?: string | null;
          quantity?: number;
          unit_price: number;
          tax?: number;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number;
          tax?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'subscription_items_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          }
        ];
      };
      invoices: {
        Row: Invoice;
        Insert: {
          id?: string;
          subscription_id?: string | null;
          total_amount?: number | null;
          tax_amount?: number | null;
          discount_amount?: number;
          final_amount?: number | null;
          status?: InvoiceStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string | null;
          total_amount?: number | null;
          tax_amount?: number | null;
          discount_amount?: number;
          final_amount?: number | null;
          status?: InvoiceStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          }
        ];
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: {
          id?: string;
          invoice_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          tax?: number;
          amount?: number | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          tax?: number;
          amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          }
        ];
      };
      payments: {
        Row: Payment;
        Insert: {
          id?: string;
          invoice_id?: string | null;
          amount: number;
          payment_method?: string;
          payment_date?: string;
          status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
        };
        Update: {
          id?: string;
          invoice_id?: string | null;
          amount?: number;
          payment_method?: string;
          payment_date?: string;
          status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      create_subscription: {
        Args: {
          p_user_id: string;
          p_plan_id: string;
          p_quantity: number;
          p_start_date: string;
        };
        Returns: string;
      };
      create_invoice_for_subscription: {
        Args: { p_subscription_id: string };
        Returns: string;
      };
      apply_discount_to_invoice: {
        Args: { p_invoice_id: string; p_discount_id: string };
        Returns: number;
      };
      confirm_invoice: {
        Args: { p_invoice_id: string };
        Returns: Invoice;
      };
      create_razorpay_order: {
        Args: { p_invoice_id: string };
        Returns: Json;
      };
      verify_and_activate: {
        Args: {
          p_payment_id: string;
          p_razorpay_payment_id: string;
          p_razorpay_order_id: string;
          p_razorpay_signature: string;
        };
        Returns: Json;
      };
      generate_renewal_invoice: {
        Args: { p_subscription_id: string };
        Returns: string | null;
      };
      get_total_revenue: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_active_subscriptions_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_pending_invoices: {
        Args: Record<PropertyKey, never>;
        Returns: Invoice[];
      };
      get_monthly_revenue: {
        Args: { p_year: number };
        Returns: Array<{ month: number; revenue: number }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ============================================================
// Extended types with joined data (for UI use)
// ============================================================

export interface ProductWithPlans extends Product {
  plans: Plan[];
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan & { product: Product };
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
  subscription: Subscription;
}

export interface PaymentWithInvoice extends Payment {
  invoice: Invoice;
}
