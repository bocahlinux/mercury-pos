# Phase 0 — Project Setup

> **Status**: ✅ Done
> **Tanggal**: Mei–Juni 2026
> **Branch**: `main`

## Tujuan
Setup struktur monorepo, inisialisasi semua project (Django, React, Flutter), konfigurasi Git, dan scaffolding dasar.

## Scope

### Monorepo Structure
```
mercury-pos/
├── backend/          # Django REST Framework
├── web/              # React + TypeScript + Vite (rename dari frontend/)
├── mobile/           # Flutter
├── media/            # Static/media files
├── docs/             # Dokumentasi (termasuk file ini)
├── PRD.md            # Product Requirements Document
├── README.md         # Project readme
└── .gitignore        # Git ignore rules
```

### Backend Setup
- Django 4.2 + Django REST Framework 3.14
- JWT Authentication (djangorestframework-simplejwt)
- django-cors-headers
- 7 Django apps: `accounts`, `core`, `products`, `transactions`, `invoices`, `customers`, `reports`
- SQLite untuk dev, PostgreSQL untuk prod
- Custom User model (email-based, tanpa `name` field)
- Role-based: `owner`, `admin`, `kasir`

### Web Frontend Setup
- React 18 + TypeScript + Vite
- Zustand (auth store) + React Query (server state)
- Axios dengan JWT interceptor
- React Router v6
- Tailwind CSS
- Folder structure:
  ```
  web/src/
  ├── api/          # Axios client + auth API
  ├── components/   # Shared UI (Sidebar, Navbar, Card, Toast)
  ├── pages/        # Per-page components
  ├── stores/       # Zustand stores (authStore)
  ├── types/        # TypeScript interfaces
  └── utils/        # Helpers (cn.ts)
  ```

### Mobile Setup
- Flutter 3.x
- Provider (state management)
- Dio (HTTP client + JWT interceptor)
- Flutter Secure Storage (token persistence)
- Tab-based navigation: Dashboard, POS, Products, History, Settings

### Git & GitHub
- Repo: `github.com/bocahlinux/mercury-pos`
- Push via Python subprocess dengan `x-access-token` auth
- License: MIT

## Deliverables
| Item | Status |
|------|--------|
| Monorepo structure | ✅ |
| Django project + 7 apps | ✅ |
| Django models (10 models) | ✅ |
| API serializers + views + URLs | ✅ |
| JWT auth (custom token serializer) | ✅ |
| React project + 10 pages | ✅ |
| Flutter project + 6 screens | ✅ |
| README.md | ✅ |
| Git repo initialized | ✅ |

## Catatan
- Rename `frontend/` → `web/` untuk konsistensi naming
- Custom User model: `AbstractBaseUser` (bukan `AbstractUser`), tidak punya `get_full_name()`
- Vite proxy: `/api` → `http://localhost:8000`
- Flutter `baseUrl`: `http://localhost:8000/api`
