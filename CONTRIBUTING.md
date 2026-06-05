# 🤝 Contributing to Mercury POS

Terima kasih atas minat Anda untuk berkontribusi! Dokumen ini menjelaskan cara berkontribusi ke proyek Mercury POS.

## Daftar Isi

- [Code of Conduct](#code-of-conduct)
- [Cara Berkontribusi](#cara-berkontribusi)
- [Setup Development](#setup-development)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

- Hormati semua kontributor
- Terima feedback dengan terbuka
- Fokus pada yang terbaik untuk komunitas
- Tunjukkan empati terhadap sesama developer

## Cara Berkontribusi

Anda bisa berkontribusi dengan:

1. 🐛 **Melaporkan bug** — buka Issue dengan template bug report
2. ✨ **Mengajukan fitur** — buka Issue dengan template feature request
3. 📝 **Memperbaiki dokumentasi** — typo, penjelasan, contoh kode
4. 💻 **Mengirim kode** — fix bug atau implementasi fitur baru
5. 🧪 **Menambahkan tests** — meningkatkan coverage
6. 🌐 **Menerjemahkan** — i18n support

## Setup Development

See [README.md](../README.md#-quick-start) for full setup instructions.

### Quick Setup

```bash
# Clone
git clone https://github.com/bocahlinux/mercury-pos.git
cd mercury-pos

# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
python manage.py migrate && python manage.py runserver

# Web (new terminal)
cd web && npm install && cp .env.example .env
npm run dev
```

## Branching Strategy

Gunakan format berikut untuk branch:

```
feature/deskripsi-fitur      # Fitur baru
bugfix/deskripsi-fix         # Bug fix
docs/deskripsi-dokum         # Dokumentasi
refactor/deskripsi           # Refactoring
test/deskripsi-test          # Menambahkan tests
```

**Contoh:**
```
feature/barcode-search
bugfix/negative-stock
docs/api-authentication
```

## Commit Convention

Gunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <deskripsi singkat>

[body opsional — jelaskan WHY, bukan WHAT]
```

### Type

| Type | Kapan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Dokumentasi |
| `style` | Formatting, tidak ubah logic |
| `refactor` | Refactoring code |
| `test` | Menambahkan/memperbaiki test |
| `chore` | Build, deps, config |
| `perf` | Performance improvement |

### Contoh

```
feat: add offline sync for Flutter POS

- Add SQLite local storage for transactions
- Sync queue with retry logic
- Conflict resolution: server wins
```

```
fix: prevent negative stock on refund

- Add validation in TransactionSerializer
- Return 400 if refund quantity > sold quantity
- Add tests for edge cases
```

## Pull Request Process

1. **Fork** repo dan buat branch dari `main`
2. **Pastikan semua test passing**:
   ```bash
   # Backend
   cd backend && python manage.py test accounts.tests
   
   # Web
   cd web && npm test
   ```
3. **Update dokumentasi** jika ada perubahan API atau setup
4. **Buka PR** ke branch `main` dengan deskripsi yang jelas
5. **Tunggu review** — minimal 1 approval sebelum merge
6. **Squash merge** saat merge ke main

### PR Template

```markdown
## Deskripsi
<!-- Jelaskan perubahan yang dilakukan -->

## Type
- [ ] feat (fitur baru)
- [ ] fix (bug fix)
- [ ] docs (dokumentasi)
- [ ] refactor
- [ ] test

## Checklist
- [ ] Tests passing
- [ ] No breaking changes
- [ ] Dokumentasi updated (jika perlu)
- [ ] Sesuai dengan code style
```

## Code Style

### Python / Django
- Ikuti [PEP 8](https://peps.python.org/pep-0008/)
- Gunakan type hints untuk functions
- Docstrings untuk public methods (`"""..."""`)
- Max line length: 120 chars
- Gunakan `isort` untuk import sorting

### TypeScript / React
- Ikuti [ESLint config](web/.eslintrc) yang sudah ada
- Strict mode enabled
- Gunakan functional components + hooks
- Props wakai TypeScript interface
- File naming: `PascalCase.tsx`

### Flutter / Dart
- Ikuti [Effective Dart](https://dart.dev/effective-dart)
- Gunakan `const` constructors jika memungkukan
- Pisahkan business logic dari UI
- File naming: `snake_case.dart`

## Testing

### Jalur Testing

```
PR dibuat
    ↓
Tests lokal (developer)
    ↓
Minimal 1 reviewer
    ↓
Merge ke main
```

### Coverage Minimum

- Backend: 80%
- Web: 70%
- Flutter: 60%

### Run Tests

```bash
# Backend
cd backend && python manage.py test accounts.tests -v 2

# Web
cd web && npm test

# Flutter
cd mobile && flutter test
```

## Reporting Bugs

Gunakan Issue template:

```markdown
## Deskripsi Bug
<!-- Jelaskan bug yang ditemukan -->

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
<!-- Yang seharusnya terjadi -->

## Actual Behavior
<!-- Yang sebenarnya terjadi -->

## Environment
- OS: [e.g., Ubuntu 22.04]
- Browser: [e.g., Chrome 120]
- Version: [e.g., v1.0.0]

## Screenshots
<!-- Jika ada -->
```

## Requesting Features

```markdown
## Deskripsi Fitur
<!-- Jelaskan fitur yang diinginkan -->

## Problem yang Diselesaikan
<!-- Masalah apa yang akan diselesaikan -->

## Proposed Solution
<!-- Solusi yang diusulkan -->

## Alternatives
<!-- Alternatif yang sudah dipertimbangkan -->
```

## Questions?

Buka [GitHub Discussion](https://github.com/bocahlinux/mercury-pos/discussions) untuk pertanyaan umum.

---

<sub>Dibuat dengan ❤️ oleh bocahlinux + 🤖 OWL — June 2026</sub>
