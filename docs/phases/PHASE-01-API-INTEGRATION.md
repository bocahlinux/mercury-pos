# Phase 1 — API Integration

> **Status**: 🔄 In Progress (Frontend Web ✅, Flutter ⚠️ Partial)
> **Tanggal**: Juni 2026

## Tujuan
Menghubungkan semua frontend (Web + Flutter) ke backend API. Semua halaman harus consume data dari API, bukan static/dummy data.

## Scope

### Web Frontend — Per-Halaman Integration

#### 1. Login Page
- POST `/api/auth/login/` → simpan `{access, refresh, user}` di zustand
- Custom serializer: `CustomTokenObtainPairSerializer` return `{access, refresh, user}`
- Redirect ke `/dashboard` setelah login

#### 2. Dashboard Page
- GET `/api/reports/dashboard/`
- Response: `{period, summary, top_products, recent_transactions}`
- Field mapping: `product__name`, `created_at`, `total`, `customer_name`
- Render: stats cards, top products chart (recharts), recent transactions table

#### 3. Products Page
- GET `/api/products/products/` (paginated: `{count, next, previous, results}`)
- GET `/api/products/categories/` (paginated)
- POST/PUT/DELETE untuk CRUD
- Search: `?search=`
- Fix: headlessui v2 compat (`Dialog.Overlay` → `div`, `Dialog.Content` → `Dialog.Description`)
- Fix: heroicons v2 compat (`PencilAltIcon` → `PencilIcon`)

#### 4. POS Page
- GET `/api/products/products/` untuk product grid
- POST `/api/transactions/transactions/` untuk checkout
- Items format: `{product: id, quantity, discount: 0, subtotal}`
- Fix: `discount_type: "percent"` (bukan `"none"`), `product_id` → `product`
- Fix: DRF ForeignKey resolve → `item_data['product'].id`

#### 5. Transactions Page
- GET `/api/transactions/transactions/` (paginated)
- Filter: `?status=&date_from=&date_to=`
- Detail: GET `/api/transactions/transactions/{id}/`
- Fix: pagination handling, `fetchDetail()` untuk item list

#### 6. Invoices Page
- GET `/api/invoices/invoices/` (paginated)
- Filter: `?status=&date_from=&date_to=`
- PDF URL: `res.data.pdf_url` (bukan `res.data.url`)
- Fix: Tailwind classes (`"-yellow-200"` → `"bg-yellow-200"`)

#### 7. Customers Page
- GET `/api/customers/` (paginated)
- POST/PUT/DELETE untuk CRUD
- Search: `?search=`

#### 8. Reports Page
- GET `/api/reports/sales-report/?period=daily&date_from=&date_to=`
- GET `/api/reports/product-report/?date_from=&date_to=`
- Response: `{period, summary, data}`
- Render: summary cards, sales chart, product breakdown table

#### 9. Settings Page
- GET `/api/settings/` → load store settings
- PATCH `/api/settings/${id}/` → update settings
- Form: store name, address, phone, email, logo, tax, currency, receipt header/footer

### Flutter — Per-Screen Integration

| Screen | Endpoint | Status |
|--------|----------|--------|
| Login | POST `/auth/login/` | ✅ |
| Dashboard | GET `/reports/dashboard/` | ⚠️ Static data |
| POS | GET `/products/products/`, POST `/transactions/` | ✅ |
| Products | GET `/products/products/` | ⚠️ Need verify |
| Transactions | GET `/transactions/` | ⚠️ Need verify |
| Settings | GET/PATCH `/settings/` | ⚠️ Need verify |

### Fixes Applied (22 issues)
1. Double prefix `/api/api/` di Reports, Transactions, Invoices pages
2. Named import `{ api }` → default import `import api from '@/api/client'`
3. `cn.ts`: `export default` → `export function cn`
4. Missing `card.tsx` component → created
5. `App.tsx`: `token` → `accessToken` field name
6. `authStore.ts`: removed `name` field from User type
7. `auth.ts`: register path trailing slash + `password_confirm` + `role`
8. `accounts/serializers.py`: CustomTokenObtainPairSerializer
9. `invoices/serializers.py`: added `total` computed field
10. `transactions/serializers.py`: added `customer_name`, `payment_method`
11. `transactions/serializers.py`: `get_cashier_name()` → `.email`
12. `transactions/serializers.py`: `item_data['product_id']` → `item_data['product'].id`
13. `customers/serializers.py`: `transaction_set` → `transactions`
14. `reports/views.py`: `get_full_name()` → `.email`
15. `accounts/views.py`: removed duplicate class
16. `seed_data.py`: removed `name` field
17. Flutter `api_client.dart`: fixed transaction URL, added `_extractList()`
18. Flutter `auth_service.dart`: parse `data['user']` + fallback
19. Flutter 5 screens: fixed import path `../../api/` → `../api/`
20. Flutter POS: `product_id` → `product` in checkout
21. Dashboard: field mapping `product__name`, `created_at`, `total`
22. POS URL: `/transactions/` → `/transactions/transactions/`

## API Endpoints Reference
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/login/` | Login → JWT |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET | `/api/auth/profile/` | Get profile |
| POST | `/api/auth/change-password/` | Change password |
| GET | `/api/auth/users/` | List users |
| GET/POST | `/api/products/categories/` | Categories |
| GET/POST | `/api/products/products/` | Products |
| GET/POST | `/api/products/stock-movements/` | Stock movements |
| GET/POST | `/api/transactions/transactions/` | Transactions |
| GET | `/api/transactions/transactions/{id}/` | Transaction detail |
| POST | `/api/transactions/transactions/{id}/hold/` | Hold |
| POST | `/api/transactions/transactions/{id}/cancel/` | Cancel |
| POST | `/api/transactions/transactions/{id}/refund/` | Refund |
| GET/POST | `/api/invoices/invoices/` | Invoices |
| GET | `/api/invoices/invoices/{id}/generate_pdf/` | Generate PDF |
| GET/POST | `/api/customers/` | Customers |
| GET | `/api/reports/dashboard/` | Dashboard stats |
| GET | `/api/reports/sales-report/` | Sales report |
| GET | `/api/reports/product-report/` | Product report |
| GET/PATCH | `/api/settings/` | Store settings |

## Known Issues
- Transactions/Invoices: default date filter kosong → tabel kosong sampai user pilih date range
- Flutter Dashboard masih static data
- Flutter beberapa screen perlu verifikasi manual

## Next
- Phase 2: Cart & Checkout flow
- Phase 3: Invoice & History
- Phase 4: Dashboard & Reports (charts, Excel export)
