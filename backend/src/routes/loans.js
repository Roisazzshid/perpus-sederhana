const express = require('express');
const supabase = require('../db_supabase');

const router = express.Router();


// GET /api/loans
router.get('/', async (req, res, next) => {
  try {
    // Using foreign keys via joins
    const { data, error } = await supabase
      .from('loans')
      .select('id, book_id, member_id, borrowed_at, returned_at, status, notes, books(title), members(name)')
      .order('id', { ascending: false });

    if (error) throw error;

    const rows = (data || []).map((l) => ({
      id: l.id,
      book_id: l.book_id,
      member_id: l.member_id,
      borrowed_at: l.borrowed_at,
      returned_at: l.returned_at,
      status: l.status,
      notes: l.notes,
      book_title: l.books?.title ?? null,
      member_name: l.members?.name ?? null
    }));

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/loans (create peminjaman) - via RPC atomic
router.post('/', async (req, res, next) => {
  try {
    const { book_id, member_id, notes } = req.body;
    if (!book_id || !member_id) {
      return res.status(400).json({ message: 'book_id and member_id are required' });
    }

    const { data, error } = await supabase.rpc('create_loan_and_decrease_stock', {
      p_book_id: Number(book_id),
      p_member_id: Number(member_id),
      p_notes: notes || null
    });

    if (error) throw error;

    // RPC returns a set; take first row
    const row = Array.isArray(data) ? data[0] : data;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PUT /api/loans/:id/return - via RPC atomic
router.put('/:id/return', async (req, res, next) => {
  try {
    const loanId = Number(req.params.id);

    const { data, error } = await supabase.rpc('return_loan_and_increase_stock', {
      p_loan_id: loanId
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return res.status(404).json({ message: 'Loan not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

module.exports = router;



