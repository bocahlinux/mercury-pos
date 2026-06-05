# Mercury POS — Product Requirements Document

> **Version**: 1.0  
> **Date**: June 2026  
> **Author**: OWL (AI) + Yudha (Product Owner)  
> **License**: MIT (Open Source)  
> **Repo**: https://github.com/bocahlinux/mercury-pos

---

## 1. Overview

### 1.1 Tujuan

Mercury POS adalah aplikasi **Point of Sale & Invoice** open-source yang dibangun dari nol untuk menggantikan solusi POS mahal seperti Moka, Majoo, atau iSeller. Target utamanya: **UKM, toko retail, kios, dan usaha kecil-menengah** di Indonesia.

### 1.2 Masalah yang Diselesaikan

- POS komersial mahal (Rp 100-300rb+/bulan subscription)
- Fitur yang tidak semuanya dipakai UKM
- Vendor lock-in, data tidak dimiliki sendiri
- Butuh solusi offline-first yang gratis

### 1.3 Solusi

Aplikasi POS gratis, open-source, self-hosted dengan fitur lengkap:
- Backend: Django REST Framework (Python)
- Web App: React + TypeScript (untuk kasir di desktop/browser)
- Mobile App: Flutter (untuk kasir di tablet/HP)

### 1.4 Target Pengguna

| Tipe | Kebutuhan |
|---|---|
| **Owner** | Lihat laporan, atur toko, kelola user |
| **Admin** | Kelola produk, lihat transaksi, atur diskon |
| **Kasir** | Jalankan POS, proses pembayaran, cetak struk |

---

## 2. Technical Stack

### 2.1 Backend
| Komponen | Teknologi |
|---|---|
| Framework | Django 4.2 + Django REST Framework 3.14 |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | SQLite (dev) → PostgreSQL (prod) |
| API Style | RESTful dengan trailing slashes |
| CORS | django-cors-headers |
| API Docs | drf-spectacular (Swagger + ReDoc) |
| PDF | reportlab |
| Excel Export | openpyxl |
| Barcode | python-barcode |
| Pillow | ImageField handling |
| Production Server | gunicorn + whitenoise |

### 2.2 Web Frontend
| Komponen | Teknologi |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| State Management | Zustand (auth) + React Query (server state) |
| HTTP Client | Axios (dengan JWT interceptor) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |

### 2.3 Mobile App
| Komponen | Teknologi |
|---|---|
| Framework | Flutter 3.x (Android + iOS) |
| State Management | Provider |
| HTTP Client | Dio (dengan JWT interceptor) |
| Auth Storage | Flutter Secure Storage |

---

## 3. User Roles & Permissions

| Role | Permission |
|---|---|
| **Owner** | Full access + user management + store settings |
| **Admin** | CRUD products, view all transactions, reports, POS |
| **Kasir** | POS transaksi, view own transaction history, limited product view |

---

## 4. Feature List

### 4.1 Authentication & Users (✅ Phase 0-1)

| Feature | Endpoint/Page | Status |
|---|---|---|
| Register | `POST /api/auth/register/` | ✅ |
| Login (JWT) | `POST /api/auth/login/` | ✅ |
| Token Refresh | `POST /api/auth/token/refresh/` | ✅ |
| Get Profile | `GET /api/auth/profile/` | ✅ |
| Change Password | `POST /api/auth/change-password/` | ✅ |
| List Users | `GET /api/auth/users/` | ✅ |
| Web Login Page | `/login` | ✅ |
| Web Register Page | `/register` | ✅ |
| Flutter Login Screen | `LoginScreen` | ✅ |

### 4.2 Product Management (✅ Phase 0-1)

| Feature | Model/Endpoint | Status |
|---|---|---|
| **Category** | `Category` model | ✅ |
| CRUD Category | `GET/POST/PUT/DELETE /api/products/categories/` | ✅ |
| Nested Categories | `parent` field (self-referencing FK) | ✅ |
| **Product** | `Product` model | ✅ |
| CRUD Product | `GET/POST/PUT/DELETE /api/products/products/` | ✅ |
| Search Product | `?search=` | ✅ |
| SKU & Barcode | unique fields | ✅ |
| Min Stock Alert | `min_stock_alert` field | ✅ |
| Unit (pcs/liter/kg/box) | `unit` choices | ✅ |
| **Product Variant** | `ProductVariant` model | ✅ |
| CRUD Variant | Via Product serializer (nested) | ✅ |
| **Stock Movement** | `StockMovement` model | ✅ |
| Stock In/Out/Adjustment | `GET/POST /api/products/stock-movements/` | ✅ |
| Stock reference & notes | `reference`, `notes` fields | ✅ |

