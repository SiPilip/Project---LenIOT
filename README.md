# Geo Entity Manager

Aplikasi web full-stack untuk menampilkan dan mengelola entitas berlokasi geografis (kendaraan, perangkat IoT, fasilitas, dll.) pada peta interaktif.

## Fitur Utama

- **Peta Interaktif (MapLibre GL JS + OSM)**: Menampilkan titik lokasi entitas dengan styling dinamis berdasarkan tipe entitas (`vehicle`, `iot_device`, `facility`, `other`) menggunakan GeoJSON source dan vector circle layers untuk performa maksimal tanpa lag.
- **CRUD Penuh**: Menambah, melihat detail, mengubah, dan menghapus entitas dengan respons interaktif langsung di antarmuka peta dan daftar samping (*sidebar*).
- **Pick Location on Map**: Kemudahan memilih titik koordinat latitude dan longitude secara akurat dengan mengklik langsung pada peta.
- **Validasi Ganda (Dual Validation)**:
  - Backend: Validasi ketat deklaratif via `go-playground/validator/v10` dengan pemetaan field error spesifik pada envelope HTTP 422.
  - Frontend: Validasi *real-time* via schema Zod (`entityInputSchema`) yang terhubung langsung dengan `react-hook-form`.
- **Database Pure Go (SQLite)**: Menggunakan driver `modernc.org/sqlite` murni Go tanpa dependensi CGO, siap dijalankan di Windows maupun Linux/macOS tanpa konfigurasi compiler C tambahan.
- **Pencarian & Filter**: Pencarian teks instan berdasarkan nama dan filter multi-kategori (tipe dan status).

Status lengkap tiap fitur: [docs/PROGRESS.md](docs/PROGRESS.md)

---

## Prasyarat

- **Go**: versi 1.22+ (teruji pada Go 1.26)
- **Node.js**: versi 20+ (teruji pada Node 24)
- **PowerShell** (Windows) atau **Bash** (macOS/Linux)

---

## Cara Menjalankan

Jalankan backend dan frontend di dua terminal terpisah.

### 1. Menjalankan Backend (Port 8080)

```powershell
cd backend
# Salin file konfigurasi environment
Copy-Item .env.example .env

# Jalankan server API
go run ./cmd/api
```

> API akan aktif di `http://localhost:8080`.
> Health check dapat diuji melalui `http://localhost:8080/health`.

### 2. Menjalankan Frontend (Port 5173)

```powershell
cd frontend
# Salin file environment (default: VITE_API_BASE_URL=http://localhost:8080/api/v1)
Copy-Item .env.example .env

# Pasang dependensi dan jalankan dev server
npm install
npm run dev
```

> Buka peramban di `http://localhost:5173` untuk menggunakan aplikasi.

---

## Testing & Quality Check

Untuk menjalankan semua pengujian kualitas otomatis (gofmt, go vet, go test, tsc, lint, vitest, dan vite build), jalankan script berikut dari root repositori:

```powershell
# Jalankan seluruh pengecekan (Backend + Frontend)
.\scripts\check.ps1

# Atau jalankan salah satu saja:
.\scripts\check.ps1 -Only backend
.\scripts\check.ps1 -Only frontend
```

Di macOS / Linux, pengujian manual per direktori:

```bash
# Backend
cd backend && gofmt -l . && go vet ./... && go test ./...

# Frontend
cd frontend && npx tsc --noEmit && npm run lint && npm test && npm run build
```

---

## Struktur Direktori

```
backend/
  cmd/api/            # main.go: wiring DB, service, routing Gin, server listener
  internal/config/    # Pemrosesan konfigurasi environment (.env)
  internal/domain/    # Model Entity, enum type & status, domain errors
  internal/repository/# Interface EntityRepository & implementasi pure-Go SQLite
  internal/service/   # Logika bisnis, validasi ID UUID, timestamp UTC RFC3339
  internal/handler/   # Controller Gin HTTP, envelope respons & pemetaan error
  internal/validation/# Validator struct, aturan koordinat & pemetaan field error
  migrations/         # DDL migrasi skema tabel entities
frontend/
  src/api/            # Klien HTTP & hook state server TanStack Query
  src/components/
    map/              # Komponen MapView (MapLibre GL JS + OSM tiles)
    entity/           # Form modal, card, list, dan modal detail
    ui/               # Button, Badge, Modal dialog
  src/schemas/        # Schema validasi Zod (single source of truth)
  src/types/          # Type definition TypeScript
docs/                 # Dokumentasi keputusan, progress, workflow AI, dan API
scripts/              # check.ps1 (skrip verifikasi kualitas otomatis)
```

---

## Dokumentasi Terkait

- **Keputusan Arsitektur & Library**: [docs/DECISIONS.md](docs/DECISIONS.md)
- **Workflow & Kolaborasi Agentic AI**: [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)
- **Spesifikasi Kontrak API**: [docs/API.md](docs/API.md)
- **Panduan AI Agent**: [AGENTS.md](AGENTS.md)
