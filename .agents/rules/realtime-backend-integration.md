# Aturan Baku: Integrasi Realtime Backend Go & Eradikasi Mock Data

## 1. Prinsip Realtime & Zero Mock Data
- **Konsol Skula pada hakikatnya harus 100% realtime dan benar-benar terintegrasi dengan backend Go melalui Kong Gateway (`/api/v1`)**.
- **Dilarang keras menggunakan mock data, data statis dummy, atau fallback tiruan** di dalam blok `catch` pada API services di `@skula/api-client` maupun di komponen UI `apps/console`.
- Jika backend mengembalikan koleksi kosong (`[]`), UI harus menampilkan *empty state* yang bersih dan kontekstual, bukan mengisi paksa dengan data mock.
- Jika request backend mengalami error (misal jaringan terputus, 500 internal server error, 401 unauthenticated), service API WAJIB melempar error asli (*throw error*) agar tertangkap oleh TanStack Query / UI error boundary dan memicu feedback pengguna (error alert / toast / retry banner) yang jujur.

## 2. Kebijakan Perbaikan Cross-Layer (Frontend & Backend Go)
- **Tiap kesalahan atau kegagalan yang terjadi pada frontend tidak menutup kemungkinan perbaikan pada backend Go juga akan dilakukan.**
- Jika ditemukan ketidakcocokan kontrak (mismatch DTO, field mapping, query param yang hilang, status 404 pada route, atau error RLS 401 "Tenant context tidak ditemukan"):
  1. Agent/pengembang **WAJIB menginvestigasi kode backend Go** di `golang/internal/...` dan `golang/pkg/...`.
  2. Lakukan perbaikan langsung pada handler, service, repository, routing Kong, atau skema database PostgreSQL.
  3. Lakukan kompilasi ulang (*rebuild*) dan *restart* mikroservis Go yang bersangkutan.
  4. Larangan menyembunyikan kekurangan backend dengan jalan pintas membuat *local mock* di frontend.

## 3. Autentikasi dan Konteks Multitenancy
- Autentikasi harus diverifikasi langsung oleh `identity` service (`POST /api/v1/identity/login`) yang memvalidasi hash bcrypt di PostgreSQL dan menyimpan sesi aktif di Redis (`session:<id>`).
- Dilarang membuat generator token palsu (*fallback JWT / mock session*) di frontend.
- Setiap panggilan API wajib menyertakan identitas tenant (`X-Tenant-ID`) dan token sesi (`Authorization: Bearer <token>` atau HttpOnly Cookie `session_id`).
- Pada backend Go, handler wajib meneruskan `tenantID` ke `c.Request.Context()` melalui `authctx.WithTenantID` agar kebijakan Row Level Security (RLS) pada PostgreSQL selalu aktif dan terisolasi per tenant.