### 4.3 POS & Transactions (✅ Phase 0-1)

| Feature | Model/Endpoint | Status |
|---|---|---|
| **Transaction** | `Transaction` model | ✅ |
| Create Transaction | `POST /api/transactions/` | ✅ |
| List Transactions | `GET /api/transactions/` | ✅ |
| Transaction Detail | `GET /api/transactions/{id}/` | ✅ |
| Hold Transaction | `POST /api/transactions/{id}/hold/` | ✅ |
| Cancel Transaction | `POST /api/transactions/{id}/cancel/` | ✅ |
| Refund Transaction | `POST /api/transactions/{id}/refund/` | ✅ |
| **Transaction Item** | `TransactionItem` model | ✅ |
| Auto invoice number | Generated on save | ✅ |
| Discount (percent/fixed) | `discount_type`, `discount_value` | ✅ |
| Tax (default 11%) | `tax_percent`, `tax_amount` | ✅ |
| Payment Methods | cash, transfer, ewallet, mixed | ✅ |
| Change calculation | `payment_amount`, `change_amount` | ✅ |

### 4.4 Invoices (✅ Phase 0-1)

| Feature | Model/Endpoint | Status |
|---|---|---|
| **Invoice** | `Invoice` model | ✅ |
| Invoice auto-created | Linked to Transaction (OneToOne) | ✅ |
| Invoice Status | pending, paid, overdue, cancelled | ✅ |
| Generate PDF | `GET /api/invoices/{id}/generate_pdf/` | ✅ |
| Web Invoice List | `/invoices` | ✅ |
| Flutter Invoice List | `InvoiceListScreen` | ✅ |
| Due date tracking | `due_date` field | ✅ |

### 4.5 Customers (✅ Phase 0-1)

| Feature | Model/Endpoint | Status |
|---|---|---|
| **Customer** | `Customer` model | ✅ |
| CRUD Customer | `GET/POST/PUT/DELETE /api/customers/` | ✅ |
| Search Customer | `?search=` | ✅ |
| Loyalty Points | `loyalty_points` field | ✅ |
| Link to Transaction | `customer` FK on Transaction | ✅ |
| Web Customer Page | `/customers` | ✅ |

### 4.6 Dashboard & Reports (✅ Phase 4)

| Feature | Model/Endpoint | Status |
|---|---|---|
| **Dashboard Stats** | `/api/reports/dashboard/` | ✅ |
| Today's sales & transactions | Calculated from completed TXs | ✅ |
| Week/month sales with comparison % | Rolling aggregation | ✅ |
| Top 5 products by revenue | Monthly | ✅ |
| Recent 10 transactions | Ordered by created_at | ✅ |
| Recent 5 invoices | Ordered by created_at | ✅ |
| Low stock alerts | Product stock ≤ min_stock_alert | ✅ |
| Payment method breakdown | Pie chart data | ✅ |
| Category sales breakdown | Pie chart data | ✅ |
| Sales trend 7 days | Line chart data | ✅ |
| **Sales Report** | `/api/reports/sales-report/` | ✅ |
| Filter by period | daily/weekly/monthly/yearly | ✅ |
| Filter by date range | `date_from`, `date_to` | ✅ |
| Summary + grouped data | totals, counts, averages | ✅ |
| **Product Report** | `/api/reports/product-report/` | ✅ |
| Products sold, revenue, avg price | Per product aggregation | ✅ |
| **Customer Report** | `/api/reports/customer-report/` | ✅ |
| Customer spending, order count | Per customer aggregation | ✅ |
| **Excel Export** | `*/export/` endpoints | ✅ |
| Sales/Product/Customer export | openpyxl | ✅ |

### 4.7 Store Settings (✅ Phase 0-1)

