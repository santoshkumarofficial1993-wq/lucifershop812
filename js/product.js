/**
 * Product detail page. Reads ?id= from the URL, renders the gallery, price,
 * delivery information, specifications and related items from the catalogue.
 */

import { initReveal } from './site.js';
import { PRODUCTS, findProduct, findCategory, formatPrice, DELIVERY } from './data.js';
import { productCard, stockBadge, escapeHtml } from './render.js';
import { icon } from './icons.js';

const root = document.querySelector('[data-product-root]');

function notFound() {
  root.innerHTML = `
    <div class="empty-state">
      <h1>Product not found</h1>
      <p>The item you were looking for is no longer available.</p>
      <a class="btn btn-primary mt-6" href="shop.html">Browse the shop</a>
    </div>`;
}

function galleryMarkup(product) {
  const images = product.gallery && product.gallery.length
    ? product.gallery
    : [{ src: product.image, alt: product.alt }];

  const thumbs = images.length > 1
    ? `<div class="gallery-thumbs" role="group" aria-label="Product images">
        ${images.map((img, i) => `
          <button type="button" class="gallery-thumb" data-thumb="${i}"
                  aria-current="${i === 0}" aria-label="Show image ${i + 1}">
            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}"
                 width="220" height="220" loading="lazy" decoding="async">
          </button>`).join('')}
      </div>`
    : '';

  return `
    <div class="gallery-main">
      <img data-gallery-main src="${escapeHtml(images[0].src)}" alt="${escapeHtml(images[0].alt)}"
           width="900" height="900" decoding="async">
    </div>
    ${thumbs}`;
}

function deliveryLine(product) {
  const free = formatPrice(DELIVERY.freeThreshold);
  const std = formatPrice(DELIVERY.standard.price);
  const base = `Standard shipping ${std}, ${DELIVERY.standard.days}. Free over ${free}.`;
  return product.bulky
    ? `${base} A ${formatPrice(DELIVERY.bulkySurcharge)} oversize handling charge applies to this larger item.`
    : base;
}

function render(product) {
  const category = findCategory(product.category);
  document.title = `${product.name} — Fernway`;

  root.innerHTML = `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><a href="index.html">Home</a> ${icon('chevronRight')}</li>
        <li><a href="shop.html">Shop</a> ${icon('chevronRight')}</li>
        <li><a href="shop.html?category=${category.id}">${escapeHtml(category.name)}</a> ${icon('chevronRight')}</li>
        <li aria-current="page">${escapeHtml(product.name)}</li>
      </ol>
    </nav>

    <div class="product-detail" data-add-scope>
      <div class="gallery">${galleryMarkup(product)}</div>

      <div>
        <p class="detail-cat">${escapeHtml(category.name)}</p>
        <h1 class="detail-title">${escapeHtml(product.name)}</h1>
        <p class="detail-price">${formatPrice(product.price)} <span class="price"><small>plus tax</small></span></p>
        <p>${stockBadge(product.stock)}</p>
        <p class="detail-summary">${escapeHtml(product.summary)}</p>

        <div class="qty-row">
          <div class="qty-stepper" role="group" aria-label="Quantity">
            <button type="button" data-step="-1" aria-label="Decrease quantity">${icon('minus')}</button>
            <input type="number" data-qty-input value="1" min="1" max="20" inputmode="numeric"
                   aria-label="Quantity">
            <button type="button" data-step="1" aria-label="Increase quantity">${icon('plus')}</button>
          </div>
          ${product.stock === 'out-of-stock'
            ? '<button class="btn btn-primary btn-lg" type="button" disabled>Sold out</button>'
            : `<button class="btn btn-primary btn-lg" type="button" data-add-to-cart="${escapeHtml(product.id)}">
                 ${icon('cart')} Add to cart
               </button>`}
        </div>

        <div class="detail-meta">
          <div>${icon('truck')}<span><strong>Shipping</strong>${escapeHtml(deliveryLine(product))}</span></div>
          <div>${icon('refresh')}<span><strong>Returns</strong>30-day returns. See our <a href="returns.html">returns policy</a>.</span></div>
          <div>${icon('shield')}<span><strong>Guarantee</strong>Covered against manufacturing defects — details in the specification below.</span></div>
        </div>

        <table class="spec-table">
          <caption class="visually-hidden">Specifications for ${escapeHtml(product.name)}</caption>
          <tbody>
            ${product.specs.map(([k, v]) => `
              <tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <section class="section">
      <div class="prose">
        <h2>About this piece</h2>
        <p>${escapeHtml(product.description)}</p>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>You might also like</h2></div>
      <div data-related></div>
    </section>`;

  wireGallery();
  wireStepper();
  renderRelated(product);
  initReveal();
}

function wireGallery() {
  const main = root.querySelector('[data-gallery-main]');
  const thumbs = root.querySelectorAll('[data-thumb]');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const img = thumb.querySelector('img');
      main.src = img.src;
      main.alt = img.alt;
      thumbs.forEach((t) => t.setAttribute('aria-current', 'false'));
      thumb.setAttribute('aria-current', 'true');
    });
  });
}

function wireStepper() {
  const input = root.querySelector('[data-qty-input]');
  if (!input) return;
  root.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = (Number(input.value) || 1) + Number(btn.dataset.step);
      input.value = String(Math.min(20, Math.max(1, next)));
    });
  });
  input.addEventListener('change', () => {
    input.value = String(Math.min(20, Math.max(1, Math.floor(Number(input.value)) || 1)));
  });
}

function renderRelated(product) {
  const related = PRODUCTS
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(PRODUCTS.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, 4);
  root.querySelector('[data-related]').innerHTML =
    `<div class="product-grid">${related.map((p, i) => productCard(p, i)).join('')}</div>`;
}

function init() {
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id');
  const product = id ? findProduct(id) : null;
  if (!product) { notFound(); return; }
  render(product);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
