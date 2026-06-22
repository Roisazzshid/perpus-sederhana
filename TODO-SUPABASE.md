# TODO - Integrasi Supabase (Backend Express tetap)

- [x] 1. Buat schema Supabase Postgres + enum + tabel books/members/loans

- [x] 2. Tambahkan RPC: create_loan_and_decrease_stock (atomic)

- [x] 3. Tambahkan RPC: return_loan_and_increase_stock (atomic)

- [ ] 4. Update backend: ganti mysql2 => supabase client (service role)

- [ ] 5. Refactor route: books/members/loans (loans pakai RPC)
- [ ] 6. Update/cek env Vercel: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- [ ] 7. Test lokal (npm run dev) + uji deploy

