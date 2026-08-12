/**
 * Shared render helpers. Product markup is generated in one place so the home,
 * shop and product pages stay consistent and no card is hand-copied.
 */

import { formatPrice, findCategory, STOCK_LABELS } from './data.js';
import { icon } from './icons.js';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stockBadge(stock) {
  const info = STOCK_LABELS[stock] || STOCK_LABELS['in-stock'];
  const cls = info.tone === 'good' ? 'badge-stock' : info.tone === 'warn' ? 'badge-low' : 'badge-out';
  return `<span class="badge ${cls}">${escapeHtml(info.text)}</span>`;
}

/** A single product card. `index` seeds the scroll-reveal stagger. */
export function productCard(product, index = 0) {
  const category = findCategory(product.category);
  const catName = category ? category.name : '';
  const outOfStock = product.stock === 'out-of-stock';
  const href = `product.html?id=${encodeURIComponent(product.id)}`;

  return `
    <article class="product-card reveal" data-reveal-delay="${(index % 4) * 60}">
      <a class="product-media" href="${href}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt)}"
             width="900" height="900" loading="lazy" decoding="async">
        <span class="badge-float badge">${escapeHtml(catName)}</span>
      </a>
      <div class="product-body">
        <span class="product-cat">${stockBadge(product.stock)}</span>
        <h3 class="product-title"><a href="${href}">${escapeHtml(product.name)}</a></h3>
        <p class="product-summary">${escapeHtml(product.summary)}</p>
        <div class="product-foot">
          <span class="price">${formatPrice(product.price)}<br><small>plus tax</small></span>
          ${outOfStock
            ? '<button class="add-btn" type="button" disabled>Sold out</button>'
            : `<button class="add-btn" type="button" data-add-to-cart="${escapeHtml(product.id)}">
                 ${icon('plus')} Add
               </button>`}
        </div>
      </div>
    </article>`;
}

export function productGrid(products) {
  if (!products.length) {
    return `
      <div class="empty-state">
        <h3>Nothing matches those filters</h3>
        <p>Try removing a filter to see more of the range.</p>
      </div>`;
  }
  return `<div class="product-grid">${products.map((p, i) => productCard(p, i)).join('')}</div>`;
}

export function categoryCard(category, index = 0) {
  return `
    <a class="category-card reveal" data-reveal-delay="${(index % 3) * 70}"
       href="shop.html?category=${encodeURIComponent(category.id)}">
      <img src="${escapeHtml(category.image)}" alt="${escapeHtml(category.alt)}"
           width="900" height="675" loading="lazy" decoding="async">
      <div class="cat-body">
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.blurb)}</p>
        <span class="cat-link">Shop ${escapeHtml(category.name.toLowerCase())} ${icon('chevronRight')}</span>
      </div>
    </a>`;
}
