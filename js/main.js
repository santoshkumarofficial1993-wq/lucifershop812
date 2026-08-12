/**
 * Home page: render the category grid and the featured products from the catalogue.
 */

import { initReveal } from './site.js';
import { CATEGORIES, PRODUCTS } from './data.js';
import { categoryCard, productGrid } from './render.js';

function render() {
  const catGrid = document.querySelector('[data-category-grid]');
  if (catGrid) {
    catGrid.innerHTML = CATEGORIES.map((cat, i) => categoryCard(cat, i)).join('');
  }

  const featured = document.querySelector('[data-featured-grid]');
  if (featured) {
    const items = PRODUCTS.filter((p) => p.featured).slice(0, 4);
    featured.innerHTML = productGrid(items);
  }

  // Add-to-cart is delegated on document, so injected cards work already;
  // only the new .reveal elements need to be observed.
  initReveal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
