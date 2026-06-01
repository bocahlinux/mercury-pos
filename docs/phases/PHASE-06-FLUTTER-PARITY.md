# Phase 6 — Flutter Parity

> **Status**: 📋 Planned
> **Target**: Setelah Phase 5 selesai

## Tujuan
Full feature parity antara Flutter mobile app dan Web app. Flutter harus punya semua fitur yang ada di web.

## Scope

### Feature Parity Checklist

| Feature | Web | Flutter | Gap |
|---------|-----|---------|-----|
| Login/Register | ✅ | ✅ | — |
| Dashboard | ✅ | ⚠️ Static | Need API |
| POS | ✅ | ✅ | — |
| Products | ✅ | ⚠️ | Need verify |
| Transactions | ✅ | ⚠️ | Need verify |
| Invoices | ✅ | ⚠️ | Need verify |
| Customers | ✅ | ⚠️ | Need verify |
| Reports | ✅ | ❌ | Not implemented |
| Settings | ✅ | ⚠️ | Need verify |
| User Management | 📋 | ❌ | Not implemented |
| Audit Log | 📋 | ❌ | Not implemented |

### Offline Support
- Local database (SQLite via `sqflite`)
- Cache products, customers locally
- Queue transactions when offline
- Auto-sync when online
- Conflict resolution strategy

### Mobile-Specific Features
- Barcode scanner (camera) untuk POS
- Push notifications (low stock, etc.)
- Biometric login (fingerprint/face)
- Tablet-optimized layout
- Dark mode

### State Management
- Migrate dari Provider ke Riverpod (optional, evaluasi)
- Proper error handling + loading states
- Pull-to-refresh on all list screens
- Infinite scroll pagination

## Technical Notes
- Offline: `sqflite` + `connectivity_plus` + background sync
- Barcode: `mobile_scanner` package
- Biometric: `local_auth` package
- Push: `firebase_messaging`

## Deliverables
| Item | Status |
|------|--------|
| Dashboard with real data | 📋 |
| Products full CRUD | 📋 |
| Transactions list + detail | 📋 |
| Invoices list + PDF | 📋 |
| Customers full CRUD | 📋 |
| Reports screens | 📋 |
| Settings full | 📋 |
| Offline support | 📋 |
| Barcode scanner | 📋 |
| Biometric login | 📋 |
| Dark mode | 📋 |
| Tablet layout | 📋 |
