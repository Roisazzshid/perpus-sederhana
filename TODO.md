# TODO - Web Perpus React + Node + MySQL

## Rencana pengerjaan
1. Membuat struktur project: `backend/`, `frontend/`, `database/`.
2. Backend:
   - Setup Express server + konfigurasi `.env`.
   - Setup koneksi MySQL.
   - Buat migration/schema SQL (tabel: books, members, loans) + FK.
   - Implementasi API REST untuk:
     - Books CRUD
     - Members CRUD
     - Loans (create peminjaman) + return.
3. Frontend:
   - Setup React app.
   - Buat halaman:
     - Daftar + form CRUD Buku
     - Daftar + form CRUD Anggota
     - Peminjaman (pilih book & member) + daftar loans + tombol return.
   - Integrasi ke backend API.
4. Dokumentasi:
   - Buat `README.md` (cara import SQL, konfigurasi `.env`, cara run frontend/backend).
5. Validasi cepat:
   - Cek endpoint bisa diakses.
   - Cek alur peminjaman & pengembalian tersambung ke DB.

## Status
- [x] Database schema dibuat
- [x] Backend API dibuat (books, members, loans)
- [x] Frontend UI dibuat (CRUD + peminjaman/return)
- [x] Dokumentasi dibuat

