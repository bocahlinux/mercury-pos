# 🚀 Mercury POS

**Open-Source Point of Sale & Invoice System**

Mercury POS adalah aplikasi POS (Point of Sale) lengkap berbasis web dan mobile, dibangun dengan arsitektur modern dan dirancang untuk bisnis dari skala kecil rumahan hingga UKM.

> ⚡ Nama "Mercury" diambil dari planet tercepat di tata surya — cepat, ringan, dan reliable.

## Fitur

- ✅ Manajemen Produk & Kategori (SKU, Barcode, Stok)
- ✅ Transaksi POS (Keranjang, Checkout, Multi-payment)
- ✅ Invoice & Cetak Struk (PDF & Thermal Printer)
- ✅ Dashboard & Laporan Keuangan
- ✅ Manajemen Pelanggan
- ✅ Multi-User dengan Hak Akses (Owner, Admin, Kasir)
- ✅ Audit Log
- ✅ Web App (React) + Mobile App (Flutter)

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Django + Django REST Framework |
| Database | PostgreSQL (prod) / SQLite (dev) |
| Web Frontend | React + TypeScript + Vite |
| Mobile App | Flutter |
| Auth | JWT (SimpleJWT) |

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Web

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.
