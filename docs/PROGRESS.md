# Status Fitur

Legenda: ⬜ belum · 🟨 sebagian · ✅ selesai

| Requirement                          | Status | Catatan |
|--------------------------------------|--------|---------|
| Menampilkan entitas pada peta        | ✅     | Menggunakan MapLibre GL JS + OpenStreetMap raster tiles, GeoJSON source & layers (circle styling dinamis berdasarkan tipe entitas) |
| Menambah entitas                     | ✅     | Form interaktif dengan validasi Zod + fitur interaktif "Pick on Map" untuk memilih koordinat langsung dari peta |
| Mengubah entitas                     | ✅     | Edit form terintegrasi dengan validasi Zod & TanStack Query cache invalidation |
| Menghapus entitas                    | ✅     | Konfirmasi modal penghapusan dengan umpan balik toast notifikasi |
| Detail entitas pada peta             | ✅     | Klik marker/lingkaran entitas pada peta membuka modal detail (koordinat, status, waktu pembuatan RFC3339, deskripsi) |
| Validasi di backend                  | ✅     | Menggunakan `go-playground/validator/v10` dengan field-level error mapping ke envelope standar 422 |
| Validasi di frontend                 | ✅     | Schema Zod sinkron 100% dengan contract backend (`entityInputSchema`), form validation via `react-hook-form` |
| Dokumentasi: cara menjalankan        | ✅     | Panduan lengkap di `README.md` (backend Go + frontend Vite) |
| Dokumentasi: alasan pemilihan library| ✅     | Terperinci di `docs/DECISIONS.md` |
| Dokumentasi: workflow Agentic AI     | ✅     | Catatan transparan dan log pengerjaan di `docs/AI_WORKFLOW.md` |
| AGENTS.md / CLAUDE.md                | ✅     | Tersedia `AGENTS.md`, `CLAUDE.md`, dan `AGENT.md` di root repositori |

## Belum selesai / batasan

Semua requirement inti berhasil diselesaikan secara penuh (100%).
Catatan operasional:
- Render entitas pada peta secara sengaja menggunakan GeoJSON source + vector circle layers (bukan DOM HTML marker) untuk memastikan performa tetap mulus tanpa lag saat jumlah entitas bertambah.
- Database menggunakan pure-Go SQLite (`modernc.org/sqlite`) sehingga penguji di sistem Windows tidak memerlukan kompilator C (gcc) atau setup server database eksternal.
