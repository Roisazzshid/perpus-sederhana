const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/loans
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        l.*, 
        b.title AS book_title,
        m.name AS member_name
      FROM loans l
      JOIN books b ON b.id = l.book_id
      JOIN members m ON m.id = l.member_id
      ORDER BY l.id DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/loans (create peminjaman)
router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { book_id, member_id, notes } = req.body;
    if (!book_id || !member_id) {
      return res.status(400).json({ message: 'book_id and member_id are required' });
    }

    await conn.beginTransaction();

    // Check stock
    const [bookRows] = await conn.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [book_id]);
    if (!bookRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = bookRows[0];
    if (book.stock <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Stock buku habis' });
    }

    // Ensure member exists
    const [memberRows] = await conn.query('SELECT * FROM members WHERE id = ? FOR UPDATE', [member_id]);
    if (!memberRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Member not found' });
    }

    // Insert loan
    const [result] = await conn.query(
      'INSERT INTO loans (book_id, member_id, notes) VALUES (?, ?, ?)',
      [book_id, member_id, notes || null]
    );

    // Decrease stock
    await conn.query('UPDATE books SET stock = stock - 1 WHERE id = ?', [book_id]);

    await conn.commit();

    const [loanRows] = await pool.query(
      `SELECT l.*, b.title AS book_title, m.name AS member_name
       FROM loans l
       JOIN books b ON b.id = l.book_id
       JOIN members m ON m.id = l.member_id
       WHERE l.id = ?`,
      [result.insertId]
    );

    res.status(201).json(loanRows[0]);
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

// PUT /api/loans/:id/return
router.put('/:id/return', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [loanRows] = await conn.query('SELECT * FROM loans WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!loanRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loanRows[0];
    if (loan.status === 'returned') {
      await conn.rollback();
      return res.status(400).json({ message: 'Loan sudah dikembalikan' });
    }

    // Mark returned
    await conn.query(
      'UPDATE loans SET status = ?, returned_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['returned', req.params.id]
    );

    // Increase stock
    await conn.query('UPDATE books SET stock = stock + 1 WHERE id = ?', [loan.book_id]);

    await conn.commit();

    const [updatedRows] = await pool.query(
      `SELECT l.*, b.title AS book_title, m.name AS member_name
       FROM loans l
       JOIN books b ON b.id = l.book_id
       JOIN members m ON m.id = l.member_id
       WHERE l.id = ?`,
      [req.params.id]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;