| Feature | Model/Endpoint | Status |
|---|---|---|
| **StoreSettings** | `StoreSettings` model | ✅ |
| Singleton pattern | Single row enforced on save | ✅ |
| Store name, address, phone, email | Basic info | ✅ |
| Logo upload | ImageField | ✅ |
| Tax percent | Default 11% (Indonesia PPN) | ✅ |
| Currency | Default IDR | ✅ |
| Receipt header/footer | Text for receipt printing | ✅ |

### 4.8 Web Pages (React)

| Page | Route | Status |
|---|---|---|
| Login | `/login` | ✅ |
| Register | `/register` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| POS | `/pos` | ✅ |
| Products | `/products` | ✅ |
| Transactions | `/transactions` | ✅ |
| Invoices | `/invoices` | ✅ |
| Customers | `/customers` | ✅ |
| Reports | `/reports` | ✅ |
| Settings | `/settings` | ✅ |
| Users | `/users` | ✅ |
| Audit Log | `/audit-log` | ✅ |

### 4.9 Mobile Screens (Flutter)

| Screen | Navigation | Status |
|---|---|---|
| Login | — | ✅ |
| Dashboard | Tab 0 | ✅ Connected to API |
| POS | Tab 1 | ✅ Connected to API |
| Products | Tab 2 | ✅ Full CRUD |
| Invoice/History | Tab 3 | ✅ Connected to API |
| Settings | Tab 4 | ✅ Connected to API |
| Users | Settings nav | ✅ Full CRUD |
| Audit Log | Settings nav | ✅ Filterable |
| Reports | Tab/Drawer | ✅ 3 tabs (sales, product, customer) |

---

## 5. API Endpoints Reference

### Base URL
- Development: `http://localhost:8000/api`
- Production: `https://your-domain.com/api`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | Login → get access + refresh tokens |
| POST | `/auth/token/refresh/` | Refresh access token |
| GET | `/auth/profile/` | Get current user profile |
| POST | `/auth/change-password/` | Change password |
| GET | `/auth/users/` | List all users |

### User Management (Owner only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/users/manage/` | List all users |
| GET | `/auth/users/manage/{id}/` | User detail |
| PATCH | `/auth/users/manage/{id}/update_role/` | Change user role |
| POST | `/auth/users/manage/{id}/activate/` | Activate user |
| POST | `/auth/users/manage/{id}/deactivate/` | Deactivate user |
| DELETE | `/auth/users/manage/{id}/` | Delete user |

### Audit Log (Admin/Owner)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/audit-log/` | List audit logs (filter: ?action=&model_name=&user_email=) |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/products/categories/` | List/Create category |
| GET/PUT/DELETE | `/products/categories/{id}/` | Category detail |
| GET/POST | `/products/products/` | List/Create product |
| GET/PUT/DELETE | `/products/products/{id}/` | Product detail |
| GET/POST | `/products/stock-movements/` | List/Create stock movement |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/transactions/` | List/Create transaction |
| GET | `/transactions/{id}/` | Transaction detail |
| POST | `/transactions/{id}/hold/` | Hold transaction |
| POST | `/transactions/{id}/cancel/` | Cancel transaction |
| POST | `/transactions/{id}/refund/` | Refund transaction |

### Invoices
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/invoices/` | List/Create invoice |
| GET/PUT/DELETE | `/invoices/{id}/` | Invoice detail |
| GET | `/invoices/{id}/generate_pdf/` | Generate & download PDF |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/customers/` | List/Create customer |
| GET/PUT/DELETE | `/customers/{id}/` | Customer detail |
| GET | `/customers/?search={q}` | Search customers |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/dashboard/` | Dashboard statistics |
| GET | `/reports/sales-report/?period=daily&date_from=...&date_to=...` | Sales report |
| GET | `/reports/product-report/?date_from=...&date_to=...` | Product performance |
| GET | `/reports/customer-report/?date_from=...&date_to=...` | Customer report |
| GET | `/reports/sales-report/export/` | Export sales report to Excel |
| GET | `/reports/product-report/export/` | Export product report to Excel |
| GET | `/reports/customer-report/export/` | Export customer report to Excel |

### Settings
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/settings/` | Get/Update store settings (singleton) |

---

## 6. Database Schema (Summary)

```
accounts.User
  ├── email (unique), role, phone, avatar
  ├── date_joined, is_active, is_staff
  └── roles: owner, admin, kasir

