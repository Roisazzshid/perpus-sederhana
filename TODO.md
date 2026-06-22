# TODO - Migrasi Frontend React (Vite) ke Next.js

## Step 1
- [x] Buat struktur project Next.js di folder `frontend/` (App Router: `frontend/app/*`).


## Step 2
- [x] Ganti `frontend/package.json` dari Vite+React menjadi Next.js.


## Step 3
- [x] Pindahkan UI dari `frontend/src/App.jsx` ke `frontend/app/page.tsx` (pakai `"use client"`).


## Step 4
- [x] Pindahkan styling dari `frontend/src/style.css` ke `frontend/app/globals.css` dan link di `frontend/app/layout.tsx`.


## Step 5
- [x] Ubah env base API dari `VITE_API_BASE` menjadi `NEXT_PUBLIC_API_BASE`.


## Step 6
- [x] Hapus file Vite yang tidak dipakai (`frontend/index.html`, `frontend/vite.config.js`, `frontend/src/main.jsx`, dll).



## Step 7
- [x] Update `README.md` instruksi setup frontend Next.js.


## Step 8
- [ ] Jalankan dan test: `backend` + `frontend`.

