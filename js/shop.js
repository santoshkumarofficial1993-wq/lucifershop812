/**
 * Shop listing: category and price filtering, sorting, and a live result count.
 * The category can be pre-selected from a ?category= query parameter so the
 * home-page category cards land on a filtered view.
 */

import { initReveal } from './site.js';
import { PRODUCTS, CATEGORIES } from './data.js';
import { productGrid } from './render.js';

const PRICE_BANDS = [
  { id: 'under-50', label: 'Under $50', test: (p) => p.price < 5000 },
  { id: '50-150', label: '$50 – $150', test: (p) => p.price >= 5000 && p.price < 15000 },
  { id: 'over-150', label: 'Over $150', test: (p) => p.price >= 15000 }
];

const state = {
  categories: new Set(),
  bands: new Set(),
  inStockOnly: false,
  sort: 'featured'
};

const grid = document.querySelector('[data-shop-grid]');
const countEl = document.querySelector('[data-result-count]');
const sortEl = document.querySelector('[data-sort]');
const categoryFilters = document.querySelector('[data-category-filters]');
const priceFilters = document.querySelector('[data-price-filters]');
const stockFilter = document.querySelector('[data-stock-filter]');
const clearBtn = document.querySelector('[data-clear-filters]');

function countFor(predicate) {
  return PRODUCTS.filter(predicate).length;
}

function buildFilters() {
  categoryFilters.innerHTML = CATEGORIES.map((cat) => `
    <label class="filter-option">
      <input type="checkbox" value="${cat.id}" data-filter="category">
      <span>${cat.name}</span>
      <span class="count">${countFor((p) => p.category === cat.id)}</span>
    </label>`).join('');

  priceFilters.innerHTML = PRICE_BANDS.map((band) => `
    <label class="filter-option">
      <input type="checkbox" value="${band.id}" data-filter="band">
      <span>${band.label}</span>
      <span class="count">${countFor(band.test)}</span>
    </label>`).join('');
}

function applyState() {
  let list = PRODUCTS.slice();

  if (state.categories.size) {
    list = list.filter((p) => state.categories.has(p.category));
  }
  if (state.bands.size) {
    const active = PRICE_BANDS.filter((b) => state.bands.has(b.id));
    list = list.filter((p) => active.some((b) => b.test(p)));
  }
  if (state.inStockOnly) {
    list = list.filter((p) => p.stock !== 'out-of-stock');
  }

  switch (state.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return list;
}

function render() {
  const list = applyState();
  grid.innerHTML = productGrid(list);
  const n = list.length;
  countEl.textContent = n === 1 ? '1 product' : `${n} products`;
  initReveal();
}

function syncClearVisibility() {
  const active = state.categories.size || state.bands.size || state.inStockOnly;
  clearBtn.hidden = !active;
}

function onFilterChange(event) {
  const input = event.target;
  if (input.dataset.filter === 'category') {
    input.checked ? state.categories.add(input.value) : state.categories.delete(input.value);
  } else if (input.dataset.filter === 'band') {
    input.checked ? state.bands.add(input.value) : state.bands.delete(input.value);
  }
  syncClearVisibility();
  render();
}

function init() {
  if (!grid) return;
  buildFilters();

  // Pre-select a category from the URL.
  const params = new URLSearchParams(location.search);
  const preset = params.get('category');
  if (preset && CATEGORIES.some((c) => c.id === preset)) {
    state.categories.add(preset);
    const box = categoryFilters.querySelector(`input[value="${CSS.escape(preset)}"]`);
    if (box) box.checked = true;
  }

  categoryFilters.addEventListener('change', onFilterChange);
  priceFilters.addEventListener('change', onFilterChange);

  stockFilter.addEventListener('change', (e) => {
    state.inStockOnly = e.target.checked;
    syncClearVisibility();
    render();
  });

  sortEl.addEventListener('change', (e) => {
    state.sort = e.target.value;
    render();
  });

  clearBtn.addEventListener('click', () => {
    state.categories.clear();
    state.bands.clear();
    state.inStockOnly = false;
    document.querySelectorAll('[data-filter], [data-stock-filter]').forEach((el) => { el.checked = false; });
    syncClearVisibility();
    render();
  });

  syncClearVisibility();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