products.Category
  ├── name, slug, description, image
  └── parent (self-referencing FK → nested categories)

products.Product
  ├── name, slug, sku (unique), barcode
  ├── category (FK → Category)
  ├── buy_price, sell_price, stock, min_stock_alert, unit
  └── variants (reverse FK → ProductVariant)

products.ProductVariant
  ├── product (FK → Product), name, sku, barcode
  └── additional_price, stock

products.StockMovement
  ├── product (FK), variant (FK, nullable)
  ├── type (in/out/adjustment), quantity
  ├── reference, notes, created_by (FK → User)

transactions.Transaction
  ├── invoice_number (auto-generated, unique)
  ├── customer (FK → Customer, nullable)
  ├── cashier (FK → User)
  ├── subtotal, discount_type, discount_value
  ├── tax_percent (11%), tax_amount, total
  ├── payment_method, payment_amount, change_amount
  └── status (completed/hold/cancelled/refunded)

transactions.TransactionItem
  ├── transaction (FK → Transaction)
  ├── product (FK → Product), variant (FK, nullable)
  ├── quantity, unit_price, discount, subtotal

invoices.Invoice
  ├── transaction (OneToOne → Transaction)
  ├── invoice_number, pdf_file
  ├── status (pending/paid/overdue/cancelled)
  └── issued_date, due_date, notes

customers.Customer
  ├── name, email, phone, address
  ├── loyalty_points, notes, is_active

core.StoreSettings (singleton)
  ├── name, address, phone, email, logo
  ├── tax_percent, currency
  └── receipt_header, receipt_footer
```

---

## 7. Development Phases

| Phase | Name | Scope | Status |
|---|---|---|---|
| **Phase 0** | Project Setup | Monorepo, Django apps, React pages, Flutter screens, Git | ✅ Done |
| **Phase 1** | API Integration | Connect all frontend to backend, error handling, loading states | ✅ Done |
| **Phase 2** | Cart & Checkout | Full cart logic, checkout flow, receipt preview, mixed payment | ✅ Done |
| **Phase 3** | Invoice & History | PDF generation, invoice history, transaction history, hold/resume, refund | ✅ Done |
| **Phase 4** | Dashboard & Reports | Charts, reports with real data, Excel export, customer report | ✅ Done |
| **Phase 5** | Multi-User & Audit | Role-based access, audit log, user management, activity tracking | ✅ Done |
| **Phase 6** | Flutter Parity | Charts, product CRUD, dark mode, barcode scanner, settings, search | ✅ Done |
| **Phase 7** | Polish & Release | Testing (118+ tests), docs, security, Docker, open-source release | ✅ Done |

---

## 8. Open Source Strategy

- **License**: MIT ✅
- **Repo**: https://github.com/bocahlinux/mercury-pos ✅
- **Contribution**: Open to PRs, with contributing guidelines ✅
- **Documentation**: README.md, API docs (Swagger/ReDoc), deployment guide, contributing guide ✅
- **CI/CD**: GitHub Actions — backend + web tests ✅
- **Roadmap**: Public GitHub Issues/Projects
- **Version**: v1.0.0 released June 2026 ✅

---

## 9. Future Features (Post-v1.0)

| Feature | Description |
|---|---|
| **Receipt Printing** | Thermal printer support for receipts |
| **WhatsApp Notification** | Send invoice/receipt via WhatsApp |
| **Offline Sync** | Flutter app works offline, syncs when online |
| **Multi-Store** | Support multiple store branches |
| **Supplier Management** | Manage suppliers and purchase orders |
| **Loyalty Program** | Point system for repeat customers |
| **Biometric Login** | Fingerprint/face unlock for Flutter app |
| **Multi-Language** | i18n support (ID, EN) |
| **Inventory Alert** | Low stock notifications via email/push |
| **End-of-Day Report** | Daily cashier closing report |
| **Discount & Promo** | Promo codes, automatic discounts |
| **API Rate Limiting** | ✅ Done in v1.0 |
| **Docker Deployment** | ✅ Done in v1.0 |
| **Dark Mode** | ✅ Done in v1.0 (Flutter) |
| **Barcode Scanner** | ✅ Done in v1.0 (Flutter) |

---

*Last updated: June 5, 2026 — OWL*
