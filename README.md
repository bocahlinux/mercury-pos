# 🚀 Mercury POS

<p align="center">
  <strong>Open-Source Point of Sale & Invoice System</strong>
  <br>
  <em>Dibangun dari nol — gratis, cepat, dan powerful.</em>
</p>

<p align="center">
  <a href="https://github.com/bocahlinux/mercury-pos"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python 3.11"></a>
  <a href="https://www.djangoproject.com/"><img src="https://img.shields.io/badge/Django-4.2-092E20?logo=django&logoColor=white" alt="Django 4.2"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18"></a>
  <a href="https://flutter.dev/"><img src="https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white" alt="Flutter"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
</p>

> ⚡ Nama **"Mercury"** diambil dari planet tercepat di tata surya — cepat, ringan, dan reliable.

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Progress Development](#-progress-development)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

Mercury POS adalah aplikasi **Point of Sale & Invoice** open-source yang dibangun dari nol untuk menggantikan solusi POS komersial mahal. Dirancang khusus untuk **UKM, toko retail, kios, dan usaha kecil-menengah** di Indonesia.

### Masalah yang Diselesaikan

- 💰 POS komersial mahal (Rp 100-300rb+/bulan subscription)
- 🔒 Vendor lock-in, data tidak dimiliki sendiri
- 📦 Fitur berlebihan yang tidak semuanya dipakai UKM
- 📶 Butuh solusi yang bisa jalan offline

### Solusi

Aplikasi POS **gratis, open-source, self-hosted** dengan fitur lengkap:

| Platform | Teknologi | Fungsi |
|---|---|---|
| **Backend API** | Django REST Framework | Server, database, auth, business logic |
| **Web App** | React + TypeScript | Kasir di desktop/browser |
| **Mobile App** | Flutter | Kasir di tablet/HP Android-iOS |

---

## ✨ Fitur

### Core Features

| Fitur | Deskripsi | Status |
|---|---|---|
| 🔐 **Autentikasi** | JWT-based auth, multi-role (Owner/Admin/Kasir) | ✅ |
| 📦 **Manajemen Produk** | CRUD produk, kategori, varian, stok, barcode | ✅ |
| 🛒 **POS & Transaksi** | Keranjang, checkout, multi-payment, diskon, pajak | ✅ |
| 🧾 **Invoice** | Auto-generated invoice, PDF export | ✅ |
| 👥 **Pelanggan** | CRUD customer, loyalty points, riwayat transaksi | ✅ |
| 📊 **Dashboard** | Statistik penjualan harian/mingguan/bulanan, comparison %, low stock alerts, payment breakdown | ✅ |
| 📈 **Laporan** | Sales/Product/Customer report, filter periode, export Excel | ✅ |
| ⚙️ **Pengaturan Toko** | Info toko, logo, pajak, struk header/footer | ✅ |

### Mobile Features (Phase 6)

| Fitur | Deskripsi | Status |
|---|---|---|
| 📱 **Barcode Scanner** | Scan barcode via kamera untuk cari produk di POS | ✅ |
| 🌙 **Dark Mode** | Tema gelap untuk Flutter app (dengan persistence) | ✅ |
| 🔄 **Offline Sync** | Flutter app jalan offline, sync saat online | 📋 |

### Planned Features

| Fitur | Deskripsi |
|---|---|
| 🏪 **Multi-Store** | Support banyak cabang toko |
| 📲 **WhatsApp Notif** | Kirim invoice/receipt via WhatsApp |
| 🌐 **Multi-Bahasa** | i18n support (ID, EN) |
| 📉 **Inventory Alert** | Notifikasi stok rendah |

---

## 🛠 Tech Stack

### Backend
| Komponen | Teknologi |
|---|---|
| Framework | Django 4.2 + Django REST Framework 3.14 |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| CORS | django-cors-headers |
| PDF | reportlab |
| Excel | openpyxl |
| Barcode | python-barcode |
| Image | Pillow |

### Web Frontend
| Komponen | Teknologi |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| State | Zustand (auth) + React Query (server) |
| HTTP | Axios (JWT interceptor) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |

### Mobile App
| Komponen | Teknologi |
|---|---|
| Framework | Flutter 3.x (Android + iOS) |
| State | Provider |
| HTTP | Dio (JWT interceptor) |
| Auth Storage | Flutter Secure Storage |

---

## 🏗 Arsitektur

```
mercury-pos/
├── backend/                  # Django REST Framework
│   ├── accounts/             # Auth, User, Roles
│   ├── products/             # Category, Product, Variant, Stock
│   ├── transactions/         # Transaction, TransactionItem
│   ├── invoices/             # Invoice, PDF generation
│   ├── customers/            # Customer management
│   ├── reports/              # Dashboard, Sales, Product reports
│   ├── core/                 # Store settings (singleton)
│   └── mercury_pos/          # Project config
│
├── web/                      # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/              # Axios client + JWT interceptor
│   │   ├── stores/           # Zustand stores
│   │   ├── components/       # Layout, shared components
│   │   ├── pages/            # 10 pages (Dashboard, POS, Products, etc.)
│   │   └── App.tsx           # Router + auth guard
│   └── ...
│
├── mobile/                   # Flutter
│   ├── lib/
│   │   ├── api/              # Dio client + auth API
│   │   ├── services/         # Auth service (Provider)
│   │   ├── models/           # Data models
│   │   ├── screens/          # 7 screens
│   │   └── main.dart
│   └── ...
│
├── PRD.md                    # Product Requirements Document
└── README.md                 # This file
```

---

## 📊 Progress Development

| Phase | Nama | Status | Progress |
|---|---|---|---|
| **Phase 0** | Project Setup | ✅ Selesai | Monorepo, Django apps, React pages, Flutter screens, Git |
| **Phase 1** | API Integration | ✅ Selesai | Web + Flutter connected to API, auth, CRUD |
| **Phase 2** | Cart & Checkout | ✅ Selesai | Full cart logic, receipt preview, mixed payment, zustand store |
| **Phase 3** | Invoice & History | ✅ Selesai | PDF generation, mark paid/cancel, refund + stock restore, hold/resume |
| **Phase 4** | Dashboard & Reports | ✅ Selesai | Charts, comparison%, low stock, payment breakdown, Excel export, customer report |
| **Phase 5** | Multi-User & Audit | ✅ Selesai | Role-based permissions, AuditLog model + API, User management (web + flutter), Audit log viewer |
| **Phase 6** | Flutter Parity | ✅ Selesai | Charts, product CRUD, dark mode, barcode scanner, settings, transaction search |
| **Phase 7** | Polish & Release | 📋 Planned | Testing, docs, open-source release |

### Phase 1 Detail (✅ Selesai)

| Task | Web | Flutter | Backend |
|---|---|---|---|
| Auth (login, register) | ✅ | ✅ | ✅ |
| Dashboard (stats) | ✅ | ✅ | ✅ |
| POS (cart, checkout) | ✅ | ✅ | ✅ |
| Products (CRUD) | ✅ | ✅ | ✅ |
| Transactions (list) | ✅ | ✅ | ✅ |
| Invoices (list, PDF) | ✅ | ✅ | ✅ |
| Customers (CRUD) | ✅ | ✅ | ✅ |
| Reports (dashboard) | ✅ | ❌ Missing | ✅ |
| Settings | ✅ | ✅ | ✅ |
| Error handling | ✅ | ⚠️ | — |
| Loading states | ✅ | ⚠️ | — |
| CORS config | — | — | ✅ |
| Seed data | — | — | ✅ |

### Phase 2 Detail (✅ Selesai)

| Task | Web | Flutter | Backend |
|---|---|---|---|
| Cart state (zustand persist) | ✅ | ✅ | — |
| Customer selection at checkout | ✅ | ✅ | — |
| Receipt preview modal | ✅ | ✅ | — |
| Mixed payment method | ✅ | ✅ | — |
| Transaction create returns receipt | — | — | ✅ |
| Flutter POS full checkout | ✅ | ✅ | — |

### Phase 3 Detail (✅ Selesai)

| Task | Web | Flutter | Backend |
|---|---|---|---|
| Invoice list with filters | ✅ | ✅ | ✅ |
| Invoice detail + actions | ✅ | ✅ | ✅ |
| PDF generation (receipt + invoice) | ✅ | ❌ | ✅ |
| Transaction history with filters | ✅ | ✅ | ✅ |
| Hold / Resume flow | ✅ | ✅ | ✅ |
| Refund + stock restore | ✅ | ✅ | ✅ |
| Mark paid / Cancel invoice | ✅ | ✅ | ✅ |
| StockMovement logging | — | — | ✅ |

### Phase 4 Detail (✅ Selesai)

| Task | Web | Flutter | Backend |
|---|---|---|---|
| Dashboard comparison % (today/week/month) | ✅ | ✅ | ✅ |
| Low stock alerts widget | ❌ | ✅ | ✅ |
| Payment method breakdown | ✅ | ✅ | ✅ |
| Category sales breakdown (pie chart) | ✅ | ✅ | ✅ |
| Sales trend 7 days (line chart) | ✅ | ✅ | ✅ |
| Recent invoices widget | ✅ | ❌ | ✅ |
| Sales report with filters | ✅ | ✅ | ✅ |
| Product report with filters | ✅ | ✅ | ✅ |
| Customer report | ✅ | ✅ | ✅ |
| Excel export (sales/product/customer) | ✅ | ❌ | ✅ |
| Flutter Reports screen (3 tabs) | — | ✅ | — |

### Phase 5 Detail (✅ Selesai)

| Task | Web | Flutter | Backend |
|---|---|---|---|
| AuditLog model | — | — | ✅ |
| Audit helper functions | — | — | ✅ |
| UserManagementViewSet (Owner) | — | — | ✅ |
| AuditLogView (Admin/Owner) | — | — | ✅ |
| IsKasir permission | — | — | ✅ |
| Role-based permissions (all views) | — | — | ✅ |
| UsersPage (CRUD, role change) | ✅ | — | — |
| AuditLogPage (filterable) | ✅ | — | — |
| UsersScreen (CRUD, role change) | — | ✅ | — |
| AuditLogScreen (filterable) | — | ✅ | — |
| Settings nav to Users/Audit | — | ✅ | — |

### Phase 6 Detail (✅ Selesai)

| Task | Flutter | Notes |
|---|---|---|
| Dashboard LineChart (7 hari) | ✅ | fl_chart, data dari `/reports/dashboard/` |
| Dashboard PieChart (kategori) | ✅ | fl_chart, data dari `category_breakdown` |
| Product create/edit form | ✅ | Full form: nama, SKU, barcode, kategori, harga, stok |
| Product delete | ✅ | PopupMenuButton + confirm dialog |
| Transaction search | ✅ | Debounce 400ms, pass `search` param ke API |
| Dark mode | ✅ | ThemeService + SharedPreferences + toggle di Settings |
| Barcode scanner | ✅ | mobile_scanner, scan → cari produk → add to cart |
| Settings updateStoreSettings | ✅ | PATCH `/settings/` |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Flutter 3.x

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/Mac
# venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env → set SECRET_KEY and other values
python manage.py migrate
python manage.py runserver
```

Backend jalan di `http://localhost:8000`

### Web Frontend

```bash
cd web
npm install
cp .env.example .env
# Edit .env → set VITE_API_BASE_URL=http://localhost:8000/api
npm run dev
```

Web jalan di `http://localhost:5173`

### Mobile App

```bash
cd mobile
flutter pub get
flutter run
```

---

## 🔌 API Endpoints

### Base URL
- Development: `http://localhost:8000/api`
- Production: `https://your-domain.com/api`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register/` | Register user baru |
| POST | `/auth/login/` | Login → access + refresh token |
| POST | `/auth/token/refresh/` | Refresh access token |
| GET | `/auth/profile/` | Profil user saat ini |
| POST | `/auth/change-password/` | Ganti password |
| GET | `/auth/users/` | List semua user |

### User Management (Owner only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/users/manage/` | List semua user |
| GET | `/auth/users/manage/{id}/` | Detail user |
| PATCH | `/auth/users/manage/{id}/update_role/` | Ganti role user |
| POST | `/auth/users/manage/{id}/activate/` | Aktifkan user |
| POST | `/auth/users/manage/{id}/deactivate/` | Nonaktifkan user |
| DELETE | `/auth/users/manage/{id}/` | Hapus user |

### Audit Log (Admin/Owner)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/audit-log/` | List audit log (filter: ?action=&model_name=&user_email=) |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/products/categories/` | List/Create kategori |
| GET/PUT/DELETE | `/products/categories/{id}/` | Detail kategori |
| GET/POST | `/products/products/` | List/Create produk |
| GET/PUT/DELETE | `/products/products/{id}/` | Detail produk |
| GET/POST | `/products/stock-movements/` | List/Create pergerakan stok |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/transactions/` | List/Create transaksi |
| GET | `/transactions/{id}/` | Detail transaksi |
| POST | `/transactions/{id}/hold/` | Tahan transaksi |
| POST | `/transactions/{id}/cancel/` | Batalkan transaksi |
| POST | `/transactions/{id}/refund/` | Refund transaksi |

### Invoices
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/invoices/` | List/Create invoice |
| GET/PUT/DELETE | `/invoices/{id}/` | Detail invoice |
| GET | `/invoices/{id}/generate_pdf/` | Generate PDF |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/customers/` | List/Create customer |
| GET/PUT/DELETE | `/customers/{id}/` | Detail customer |
### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/dashboard/` | Statistik dashboard (summary, comparison, charts) |
| GET | `/reports/sales-report/` | Laporan penjualan (daily/weekly/monthly/yearly) |
| GET | `/reports/product-report/` | Laporan produk terlaris |
| GET | `/reports/customer-report/` | Laporan pelanggan |
| GET | `/reports/sales-report/export/` | Export sales report ke Excel |
| GET | `/reports/product-report/export/` | Export product report ke Excel |
| GET | `/reports/customer-report/export/` | Export customer report ke Excel |

### Settings
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/settings/` | Get/Update pengaturan toko |

---

## 📸 Screenshots

> *(Coming soon — akan ditambahkan setelah UI final)*

| Web App | Mobile App |
|---|---|
| Dashboard | Dashboard |
| POS | POS |
| Products | Products |

---

## 🗺 Roadmap

### v1.0 (Current)
- [x] Backend API (Django REST)
- [x] Web App (React) — 10 pages
- [x] Mobile App (Flutter) — 8 screens + barcode scanner
- [x] JWT Authentication
- [x] Product Management (full CRUD)
- [x] POS & Transactions (cart, checkout, hold/resume, refund)
- [x] Invoice (PDF, mark paid/cancel)
- [x] Dashboard & Reports (charts, comparison%, low stock, Excel export)
- [x] Flutter Parity (charts, product CRUD, dark mode, barcode scanner, settings)
- [x] Multi-user & audit log (Phase 5)

### v1.1 (Next)
- [ ] Receipt printing (thermal printer)
- [ ] WhatsApp notification
- [ ] Offline sync (Flutter)
- [ ] Biometric login

### v2.0 (Future)
- [ ] Multi-store support
- [ ] Supplier & Purchase Order
- [ ] Multi-language (i18n)
- [ ] Loyalty program

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Cara berkontribusi:

1. **Fork** repo ini
2. **Buat branch** fitur: `git checkout -b feature/fitur-baru`
3. **Commit** perubahan: `git commit -m "feat: tambah fitur X"`
4. **Push** ke branch: `git push origin feature/fitur-baru`
5. **Buka Pull Request**

Baca [PRD.md](./PRD.md) untuk detail requirements dan arsitektur.

---

## 📄 Lisensi

Mercury POS dilisensikan di bawah **MIT License** — bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan pribadi maupun komersial.

---

<p align="center">
  Dibuat dengan ❤️ oleh <a href="https://github.com/bocahlinux">bocahlinux</a> + 🤖 OWL
  <br>
  <sub>June 2026</sub>
</p>
