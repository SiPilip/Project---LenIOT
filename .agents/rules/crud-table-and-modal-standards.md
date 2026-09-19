# Aturan Baku: Standar Tabel Data (TanStack Table), Sheet Drawer, Context Menu, Dialog, dan Validasi Formulir Zod

Dokumen ini adalah aturan permanen bagi agen dan pengembang untuk seluruh modul data tabel (CRUD/manajemen entitas) serta formulir modal dan drawer pada aplikasi Skula (`web/apps/console`). Setiap fitur yang dibangun atau direfaktor WAJIB mengikuti standar interaksi dan validasi ini secara konsisten.

---

## 1. Standar Komponen Tabel Data (TanStack Table v8)
1. **Wajib Menggunakan `@tanstack/react-table` (v8)**:
   - Seluruh daftar data/tabel wajib dikelola menggunakan hook `useReactTable` dari `@tanstack/react-table`.
   - Dilarang merender data tabel mentah tanpa pengatur kolom, sorting, dan paginasi yang terstruktur.
2. **Paginasi Terintegrasi**:
   - Setiap tabel wajib menyediakan paginasi:
     - Selector ukuran halaman (*Rows per page*: 10, 25, 50, 100).
     - Navigasi halaman: Tombol *Previous*, *Next*, serta indikator nomor halaman aktif.
     - Ringkasan data yang ramah pengguna, contoh: `Menampilkan 1-10 dari 48 data`.
3. **Sorting & Multi-Kriteria Filtering**:
   - Kolom-kolom utama (Nama, Nomor Identitas/NIP/NISN, Kategori/Role, Status) wajib mendukung *sorting* naik/turun saat header kolom diklik.
   - Sediakan kontrol filter yang mencakup:
     - Input pencarian teks (pencarian real-time atau debounced).
     - Dropdown filter kategori, peran/otorisasi, tipe kepegawaian, atau status entitas.
     - Tombol reset/clear filter jika terdapat filter aktif.
4. **Sinkronisasi Cache dengan TanStack Query**:
   - Data diambil melalui `useQuery` yang terhubung ke service `@skula/api-client`.
   - Setiap aksi mutasi (*create*, *update*, *toggle status*, *delete*) wajib melakukan invalidasi cache query melalui `queryClient.invalidateQueries({ queryKey: [...] })` agar data di tabel terbarui secara instan.

---

## 2. Interaksi Baris Tabel: Klik Baris -> Detail via Sheet Drawer
1. **Drawer Samping (`Sheet`) untuk Detail Entitas**:
   - Mengklik baris tabel (`<TableRow onClick={...}>`) WAJIB membuka drawer samping menggunakan komponen `Sheet` (`@/components/ui/sheet` berbasis Radix UI).
   - Hindari navigasi pindah halaman penuh hanya untuk melihat informasi detail atau melakukan edit cepat.
2. **Konten Sheet Drawer**:
   - **Mode Baca (Read Detail)**: Tampilkan profil lengkap, informasi kontak, metadata (waktu dibuat/diperbarui), peran otorisasi, dan status aktif.
   - **Mode Edit Langsung (Inline Update Form)**: Sediakan tab atau tombol beralih ke form edit langsung di dalam Sheet agar pengurus tidak perlu berpindah tempat untuk memperbarui data.
   - **Aksi Cepat**: Sediakan tombol ganti status (aktif/nonaktif) dan tombol hapus langsung dari dalam Sheet drawer.

---

## 3. Interaksi Klik Kanan: Context Menu pada Baris Tabel
1. **Wajib Membungkus Baris Tabel dengan `ContextMenu`**:
   - Setiap baris tabel wajib dapat diklik kanan untuk memunculkan menu konteks menggunakan `@/components/ui/context-menu` (berbasis Radix UI).
2. **Item Menu Standar Klik Kanan**:
   - **Lihat Detail**: Membuka Sheet drawer untuk entitas yang diklik.
   - **Edit Data**: Membuka Sheet langsung pada tab edit atau membuka form dialog edit.
   - **Aktifkan / Nonaktifkan**: Memicu dialog konfirmasi pengubahan status aktif entitas.
   - **Hapus Data / Akun**: Memicu dialog konfirmasi penghapusan entitas (warna teks merah/destructive).

---

## 4. Eradikasi Popup Peramban & Standar Dialog Modal
1. **Dilarang Keras Menggunakan Native Popups**:
   - Dilarang menggunakan `window.confirm()`, `window.alert()`, maupun `window.prompt()`.
2. **Gunakan Radix UI Dialog Primitive**:
   - Semua modal form (misal: Tambah Data Baru) dan konfirmasi aksi kritis (misal: Hapus Akun, Ubah Status) wajib menggunakan komponen `Dialog` (`@/components/ui/dialog`).
