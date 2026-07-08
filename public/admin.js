const API_BASE = '/api';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const bookForm = document.getElementById('book-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formMessage = document.getElementById('form-message');
const bookIdField = document.getElementById('book-id');
const genreSelect = document.getElementById('genre');
const coverInput = document.getElementById('cover');
const coverPreview = document.getElementById('cover-preview');
const bookListEl = document.getElementById('admin-book-list');
const bookCountEl = document.getElementById('book-count');

function escapeHTML(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function money(amount) {
  return `${Number(amount).toLocaleString()} Birr`;
}

/* ---------- Auth ---------- */

async function checkSession() {
  const res = await fetch(`${API_BASE}/admin/session`);
  const data = await res.json();
  if (data.isAdmin) showDashboard();
  else showLogin();
}

function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
}

function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  loadGenres();
  loadBooks();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error || 'Login failed';
      return;
    }
    showDashboard();
  } catch {
    loginError.textContent = 'Could not reach the server.';
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch(`${API_BASE}/admin/logout`, { method: 'POST' });
  showLogin();
});

/* ---------- Genres ---------- */

async function loadGenres() {
  const res = await fetch(`${API_BASE}/genres`);
  const genres = await res.json();
  genreSelect.innerHTML = genres.map(g => `<option value="${g}">${g}</option>`).join('');
}

/* ---------- Cover preview ---------- */

coverInput.addEventListener('change', () => {
  const file = coverInput.files[0];
  if (!file) {
    coverPreview.style.display = 'none';
    return;
  }
  coverPreview.src = URL.createObjectURL(file);
  coverPreview.style.display = 'block';
});

/* ---------- Add / Edit form ---------- */

function resetForm() {
  bookForm.reset();
  bookIdField.value = '';
  formTitle.textContent = 'Add a Book';
  submitBtn.textContent = 'Add Book';
  cancelEditBtn.style.display = 'none';
  coverPreview.style.display = 'none';
  formMessage.textContent = '';
  formMessage.className = 'admin-message';
}

cancelEditBtn.addEventListener('click', resetForm);

bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.textContent = '';
  formMessage.className = 'admin-message';

  const id = bookIdField.value;
  const formData = new FormData();
  formData.append('title', document.getElementById('title').value.trim());
  formData.append('author', document.getElementById('author').value.trim());
  formData.append('genre', genreSelect.value);
  formData.append('description', document.getElementById('description').value.trim());
  formData.append('price', document.getElementById('price').value);
  formData.append('discountPrice', document.getElementById('discountPrice').value);
  if (coverInput.files[0]) formData.append('cover', coverInput.files[0]);

  const url = id ? `${API_BASE}/books/${id}` : `${API_BASE}/books`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (!res.ok) {
      formMessage.textContent = data.error || 'Something went wrong';
      formMessage.classList.add('error');
      return;
    }
    formMessage.textContent = id ? 'Book updated!' : 'Book added!';
    formMessage.classList.add('success');
    resetForm();
    loadBooks();
  } catch {
    formMessage.textContent = 'Could not reach the server.';
    formMessage.classList.add('error');
  }
});

/* ---------- Book list (recent first) ---------- */

async function loadBooks() {
  bookListEl.innerHTML = `<p class="empty-message">Loading books...</p>`;
  try {
    const res = await fetch(`${API_BASE}/books?sort=recent`);
    const books = await res.json();
    bookCountEl.textContent = `${books.length} book${books.length === 1 ? '' : 's'}`;

    bookListEl.innerHTML = books.length
      ? books.map(adminBookCardHTML).join('')
      : `<p class="empty-message">No books yet — add your first one!</p>`;

    bookListEl.querySelectorAll('.admin-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => startEdit(btn.dataset.id, books));
    });
    bookListEl.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteBook(btn.dataset.id));
    });
  } catch {
    bookListEl.innerHTML = `<p class="empty-message">Could not load books.</p>`;
  }
}

function adminBookCardHTML(book) {
  const cover = book.cover
    ? `<img src="${book.cover}" alt="${escapeHTML(book.title)}" />`
    : `<div class="no-cover">No Cover</div>`;
  const priceLine = (book.discountPrice && book.discountPrice < book.price)
    ? `${money(book.discountPrice)} <s>${money(book.price)}</s>`
    : money(book.price);

  return `
    <div class="admin-book-card">
      ${cover}
      <h3 class="admin-book-title">${escapeHTML(book.title)}</h3>
      <p class="admin-book-meta">${escapeHTML(book.genre)} • ${priceLine}</p>
      <p class="admin-book-meta">Added ${new Date(book.createdAt).toLocaleDateString()}</p>
      <div class="admin-book-actions">
        <button class="admin-edit-btn" data-id="${book.id}">Edit</button>
        <button class="admin-delete-btn" data-id="${book.id}">Delete</button>
      </div>
    </div>
  `;
}

function startEdit(id, books) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  bookIdField.value = book.id;
  document.getElementById('title').value = book.title;
  document.getElementById('author').value = book.author || '';
  genreSelect.value = book.genre;
  document.getElementById('description').value = book.description || '';
  document.getElementById('price').value = book.price;
  document.getElementById('discountPrice').value = book.discountPrice || '';
  coverInput.value = '';

  if (book.cover) {
    coverPreview.src = book.cover;
    coverPreview.style.display = 'block';
  } else {
    coverPreview.style.display = 'none';
  }

  formTitle.textContent = `Editing "${book.title}"`;
  submitBtn.textContent = 'Save Changes';
  cancelEditBtn.style.display = 'inline-block';
  formMessage.textContent = '';
  formMessage.className = 'admin-message';

  document.querySelector('.admin-panel').scrollIntoView({ behavior: 'smooth' });
}

async function deleteBook(id) {
  if (!confirm('Delete this book? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Could not delete the book.');
      return;
    }
    loadBooks();
  } catch {
    alert('Could not reach the server.');
  }
}

/* ---------- Init ---------- */
checkSession();
