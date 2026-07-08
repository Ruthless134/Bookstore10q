/*=============== SEARCH OVERLAY ===============*/
const searchbutton = document.getElementById("search-button");
const searchclose = document.getElementById("search-close");
const searchcontent = document.getElementById("search-content");

searchbutton.addEventListener("click", () => {
  searchcontent.classList.add("show-search");
  document.getElementById("search-input").focus();
});

searchclose.addEventListener("click", () => {
  searchcontent.classList.remove("show-search");
});

/*=============== LOGIN ===============*/
const loginbutton = document.getElementById('login-button');
const loginclose = document.getElementById("login-close");
const logincontent = document.getElementById("login-content");

loginbutton.addEventListener("click", () => {
  logincontent.classList.add("show-login");
});

loginclose.addEventListener("click", () => {
  logincontent.classList.remove("show-login");
});

/*=============== ADD SHADOW HEADER ===============*/
const shadowHeader = () => {
  const header = document.getElementById('header');
  window.scrollY >= 50 ? header.classList.add('shadow-header')
                        : header.classList.remove('shadow-header');
};
window.addEventListener('scroll', shadowHeader);

/*=============== HOME SWIPER (banner only) ===============*/
let totalSlides = 5;
let initialSlideIndex = Math.floor(totalSlides / 2);

try {
  new Swiper('.Home_swiper', {
    loop: true,
    spaceBetween: -20,
    grabCursor: true,
    slidesPerView: 'auto',
    centeredSlides: true,
    initialSlide: initialSlideIndex,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    breakpoints: {
      1220: { spaceBetween: -20 },
      768: { spaceBetween: -10 },
      480: { spaceBetween: -10 }
    }
  });
} catch (err) {
  console.error('Home banner carousel failed to load:', err);
}

/*=============== BOOKSTORE DATA LAYER ===============*/
const API_BASE = '/api';
let currentGenre = 'All';
let currentSearch = '';
let searchDebounceTimer = null;

function escapeHTML(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function money(amount) {
  return `${Number(amount).toLocaleString()} Birr`;
}

async function fetchBooks(params = {}) {
  const cleaned = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') cleaned[k] = v;
  });
  const query = new URLSearchParams(cleaned).toString();
  const res = await fetch(`${API_BASE}/books${query ? '?' + query : ''}`);
  if (!res.ok) throw new Error('Failed to load books');
  return res.json();
}

async function fetchGenres() {
  const res = await fetch(`${API_BASE}/genres`);
  if (!res.ok) return [];
  return res.json();
}

function coverHTML(book, cssClass) {
  if (book.cover) {
    return `<img src="${book.cover}" alt="${escapeHTML(book.title)}" class="${cssClass}" />`;
  }
  return `<div class="${cssClass} no-cover">No Cover</div>`;
}

function priceHTML(book, discountClass, priceClass) {
  const hasDiscount = book.discountPrice && book.discountPrice < book.price;
  if (hasDiscount) {
    return `<span class="${discountClass}">${money(book.discountPrice)}</span>
            <span class="${priceClass}">${money(book.price)}</span>`;
  }
  return `<span class="${discountClass}">${money(book.price)}</span>`;
}

function featuredCardHTML(book) {
  return `
    <article class="Featured_card" data-id="${book.id}">
      ${coverHTML(book, 'featured_img')}
      <h2 class="featured_title">${escapeHTML(book.title)}</h2>
      <div class="featured_prices">
        ${priceHTML(book, 'featured_discount', 'featured_price')}
      </div>
      <button class="button">Order now</button>
    </article>
  `;
}

function bookCardHTML(book) {
  return `
    <a href="#" class="newcard" data-id="${book.id}">
      ${coverHTML(book, 'new_img')}
      <div>
        <h2 class="new_title">${escapeHTML(book.title)}</h2>
        <div class="new_prices">
          ${priceHTML(book, 'new_discount', 'new_price')}
        </div>
        <p class="new_genre">${escapeHTML(book.genre)}</p>
      </div>
    </a>
  `;
}

async function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    const books = await fetchBooks({ sort: 'recent' });
    const top = books.slice(0, 8);
    grid.innerHTML = top.length
      ? top.map(featuredCardHTML).join('')
      : `<p class="empty-message">No books added yet. Add some from the admin panel.</p>`;
  } catch {
    grid.innerHTML = `<p class="empty-message">Could not load featured books.</p>`;
  }
}

async function renderGenreTabs() {
  const tabsEl = document.getElementById('genre-tabs');
  if (!tabsEl) return;
  const genres = await fetchGenres();
  const all = ['All', ...genres];

  tabsEl.innerHTML = all.map(g =>
    `<button type="button" class="genre-tab ${g === currentGenre ? 'active' : ''}" data-genre="${g}">${g}</button>`
  ).join('');

  tabsEl.querySelectorAll('.genre-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentGenre = btn.dataset.genre;
      tabsEl.querySelectorAll('.genre-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderNewArrivals();
    });
  });
}

async function renderNewArrivals() {
  const grid = document.getElementById('new-grid');
  if (!grid) return;
  try {
    const books = await fetchBooks({
      genre: currentGenre,
      search: currentSearch,
      sort: 'recent'
    });
    grid.innerHTML = books.length
      ? books.map(bookCardHTML).join('')
      : `<p class="empty-message">No books match your search.</p>`;
  } catch {
    grid.innerHTML = `<p class="empty-message">Could not load books.</p>`;
  }
}

/*=============== SEARCH WIRING (works from the search icon) ===============*/
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  currentSearch = searchInput.value.trim();
  renderNewArrivals();
  searchcontent.classList.remove('show-search');
  document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' });
});

// live filtering as the user types, debounced slightly
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentSearch = searchInput.value.trim();
    renderNewArrivals();
  }, 250);
});

/*=============== INIT ===============*/
renderFeatured();
renderGenreTabs().then(renderNewArrivals);

