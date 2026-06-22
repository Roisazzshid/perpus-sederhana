require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { errorHandler } = require('./middleware/errorHandler');
const booksRoutes = require('./routes/books');
const membersRoutes = require('./routes/members');
const loansRoutes = require('./routes/loans');

if (!booksRoutes || typeof booksRoutes !== 'function') {
  console.error('booksRoutes is not middleware. Got:', booksRoutes);
}
if (!membersRoutes || typeof membersRoutes !== 'function') {
  console.error('membersRoutes is not middleware. Got:', membersRoutes);
}
if (!loansRoutes || typeof loansRoutes !== 'function') {
  console.error('loansRoutes is not middleware. Got:', loansRoutes);
}


const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/books', booksRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/loans', loansRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Perpus backend running on port ${PORT}`);
});

