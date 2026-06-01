# Phase 2 — Cart & Checkout

> **Status**: 📋 Planned
> **Target**: Setelah Phase 1 selesai

## Tujuan
Implementasi logika cart lengkap dan flow checkout dari awal sampai struk/cetak.

## Scope

### Web Frontend

#### Cart State Management
- Tambah produk ke cart (dari product grid di POS page)
- Update quantity (+/-)
- Hapus item dari cart
- Cart summary: subtotal, discount, tax, total
- Cart persist selama session (zustand persist / localStorage)

#### Discount System
- Discount per-item (percent / fixed)
- Discount per-transaction (percent / fixed)
- Validasi: discount tidak boleh melebihi subtotal

#### Checkout Flow
1. Pilih customer (optional, dari dropdown/search)
2. Pilih payment method: `cash`, `transfer`, `ewallet`, `mixed`
3. Input payment amount
4. Hitung change amount otomatis
5. POST `/api/transactions/transactions/` untuk create transaction
6. On success: tampilkan struk preview + tombol cetak
7. Reset cart setelah checkout berhasil

#### Receipt Preview
- Tampilkan receipt preview setelah checkout
- Data: store info, items, subtotal, discount, tax, total, payment, change
- Tombol cetak (window.print() atau PDF)
- Tombol "Transaksi Baru" untuk reset

### Mobile (Flutter)

#### Cart State
- Provider-based cart state
- Same flow: add → update → checkout

#### Checkout
- Same flow as web
- Receipt preview screen
- Print via Bluetooth printer (optional, future)

## Technical Notes
- Tax default: 11% (Indonesia PPN)
- Change calculation: `change = payment_amount - total`
- Transaction status: `completed` (langsung selesai di POS)
- Invoice auto-created via backend signal/post_save

## API Payload Example
```json
{
  "customer": 1,
  "discount_type": "percent",
  "discount_value": 10,
  "tax_percent": 11,
  "payment_method": "cash",
  "payment_amount": 100000,
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "discount": 0,
      "subtotal": 50000
    }
  ]
}
```

## Deliverables
| Item | Status |
|------|--------|
| Cart state management (web) | 📋 |
| Add/update/remove cart items | 📋 |
| Discount system | 📋 |
| Checkout flow (web) | 📋 |
| Receipt preview | 📋 |
| Cart state management (Flutter) | 📋 |
| Checkout flow (Flutter) | 📋 |
| Print receipt | 📋 |
