# 📝 Changelog

All notable changes to Mercury POS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Phase 7: Polish & Release

#### Added
- **Testing (Backend)**: 79 tests covering audit log, permissions, API endpoints, and integration flows
- **Testing (Web)**: 24 component tests for UsersPage and AuditLogPage
- **Testing (Flutter)**: 15 widget tests for UsersScreen and AuditLogScreen (written, pending SDK)
- **API Documentation**: drf-spectacular integration — Swagger UI at `/api/docs/`, ReDoc at `/api/redoc/`
- **Docker Deployment**: Dockerfile for backend and web, docker-compose.yml with 4 services
- **Nginx Config**: Reverse proxy configuration for production deployment
- **DEPLOYMENT.md**: Complete deployment guide (Docker + manual VPS setup)
- **CONTRIBUTING.md**: Contributing guide with code style, commit convention, PR process
- **CHANGELOG.md**: This file

#### Fixed
- `IsOwner` permission bypass on ViewSet (added `has_permission` check)
- Anonymous users creating audit logs (early return in `_log_action`)
- DRF pagination handling in test assertions

---

## [0.6.0] — 2025-06-05

### Phase 6: Flutter Parity

#### Added
- **Dashboard Charts**: LineChart (7-day sales trend) + PieChart (category breakdown) using fl_chart
- **Product CRUD**: Full create/edit form with SKU, barcode, category, price, stock
- **Product Delete**: With confirmation dialog
- **Transaction Search**: Debounced search (400ms) passing `search` param to API
- **Dark Mode**: ThemeService with SharedPreferences persistence, toggle in Settings
- **Barcode Scanner**: mobile_scanner integration — scan → search product → add to cart
- **Settings Update**: PATCH `/settings/` for store settings

---

## [0.5.0] — 2025-06-04

### Phase 5: Multi-User & Audit

#### Added
- **AuditLog Model**: 10 action types (create, update, delete, login, logout, role_change, activate, deactivate, export, pdf_generate) with indexes
- **Audit Helper Functions**: `audit_create`, `audit_update`, `audit_delete`, `audit_login`, `audit_logout`, `audit_role_change`, `audit_activate`, `audit_deactivate`, `audit_export`, `audit_pdf_generate`
- **User Management API**: Owner-only ViewSet with list, retrieve, update_role, activate, deactivate, destroy
- **Audit Log API**: Filterable list (Admin/Owner) with `?action=`, `?model_name=`, `?user_email=` params
- **Role-Based Permissions**: IsOwner, IsAdmin, IsOwnerOrAdmin, IsKasir permission classes
- **Permission Enforcement**: Products/Category/StockMovement → IsAdmin; Transactions/Invoices → IsKasir; Dashboard/Reports → IsKasir; Customer/Exports → IsAdmin
- **Web UsersPage**: User management with search, role change, activate/deactivate, delete
- **Web AuditLogPage**: Audit log viewer with action/model/email filters
- **Flutter UsersScreen**: User management with list, role change, activate/deactivate, delete
- **Flutter AuditLogScreen**: Audit log viewer with action filter
- **Settings Navigation**: Links to Users and Audit Log screens

#### Safety
- Self-deactivation prevention
- Self-deletion prevention
- AuditLog recursive logging prevention (noop signal handler)

---

## [0.4.0] — 2025-06-03

### Phase 4: Dashboard & Reports

#### Added
- **Dashboard Statistics**: Summary, comparison %, low stock alerts, payment method breakdown
- **Category Sales Breakdown**: Pie chart visualization
- **Sales Trend**: 7-day line chart
- **Recent Invoices Widget**
- **Sales Report**: Daily/weekly/monthly/yearly filters
- **Product Report**: Best-selling products with filters
- **Customer Report**: Customer spending analysis
- **Excel Export**: Sales, product, customer reports via openpyxl
- **Flutter Reports Screen**: 3 tabs (sales, product, customer)

---

## [0.3.0] — 2025-06-02

### Phase 3: Invoice & History

#### Added
- **Invoice List**: With filters (status, date range)
- **Invoice Detail**: View + actions (mark paid, cancel)
- **PDF Generation**: Receipt and invoice PDF via reportlab
- **Transaction History**: With search and filters
- **Hold / Resume**: Transaction hold and resume flow
- **Refund**: Full refund with stock restoration
- **Mark Paid / Cancel**: Invoice status management
- **Stock Movement Logging**: Automatic logging on stock changes

---

## [0.2.0] — 2025-06-01

### Phase 2: Cart & Checkout

#### Added
- **Cart State Management**: Zustand store with persistence
- **Customer Selection**: At checkout
- **Receipt Preview Modal**: Before completing transaction
- **Mixed Payment**: Multiple payment methods per transaction
- **Transaction Create**: Returns receipt data
- **Flutter POS Checkout**: Full checkout flow

---

## [0.1.0] — 2025-05-31

### Phase 1: API Integration

#### Added
- **Authentication**: JWT login, register, token refresh
- **Web App**: Connected to backend API
- **Flutter App**: Connected to backend API
- **Dashboard**: Statistics display
- **POS**: Cart and checkout
- **Products**: Full CRUD
- **Transactions**: List and detail
- **Invoices**: List and PDF generation
- **Customers**: Full CRUD
- **Reports**: Dashboard reports
- **Settings**: Store settings management
- **CORS Configuration**: Cross-origin resource sharing
- **Seed Data**: Initial data for development

---

## [0.0.1] — 2025-05-30

### Phase 0: Project Setup

#### Added
- **Monorepo Structure**: backend/, web/, mobile/
- **Django Backend**: 6 apps (accounts, products, transactions, invoices, customers, reports, core)
- **React Web App**: 10 pages with React Router + Zustand
- **Flutter Mobile App**: 8 screens with Provider
- **Git Repository**: Initialized with .gitignore

---

## Release Notes

### v1.0.0 (Planned)
- All Phase 0-6 features complete
- Comprehensive test coverage (>80% backend)
- Production-ready Docker deployment
- Complete documentation (API docs, setup, deployment, contributing)
- Security hardening (dependency audit, rate limiting)
- Open-source release (MIT License, GitHub templates)

---

<sub>Mercury POS — Open-Source Point of Sale & Invoice System</sub>
