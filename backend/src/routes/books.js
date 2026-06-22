const express = require('express');
const supabase = require('../db_supabase');

const router = express.Router();


// GET /api/books
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Book not found' });
    res.json(data);
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

    const { data, error } = await supabase
      .from('books')
      .insert({
        title,
        author,
        isbn: isbn || null,
        stock: stock ?? 0
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, author, isbn, stock } = req.body;

    const { data: existing, error: existingErr } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ message: 'Book not found' });

    const { data, error } = await supabase
      .from('books')
      .update({
        title: title ?? existing.title,
        author: author ?? existing.author,
        isbn: isbn === undefined ? existing.isbn : isbn,
        stock: stock === undefined ? existing.stock : stock
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: existing, error: existingErr } = await supabase
      .from('books')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ message: 'Book not found' });

    const { error } = await supabase.from('books').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;




