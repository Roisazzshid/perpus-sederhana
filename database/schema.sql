CREATE DATABASE IF NOT EXISTS perpus_db;
USE perpus_db;

-- =====================
-- Books
-- =====================
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(50) NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- Members
-- =====================
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- Loans
-- status: borrowed | returned
-- =====================
CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  borrowed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP NULL,
  status ENUM('borrowed','returned') NOT NULL DEFAULT 'borrowed',
  notes VARCHAR(500) NULL,
  CONSTRAINT fk_loans_book FOREIGN KEY (book_id) REFERENCES books(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loans_member FOREIGN KEY (member_id) REFERENCES members(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_loans_member (member_id),
  INDEX idx_loans_status (status)
);

-- Helpful view-like query expectation:
-- Saat peminjaman, stock buku akan berkurang 1.
-- Saat return, stock buku akan bertambah 1 dan status berubah returned.

