USE perpus_db;

-- =====================================
-- Dummy data for demo
-- =====================================

-- Books
INSERT INTO books (title, author, isbn, stock) VALUES
  ('Laskar Pelangi', 'Andrea Hirata', '9789792298000', 5),
  ('Bumi', 'Tere Liye', '9786020322577', 3),
  ('Ayah', 'Andrea Hirata', '9789792298130', 2),
  ('Atomic Habits', 'James Clear', '9780349497711', 4);

-- Members
INSERT INTO members (name, email, phone) VALUES
  ('Andi Putra', 'andi@example.com', '081234567890'),
  ('Siti Aisyah', 'siti@example.com', '0812987654321'),
  ('Budi Santoso', 'budi@example.com', NULL);

-- Loans (peminjaman)
--
-- Catatan:
-- - Pastikan stock awal cukup.
-- - Dummy ini akan membuat beberapa loan berada di status 'borrowed' dan 'returned'.
-- =====================================

-- 1) borrowed
INSERT INTO loans (book_id, member_id, borrowed_at, status, returned_at, notes) VALUES
  (1, 1, CURRENT_TIMESTAMP, 'borrowed', NULL, 'Pinjam untuk tugas');

-- 2) borrowed
INSERT INTO loans (book_id, member_id, borrowed_at, status, returned_at, notes) VALUES
  (2, 2, CURRENT_TIMESTAMP, 'borrowed', NULL, NULL);

-- 3) returned
INSERT INTO loans (book_id, member_id, borrowed_at, status, returned_at, notes) VALUES
  (3, 1, CURRENT_TIMESTAMP, 'returned', CURRENT_TIMESTAMP, 'Sudah dikembalikan');

