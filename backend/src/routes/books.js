const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/books
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Book not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/books
router.post('/', async (req, res, next) => {
  try {
    const { title, author, isbn, stock } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: 'title and author are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO books (title, author, isbn, stock) VALUES (?, ?, ?, ?)',
      [title, author, isbn || null, stock ?? 0]
    );

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, author, isbn, stock } = req.body;

    const [rowsExisting] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rowsExisting.length) return res.status(404).json({ message: 'Book not found' });

    await pool.query(
      'UPDATE books SET title = ?, author = ?, isbn = ?, stock = ? WHERE id = ?',
      [
        title ?? rowsExisting[0].title,
        author ?? rowsExisting[0].author,
        isbn === undefined ? rowsExisting[0].isbn : isbn,
        stock === undefined ? rowsExisting[0].stock : stock,
        req.params.id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const [rowsExisting] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rowsExisting.length) return res.status(404).json({ message: 'Book not found' });

    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

