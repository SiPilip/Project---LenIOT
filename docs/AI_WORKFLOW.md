# Workflow Penggunaan Agentic AI

> Dokumentasi transparan penggunaan Agentic AI dalam perancangan dan pembangunan Geo Entity Manager.

## Ringkasan

- Tool yang dipakai: Antigravity AI Agent (Google DeepMind)
- Seberapa jauh AI digunakan: AI berperan sebagai pair programmer berdaya penuh (agentic coding assistant) untuk menyusun blueprint arsitektur, kode scaffolding, domain logic, repository SQLite, routing Gin, validasi, komponen MapLibre GL, form Zod, dan suite pengujian otomatis. Manusia (kandidat) bertindak sebagai tech lead: menetapkan batasan (`AGENTS.md`), menyetujui rencana implementasi, serta mengawasi kualitas kode.
- Panduan agent: `AGENTS.md`, `CLAUDE.md`, dan `AGENT.md` di root repository.

## Peran saya vs peran agent

| Saya (Manusia / Tech Lead) | Agent (Antigravity AI) |
|---|---|
| Menentukan scope take-home test dan boundary arsitektur | Merancang rencana implementasi terperinci di `implementation_plan.md` |
| Memberikan instruksi panduan dan review approval | Menulis kode Go (clean layer: domain, repo, service, handler) |
| Memvalidasi keselarasan data contract antar bahasa | Mengimplementasikan schema Zod dan mapping di client API frontend |
| Memastikan prinsip no-DOM-marker untuk performa peta | Mengintegrasikan MapLibre GL dengan layer GeoJSON dan raster OSM |
| Memverifikasi hasil build dan test runner | Menjalankan `.\scripts\check.ps1`, mendeteksi error linter/compiler, dan memperbaiki hingga 100% green |

## Tahapan Pengerjaan

### 1. Planning & Desain Sistem
- Mengurai requirement dari dokumen Take-Home Test PDF.
- Mendefinisikan data contract tunggal (9 field: `id`, `name`, `type`, `status`, `description`, `latitude`, `longitude`, `created_at`, `updated_at`).
- Menetapkan response & error envelope standar di `docs/API.md`.
- Merumuskan aturan main di `AGENTS.md` (larangan chaining bash `&&`, kewajiban validasi ganda, pure Go SQLite tanpa CGO).

### 2. Pembangunan Backend (Slice 1)
- Struktur berlapis (Layered Clean Architecture):
  - `domain`: Model entitas, konstanta enum tipe & status, error sentinel (`ErrNotFound`, `ErrInvalidID`, `ErrValidationFail`).
  - `repository`: Antarmuka `EntityRepository` dan implementasi pure Go SQLite (`modernc.org/sqlite`) dengan migrasi otomatis.
  - `validation`: Engine validasi deklaratif dengan pesan error spesifik dan mapping field ke snake_case.
  - `service`: Business logic, validasi ID UUID, penetapan timestamp RFC3339 UTC.
  - `handler`: Controller Gin HTTP dengan mapping error status code (400, 404, 422, 500).
- Pengujian otomatis:
  - Table-driven unit tests untuk aturan validasi (`validator_test.go`).
  - CRUD database in-memory (`sqlite_test.go`).
  - HTTP endpoint integration test via `net/http/httptest` (`handler_test.go`).

### 3. Pembangunan Frontend (Slice 2)
- Scaffolding Vite React TypeScript dengan strict type safety.
- Pengaturan styling modern via Tailwind CSS.
- Integrasi MapLibre GL JS:
  - Menggunakan OpenStreetMap raster tiles (bebas API key).
  - Menggunakan GeoJSON FeatureCollection dan vector circle layers untuk render titik entitas berkinerja tinggi.
  - Interaksi klik dua arah: klik entitas membuka detail, klik peta dalam mode "Pick on Map" otomatis mengisi input koordinat form.
- State management dan integrasi API:
  - TanStack Query (`useEntities`, `useCreateEntity`, `useUpdateEntity`, `useDeleteEntity`).
  - Single-point mapping antara JSON snake_case backend ke camelCase TypeScript di `src/api/client.ts`.
  - Form validation via React Hook Form + Zod resolver (`entityInputSchema`).

### 4. Quality Assurance & Refactoring
- Menjalankan `.\scripts\check.ps1`.
- Memperbaiki peringatan linter Oxlint dan sinkronisasi typing Zod 4 / React Hook Form.
- Menjamin seluruh suite test backend dan frontend lulus tanpa cacat.

## Keterbatasan & Solusi Teknis
- **Performa Peta**: Menghindari pemakaian HTML/DOM marker yang lambat jika entitas banyak; diganti dengan native WebGL GeoJSON layers di MapLibre GL.
- **Portabilitas Windows**: Menggunakan `modernc.org/sqlite` alih-alih `mattn/go-sqlite3` agar reviewer di Windows tidak perlu menginstal GCC/MinGW.

## Log Sesi

| Tanggal | Slice / Tugas | Yang Dikerjakan Agent | Yang Saya Review / Ubah |
|---|---|---|---|
| 2026-09-19 | Scaffolding & Setup | Setup direktori, AGENTS.md, dokumen panduan, check.ps1 | Review dan persetujuan implementation plan |
| 2026-09-19 | Slice 1: Backend CRUD | Implementasi domain, repository SQLite, validator/v10, service, handler, dan unit tests | Verifikasi error envelope & status code 422 |
| 2026-09-19 | Slice 2: Frontend & Map | Implementasi MapLibre GL, TanStack Query, form modal, card, dan unit tests | Verifikasi interaksi peta dan form validation |
| 2026-09-19 | Verifikasi Akhir | Menjalankan .\scripts\check.ps1, merapikan build bundle & dokumentasi | Final review kelengkapan berkas repositori |
