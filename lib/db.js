// Simple file-based "database" — no separate database software needed.
// All books are stored as a JSON array in data/books.json.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'books.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]');
}

function readBooks() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeBooks(books) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(books, null, 2));
}

module.exports = { readBooks, writeBooks };
