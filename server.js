require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const { readBooks, writeBooks } = require('./lib/db');
const upload = require('./lib/upload');
const { requireAuth } = require('./lib/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Fixed genre list used across the storefront and admin panel.
const GENRES = [
  'Fiction', 'Non-Fiction', 'Fantasy', 'Romance', 'Mystery & Thriller',
  'Sci-Fi', 'Biography', 'Self-Help', 'Children', 'Poetry', 'Other'
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 } // 8 hour login
}));

/* ============ PUBLIC API (storefront) ============ */

app.get('/api/genres', (req, res) => res.json(GENRES));

// GET /api/books?search=harry&genre=Fantasy&sort=recent|oldest
app.get('/api/books', (req, res) => {
  let books = readBooks();
  const { search, genre, sort } = req.query;

  if (genre && genre !== 'All') {
    books = books.filter(b => (b.genre || '').toLowerCase() === genre.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    books = books.filter(b =>
      (b.title || '').toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q) ||
      (b.genre || '').toLowerCase().includes(q)
    );
  }

  books.sort((a, b) => sort === 'oldest'
    ? new Date(a.createdAt) - new Date(b.createdAt)
    : new Date(b.createdAt) - new Date(a.createdAt)); // default: newest first

  res.json(books);
});

app.get('/api/books/:id', (req, res) => {
  const book = readBooks().find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

/* ============ ADMIN AUTH ============ */

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/admin/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

/* ============ ADMIN BOOK MANAGEMENT ============ */

app.post('/api/books', requireAuth, upload.single('cover'), (req, res) => {
  const { title, author, genre, description, price, discountPrice } = req.body;

  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required' });
  }

  const books = readBooks();
  const newBook = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title,
    author: author || '',
    genre: genre || 'Other',
    description: description || '',
    price: parseFloat(price),
    discountPrice: discountPrice ? parseFloat(discountPrice) : null,
    cover: req.file ? `/uploads/covers/${req.file.filename}` : null,
    createdAt: new Date().toISOString()
  };

  books.push(newBook);
  writeBooks(books);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', requireAuth, upload.single('cover'), (req, res) => {
  const books = readBooks();
  const idx = books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Book not found' });

  const existing = books[idx];
  const { title, author, genre, description, price, discountPrice } = req.body;

  if (req.file) {
    if (existing.cover) {
      const oldPath = path.join(__dirname, 'public', existing.cover);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    existing.cover = `/uploads/covers/${req.file.filename}`;
  }

  if (title !== undefined) existing.title = title;
  if (author !== undefined) existing.author = author;
  if (genre !== undefined) existing.genre = genre;
  if (description !== undefined) existing.description = description;
  if (price !== undefined && price !== '') existing.price = parseFloat(price);
  existing.discountPrice = (discountPrice !== undefined && discountPrice !== '')
    ? parseFloat(discountPrice) : null;

  books[idx] = existing;
  writeBooks(books);
  res.json(existing);
});

app.delete('/api/books/:id', requireAuth, (req, res) => {
  const books = readBooks();
  const idx = books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Book not found' });

  const [removed] = books.splice(idx, 1);
  if (removed.cover) {
    const coverPath = path.join(__dirname, 'public', removed.cover);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }
  writeBooks(books);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Abol Bookstore running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin.html`);
});
