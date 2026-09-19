# Workflow Penggunaan Agentic AI

> Dokumentasi interaksi dan kolaborasi bersama AI Agent dalam pengembangan Geo Entity Manager.

## Ringkasan

- Tool yang dipakai: Antigravity AI Agent (Google Deepmind)
- Seberapa jauh AI digunakan: AI menyusun struktur arsitektur berjenjang, menulis boilerplate, handler, repository, schema validasi, komponen antarmuka, dan test suite; ditinjau dan diarahkan oleh programmer manusia sesuai panduan `AGENTS.md`.
- Panduan agent: `AGENTS.md` / `CLAUDE.md` di root repository.

## Peran saya vs peran agent

| Saya (manusia) | Agent |
|---|---|
| Menentukan requirement & boundary spesifikasi | Menginisiasi scaffolding direktori & file panduan |
| Mereview rencana implementasi dan arsitektur | Mengimplementasikan kode backend (Clean Architecture) |
| Menguji fungsionalitas dan peta secara manual | Mengimplementasikan validasi Zod & form frontend |
| Memvalidasi error envelope dan konsistensi kontrak | Menjalankan suite pengujian dan memperbaiki failure |

## Tahapan

### 1. Planning & desain sistem
Agent menganalisis requirement dari instruksi setup, menyusun kontrak API di `docs/API.md`, serta merancang struktur berlapis: repository, service, handler di backend dan data layer TanStack Query di frontend.

### 2. Pembangunan backend
Membangun layer repository dengan pure-Go SQLite (`modernc.org/sqlite`), service ber-UUID, validasi struct `validator/v10`, serta Gin handler dengan response & error envelope standar. Ditutup dengan unit dan integration tests.

### 3. Pembangunan frontend
Scaffold aplikasi Vite React TypeScript, integrasi MapLibre GL JS dengan raster tiles OpenStreetMap (GeoJSON layer), form berbasis Zod + react-hook-form, dan state management server TanStack Query.

### 4. Testing & refactoring
Menjalankan `.\scripts\check.ps1` untuk verifikasi gofmt, go vet, go test, tsc, lint, vitest, dan build bundle produksi.

## Keterbatasan / catatan teknis
- MapLibre GL JS menggunakan layer GeoJSON langsung untuk performa dan menghindari lag DOM markers.
- SQLite pure-Go digunakan agar dapat berjalan mulus di Windows tanpa instalasi kompilator C (gcc/TDM-GCC).

## Log sesi

| Tanggal | Slice / tugas | Yang dikerjakan agent | Yang saya review / ubah |
|---|---|---|---|
| 2026-09-19 | Scaffolding awal | Menyiapkan struktur direktori, AGENTS.md, docs, dan scripts/check.ps1 | Review approval rencana implementasi |
