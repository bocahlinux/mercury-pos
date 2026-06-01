# Phase 5 — Multi-User & Audit

> **Status**: 📋 Planned
> **Target**: Setelah Phase 4 selesai

## Tujuan
Role-based access control (RBAC) lengkap dan audit log untuk tracking semua aktivitas.

## Scope

### Role-Based Access Control

#### Owner
- Full access ke semua fitur
- User management (CRUD)
- Store settings
- All reports
- Delete transactions/invoices

#### Admin
- CRUD Products
- View all transactions
- View all reports
- POS access
- Cannot: manage users, delete records

#### Kasir
- POS transactions only
- View own transaction history
- Limited product view (no cost price)
- Cannot: reports, settings, user management

### User Management (Owner only)
- List all users
- Create user (set role)
- Edit user (change role, deactivate)
- Delete user (soft delete)
- Reset password

### Audit Log
- Track semua create/update/delete operations
- Log: user, action, model, object_id, timestamp, IP
- Read-only log view (Owner only)
- Filter by: user, action type, date range, model

### Permission Middleware
- DRF permission classes per role
- Object-level permissions (kasir hanya lihat transaksi sendiri)
- Frontend route guards per role
- Frontend component-level permissions (hide/show based on role)

## Technical Notes
- DRF: custom permission classes
- Middleware: audit log middleware untuk auto-log
- Frontend: route guard component + `useAuthStore().user.role`
- Database: `AuditLog` model dengan JSONField untuk changes

## Deliverables
| Item | Status |
|------|--------|
| DRF permission classes per role | 📋 |
| User management CRUD (web) | 📋 |
| Route guards per role (web) | 📋 |
| Component-level permissions (web) | 📋 |
| Audit log model + middleware | 📋 |
| Audit log viewer (web) | 📋 |
| Role-based UI (Flutter) | 📋 |
