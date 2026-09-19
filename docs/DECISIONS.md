# Alasan Pemilihan Library

> Dokumentasi alasan pemilihan teknologi dan dependensi pada Geo Entity Manager.

## Backend

| Library / teknologi | Kegunaan | Alasan |
|---|---|---|
| Gin | HTTP framework | Ringan, routing/middleware matang, performa tinggi, dan umum dipakai di ekosistem Go |
| go-playground/validator/v10 | Validasi struct | Rule deklaratif via struct tag (rentang koordinat, panjang, enum), mudah dipetakan ke field errors standar |
| modernc.org/sqlite | Database driver | Pure Go tanpa CGO/instalasi server DB, reviewer cukup `go run` (kompatibel penuh di Windows tanpa perlu gcc) |
| gin-contrib/cors | Middleware CORS | Konfigurasi origin frontend secara eksplisit dan aman |
| google/uuid | Identifier generator | Standar industri untuk UUID v4 yang aman dan unik |

## Frontend

| Library / teknologi | Kegunaan | Alasan |
|---|---|---|
| Vite + React + TypeScript | Fondasi UI | Dev server ultra-cepat, HMR efisien, type-safety ketat (`strict: true`) |
| MapLibre GL JS | Peta | Open-source, tanpa ketergantungan API key, render GeoJSON layer berbasis WebGL (performa tinggi untuk banyak entitas) |
| TanStack Query | Server state management | Otomatisasi caching, refetch background, deduplikasi request, dan invalidasi query setelah mutasi |
| Zod + react-hook-form | Form & validasi | Satu schema Zod menjadi single-source of truth untuk validasi client-side dan inferensi tipe TypeScript |
| Tailwind CSS | Styling sistem | Desain UI modern, responsif, dan konsisten tanpa boilerplate CSS besar |
| Vitest + Testing Library | Automated testing | Runner test modern yang terintegrasi langsung dengan konfigurasi Vite dan jsdom |
