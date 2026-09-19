# Status Fitur

Legenda: ⬜ belum · 🟨 sebagian · ✅ selesai

| Requirement                          | Status | Catatan |
|--------------------------------------|--------|---------|
| Menampilkan entitas pada peta        | ✅     | Menggunakan MapLibre GL JS + OpenStreetMap raster tiles, GeoJSON source & layers (circle styling dinamis berdasarkan tipe entitas) |
| Menambah entitas                     | ✅     | Form interaktif dengan validasi Zod + fitur interaktif "Pick on Map" untuk memilih koordinat langsung dari peta |
| Mengubah entitas                     | ✅     | Edit form terintegrasi dengan validasi Zod & TanStack Query cache invalidation |
| Menghapus entitas                    | ✅     | Konfirmasi modal penghapusan dengan umpan balik toast notifikasi |
| Detail entitas pada peta             | ✅     | Klik marker/lingkaran entitas pada peta membuka infowindow card interaktif di peta + modal detail lengkap dengan atribut dinamis JSON (view toggle Key-Value / Raw JSON) |
| Klasterisasi & Peta Panas (Heatmap)  | ✅     | Superclustering spasial native WebGL MapLibre (click-to-expand zoom) + Density Heatmap gradasi warna hijau brand + Anti-slop segmented view switcher & dynamic legend berbasis pure react-icons |
| Validasi di backend                  | ✅     | Menggunakan `go-playground/validator/v10` dengan field-level error mapping ke envelope standar 422, validasi nama minimal 3 karakter, case-insensitive enums |
| Validasi di frontend                 | ✅     | Schema Zod sinkron 100% dengan contract backend (`entityInputSchema`), form validation via `react-hook-form`, validasi sintaks JSON atribut secara real-time |
| Desain & Tema                        | ✅     | Pure Light Theme (tanpa dark mode), palet warna ColorBrewer 9-shade green (#F7FCF5 s/d #00441B), tipografi Poppins |
| Dokumentasi: cara menjalankan        | ✅     | Panduan lengkap di `README.md` (backend Go + frontend Vite) |
| Dokumentasi: alasan pemilihan library| ✅     | Terperinci di `docs/DECISIONS.md` |
| Dokumentasi: workflow Agentic AI     | ✅     | Catatan transparan dan log pengerjaan di `docs/AI_WORKFLOW.md` |
| AGENTS.md / CLAUDE.md                | ✅     | Tersedia `AGENTS.md`, `CLAUDE.md`, dan `AGENT.md` di root repositori |

## Belum selesai / batasan

Semua requirement inti berhasil diselesaikan secara penuh (100%).
Catatan operasional:
- Render entitas pada peta secara sengaja menggunakan GeoJSON source + vector circle layers (bukan DOM HTML marker) untuk memastikan performa tetap mulus tanpa lag saat jumlah entitas bertambah.
- Database menggunakan pure-Go SQLite (`modernc.org/sqlite`) sehingga penguji di sistem Windows tidak memerlukan kompilator C (gcc) atau setup server database eksternal.
- Auto-seed data awal langsung aktif saat server pertama kali dijalankan (memuat 46 entitas realistis yang tersebar di seluruh Pulau Jawa: Jabodetabek, Banten, Jawa Barat, Jawa Tengah, D.I. Yogyakarta, dan Jawa Timur dengan atribut dinamis lengkap). Perintah `go run ./cmd/seed` dapat dijalankan kapan saja untuk melakukan seeding/reset data.
