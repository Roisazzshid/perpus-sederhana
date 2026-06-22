const express = require('express');
const supabase = require('../db_supabase');

const router = express.Router();


// GET /api/members
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Member not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/members
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const { data, error } = await supabase
      .from('members')
      .insert({
        name,
        email: email || null,
        phone: phone || null
      })
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const { data: existing, error: existingErr } = await supabase
      .from('members')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ message: 'Member not found' });

    const { data, error } = await supabase
      .from('members')
      .update({
        name: name ?? existing.name,
        email: email === undefined ? existing.email : email,
        phone: phone === undefined ? existing.phone : phone
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

// DELETE /api/members/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { data: existing, error: existingErr } = await supabase
      .from('members')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (!existing) return res.status(404).json({ message: 'Member not found' });

    const { error } = await supabase.from('members').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Member deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;