3. **Anatomi Dialog yang Benar**:
   - `DialogHeader`, `DialogTitle`, dan `DialogDescription` wajib menyertakan konteks spesifik (menyebutkan nama objek atau ID yang terkena dampak).
   - `DialogFooter` harus menyediakan tombol *Batal* dan tombol *Konfirmasi/Simpan*.
   - Tombol konfirmasi wajib menampilkan state loading (spinner + disabled) selama mutasi API sedang berjalan (`isPending`).
   - Aksi destruktif (seperti hapus) wajib menggunakan tombol berwarna merah semantik (`bg-red-600 hover:bg-red-700 text-white`).

---

## 5. Standar Validasi Formulir & Visual Error Feedback (Zod & React Hook Form)
1. **Mode Validasi Realtime (`mode: 'onChange'`)**:
   - Seluruh form yang menggunakan `useForm` dan Zod resolver (`zodResolver(...)`) WAJIB menyertakan opsi `mode: 'onChange'` agar validasi berjalan instan saat pengguna mengetik dan menyentuh field input.
2. **Visual Error State pada Input**:
   - Setiap elemen `<input>`, `<select>`, `<textarea>`, atau pembungkus pilihan opsi wajib memiliki penanda visual merah tegas ketika field tersebut memiliki error (`errors.<field>`):
     ```tsx
     className={`... transition-colors ${
       errors.field_name
         ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
         : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-500'
     }`}
     ```
3. **Pesan Peringatan Validasi Inline**:
   - Tampilkan pesan kesalahan Zod secara eksplisit tepat di bawah input menggunakan ikon `<AlertCircle className="h-3.5 w-3.5 shrink-0" />`.
   - Untuk input berpanjang tetap seperti **NIK (16 digit)** atau **NISN (10 digit)**, wajib menampilkan indikator counter karakter langsung (contoh: `(watch('nik')?.length || 0)/16 digit`) beserta panduan bantuan teks jika input belum memenuhi syarat.
4. **Pencegahan Silent Rejection (`onInvalid` Callback)**:
   - Dilarang hanya menulis `<form onSubmit={handleSubmit(onSuccess)}>`.
   - WAJIB menyertakan callback penanganan error `onInvalid`:
     `<form onSubmit={handleSubmit(onSuccess, onInvalid)}>`
   - Fungsi `onInvalid` wajib membaca entri error pertama dan menampilkan toast peringatan deskriptif (misal: `toast.error('Peringatan Validasi: NIK - Format harus berupa tepat 16 digit angka')`). Hal ini mencegah pengguna bingung saat tombol Simpan diklik namun form tidak tersimpan tanpa feedback visual jika field yang bermasalah berada di luar viewport layar.

---

## 6. Prinsip Anti-Slop UI & Tipografi
1. **Larangan Karakter Em Dash**:
   - Jangan pernah menggunakan karakter em dash (`—`) sebagai placeholder data kosong atau pemisah teks. Gunakan tanda minus biasa `-` atau teks deskriptif seperti `Belum diisi` / `Tidak tersedia`.
2. **Hierarki Visual & Kontras WCAG AA**:
   - Gunakan warna latar netral (`slate`, `zinc`) dengan border lembut (`border-slate-200` / `dark:border-slate-800`).
   - Badge status harus memiliki kontras jelas dengan background tint lembut (contoh: status Aktif menggunakan badge emerald lembut, status Nonaktif menggunakan badge amber/slate).
3. **State Lengkap**:
   - Sediakan **Loading State** (Skeleton loader yang menyerupai baris tabel).
   - Sediakan **Empty State** kontekstual (menjelaskan mengapa tabel kosong dan memberikan tombol tambah atau reset filter).
   - Sediakan **Error State** dengan pesan kesalahan yang jelas dan tombol *Coba Lagi* (*Retry*).

---

## 7. Kebijakan Commit, Push, dan Rebuild Container Docker
1. **Penyelesaian End-to-End**:
   - Ketika terdapat perbaikan bug atau penambahan fitur yang membutuhkan perubahan di backend Go (`golang`) dan frontend (`web`), perbaikan harus dilakukan pada kedua direktori secara tuntas hingga lolos uji tes dan *build*.
2. **Wajib Rebuild Container Docker Backend**:
   - Setiap perubahan kode Go di backend wajib diikuti dengan rebuild dan restart kontainer Docker terkait:
     `docker compose -f deployments/docker-compose.yml up -d --build <service-name>-service`
3. **Conventional Commits & Push Langsung**:
   - Gunakan format Conventional Commits (misal: `feat(users): ...`, `fix(academic): ...`).
   - Lakukan commit dan push langsung ke remote repository kedua repositori (`golang` dan `web`).
