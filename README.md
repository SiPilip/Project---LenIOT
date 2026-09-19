# Geo Entity Manager

Aplikasi web untuk menampilkan dan mengelola entitas berlokasi geografis
(kendaraan, perangkat IoT, fasilitas, dll.) pada peta.

## Fitur

- Menampilkan entitas pada peta
- Menambah, mengubah, dan menghapus entitas
- Melihat detail entitas pada peta
- Validasi input di frontend (Zod) dan backend (validator/v10)

Status lengkap tiap fitur: [docs/PROGRESS.md](docs/PROGRESS.md)

## Prasyarat

- Go (versi stabil terbaru)
- Node.js 20+ dan npm

## Cara Menjalankan

Jalankan backend dan frontend di dua terminal terpisah.
Contoh di bawah untuk Windows (PowerShell); di macOS/Linux ganti `copy` dengan `cp`.

### 1. Backend

```powershell
cd backend
copy .env.example .env
go run ./cmd/api
# API berjalan di http://localhost:8080
```

### 2. Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
# Aplikasi berjalan di http://localhost:5173
```

## Testing

Windows (PowerShell), dari root repository:

```powershell
.\scripts\check.ps1
```

macOS/Linux atau manual, jalankan per direktori:

```bash
cd backend && gofmt -l . && go vet ./... && go test ./...
cd frontend && npx tsc --noEmit && npm run lint && npm test && npm run build
```

## Struktur Proyek

Lihat bagian *Layout* di [AGENTS.md](AGENTS.md).

## Dokumentasi Lain

- Alasan pemilihan library: [docs/DECISIONS.md](docs/DECISIONS.md)
- Workflow penggunaan Agentic AI: [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)
- Kontrak API: [docs/API.md](docs/API.md)

## Fitur yang Belum Selesai

Lihat bagian *Belum selesai / batasan* di [docs/PROGRESS.md](docs/PROGRESS.md).
