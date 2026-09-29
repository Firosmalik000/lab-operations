# Laboratory Operations Portal

Portal operasional laboratorium berbasis Laravel dan Inertia untuk pencatatan penggunaan bahan, master data, inventory opsional, pelaporan, dan audit yang dapat ditelusuri.

## Stack

- PHP 8.3+ dan Laravel 13
- Inertia.js 3, React 19, TypeScript
- Tailwind CSS 4 dan komponen shadcn/ui/Radix
- Fortify untuk autentikasi
- PHPUnit, PHPStan, Pint, dan Vite Plus
- MySQL untuk setup lokal; skema memakai fitur relasional yang tetap portabel ke database relasional yang didukung Laravel

## Setup lokal

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run dev
```

Konfigurasi contoh menggunakan MySQL di `127.0.0.1:3307`, database `lab-operation`, user `root`, dan password kosong. Sesuaikan kredensial tersebut untuk environment lain. Jalankan build produksi dengan `npm run build`.

File TypeScript Wayfinder di `resources/js/actions`, `resources/js/routes`, dan `resources/js/wayfinder` disimpan di Git agar build produksi tidak perlu menjalankan proses PHP tambahan. Setelah mengubah route atau controller, perbarui file tersebut sebelum commit:

```bash
npm run wayfinder:generate
```

## Validasi dan pengujian

```bash
composer test
npm run check
npm run types:check
npm run build
```

## Akun demo lokal

Seeder hanya membuat akun berikut ketika `APP_ENV=local`:

- Email: `admin@lab.test`
- Password: `password`
- Role: Super Admin

Seeder tidak membuat akun berpassword tertebak pada environment produksi.

## Role awal

- Super Admin: seluruh laboratorium dan seluruh permission
- Lab Admin: administrasi operasional laboratorium
- Supervisor: penggunaan, void, inventory baca, dan laporan
- Staff: dashboard serta catat/lihat penggunaan pada laboratorium yang diizinkan
- Inventory Admin: stok awal, penerimaan, penyesuaian, dan laporan inventory
- QA/QC: akses baca, laporan, serta audit

Otorisasi diterapkan pada route/controller Laravel, bukan hanya dengan menyembunyikan menu. User dapat dipetakan ke satu atau lebih laboratorium dan memiliki laboratorium default.

## Aturan bisnis penting

- Material Usage dan Inventory saling berkaitan tetapi independen.
- `NONE`: penggunaan dicatat tanpa movement stok.
- `STOCK`: penggunaan SUBMITTED membuat movement negatif; stok adalah jumlah seluruh movement.
- `ASSET`: penggunaan dapat dicatat tanpa mengurangi stok consumable.
- Transaksi operasional tidak dihapus. Pembatalan memakai status `VOIDED`, alasan, aktor, waktu, dan movement `REVERSAL` untuk item STOCK.
- Aktivasi inventory di kemudian hari tidak menulis ulang penggunaan lama; saldo dimulai dengan Opening Stock.
- Identitas petugas selalu berasal dari user yang terautentikasi.
- Jenis dan kategori item adalah master data dinamis, bukan enum bisnis di source code.

## Status implementasi

Tersedia: autentikasi, pemetaan role/laboratorium pengguna, administrasi pengguna dan permission, master item dan referensi, pemetaan item-laboratorium, penggunaan multi-item, draft/edit/submit, riwayat/detail/void, stok awal, penerimaan, penyesuaian, ledger, saldo stok, dashboard, tujuh laporan CSV, dan audit log.

Alur utama telah diverifikasi melalui pengujian fitur, PHPStan level 7, lint/format frontend, pemeriksaan TypeScript, build produksi, serta browser pada ukuran mobile, tablet, dan desktop. Sebelum deployment produksi tetap lakukan peninjauan konfigurasi environment, backup, observability, email, queue, dan kebijakan operasional organisasi.

Draft tidak membuat movement. Pengguna dengan permission `material-usage.update` dapat mengubah atau submit draft dalam laboratorium yang diizinkan. Transaksi SUBMITTED tidak dapat diedit; koreksi dilakukan melalui void. Pembalikan menggunakan movement asli, termasuk ketika mode inventory item berubah setelah transaksi.

Dependency development tersedia melalui instalasi Composer standar. Optimasi autoloader dinonaktifkan secara default untuk menghindari perlambatan classmap pada lingkungan Windows lokal; deployment dapat tetap memakai `composer install --no-dev --optimize-autoloader`.

## Ekstensi V2

Struktur laboratorium, item, transaksi, ledger, audit, serta permission disiapkan untuk equipment/assets, calibration, maintenance, sampling, sample registration, chain of custody, testing parameters/results, QA/QC workflow, COA, dan customer portal. Modul-modul tersebut sengaja belum ditampilkan atau diimplementasikan pada V1.
