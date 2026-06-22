const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/members
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Member not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/members
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const [result] = await pool.query(
      'INSERT INTO members (name, email, phone) VALUES (?, ?, ?)',
      [name, email || null, phone || null]
    );

    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const [rowsExisting] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!rowsExisting.length) return res.status(404).json({ message: 'Member not found' });

    await pool.query(
      'UPDATE members SET name = ?, email = ?, phone = ? WHERE id = ?',
      [
        name ?? rowsExisting[0].name,
        email === undefined ? rowsExisting[0].email : email,
        phone === undefined ? rowsExisting[0].phone : phone,
        req.params.id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/members/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const [rowsExisting] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!rowsExisting.length) return res.status(404).json({ message: 'Member not found' });

    await pool.query('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ message: 'Member deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

