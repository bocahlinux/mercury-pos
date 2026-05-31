export interface User {
  id: number;
  email: string;
  role: 'owner' | 'admin' | 'kasir';
  phone?: string;
  avatar?: string;
  is_active: boolean;
  date_joined: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category?: number;
  category_name?: string;
  image?: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock_alert: number;
  unit: string;
  is_active: boolean;
}

export interface ProductVariant {
  id: number;
  product: number;
  name: string;
  sku: string;
  barcode?: string;
  additional_price: number;
  stock: number;
}

export interface StockMovement {
  id: number;
  product: number;
  variant?: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  invoice_number: string;
  customer?: number;
  customer_name?: string;
  cashier: number;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  product: number;
  product_name: string;
  variant?: number;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

export interface Invoice {
  id: number;
  transaction: number;
  invoice_number: string;
  status: string;
  issued_date: string;
  due_date?: string;
  notes?: string;
  pdf_file?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyalty_points: number;
  notes?: string;
  is_active: boolean;
  transaction_count: number;
  total_spent: number;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  tax_percent: number;
  currency: string;
  receipt_header?: string;
  receipt_footer?: string;
}

export interface DashboardData {
  today_sales: number;
  today_transactions: number;
  week_sales: number;
  month_sales: number;
  top_products: { product__name: string; total_sold: number; revenue: number }[];
  recent_transactions: {
    id: number;
    invoice_number: string;
    total: number;
    status: string;
    cashier: string;
    created_at: string;
  }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}