# Perpus Sederhana (React + Node.js + MySQL)

## Struktur
- `backend/` : Node.js (Express) REST API
- `frontend/` : React (Vite) UI
- `database/schema.sql` : SQL schema untuk MySQL

## 1) Setup Database (MySQL)
1. Buat database & tabel dari file:
   - Import `database/schema.sql` ke MySQL Anda
2. (Opsional) Isi data dummy untuk demo:
   - Import `database/dummy-data.sql` ke MySQL Anda
3. Pastikan nama database `perpus_db` sesuai (atau ubah di `.env` backend).


## 2) Setup Backend
1. Buat file konfigurasi:
   - Copy `backend/.env.example` -> `backend/.env`
2. Atur:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `PORT` (default 5000)
3. Install & run:

```bash
cd backend
npm install
npm run dev
```
Backend akan jalan di `http://localhost:5000`.

## 3) Setup Frontend
1. Install & run:

```bash
cd frontend
npm install
npm run dev
```
Frontend akan jalan di `http://localhost:5173`.

> Jika ingin ganti URL API, set env:
> - `VITE_API_BASE` (default: `http://localhost:5000/api`)

## Endpoint API
- `GET /api/books`
- `POST /api/books`
- `GET /api/books/:id`
- `PUT /api/books/:id`
- `DELETE /api/books/:id`

- `GET /api/members`
- `POST /api/members`
- `GET /api/members/:id`
- `PUT /api/members/:id`
- `DELETE /api/members/:id`

- `GET /api/loans` (dengan join book & member)
- `POST /api/loans` (create peminjaman; mengurangi stock)
- `PUT /api/loans/:id/return` (mengembalikan buku; menambah stock)

## Catatan logika stock
- Saat `POST /api/loans`: stock buku dikurangi 1 (error bila stock <= 0)
- Saat `return`: stock ditambah 1 dan status berubah menjadi `returned`

