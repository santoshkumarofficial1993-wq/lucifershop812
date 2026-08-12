/**
 * Cart page: line items with quantity steppers, live totals, and the full
 * cost breakdown (subtotal, shipping, estimated sales tax) shown before checkout.
 */

import { refreshCartBadge } from './site.js';
import { getDetailedItems, getTotals, setQty, removeItem } from './cart.js';
import { findCategory, formatPrice } from './data.js';
import { icon } from './icons.js';
import { escapeHtml } from './render.js';

const root = document.querySelector('[data-cart-root]');

function emptyMarkup() {
  return `
    <div class="empty-state">
      ${icon('cart')}
      <h2>Your cart is empty</h2>
      <p>Once you add something it will show up here.</p>
      <a class="btn btn-primary mt-6" href="shop.html">Start shopping</a>
    </div>`;
}

function lineMarkup(line) {
  const { product, qty, lineTotal } = line;
  const category = findCategory(product.category);
  return `
    <div class="cart-line" data-line="${escapeHtml(product.id)}">
      <a class="cart-line-media" href="product.html?id=${encodeURIComponent(product.id)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt)}"
             width="110" height="110" loading="lazy" decoding="async">
      </a>
      <div>
        <p class="cart-line-cat">${escapeHtml(category ? category.name : '')}</p>
        <p class="cart-line-title">
          <a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a>
        </p>
        <p class="cart-line-cat">${formatPrice(product.price)} each</p>
        <div class="cart-line-controls">
          <div class="qty-stepper" role="group" aria-label="Quantity for ${escapeHtml(product.name)}">
            <button type="button" data-line-step="-1" aria-label="Decrease quantity">${icon('minus')}</button>
            <input type="number" data-line-qty value="${qty}" min="1" max="20" inputmode="numeric"
                   aria-label="Quantity for ${escapeHtml(product.name)}">
            <button type="button" data-line-step="1" aria-label="Increase quantity">${icon('plus')}</button>
          </div>
          <span class="cart-line-price">${formatPrice(lineTotal)}</span>
          <button type="button" class="link-btn" data-remove aria-label="Remove ${escapeHtml(product.name)}">Remove</button>
        </div>
      </div>
    </div>`;
}

function summaryMarkup(totals) {
  const freeNote = totals.freeShippingReached
    ? `<p class="summary-note">${icon('check')} Your order qualifies for free standard shipping.</p>`
    : `<p class="summary-note">Spend ${formatPrice(totals.freeShippingRemaining)} more for free standard shipping.</p>`;

  return `
    <div class="summary-card">
      <h2>Order summary</h2>
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
      ${totals.discount > 0 ? `
      <div class="summary-row is-discount">
        <span>Discount (${escapeHtml(totals.coupon.code)})</span><span>−${formatPrice(totals.discount)}</span>
      </div>` : ''}
      <div class="summary-row"><span>${escapeHtml(totals.shippingLabel)}</span><span>${
        totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span></div>
      <div class="summary-row"><span>Estimated sales tax</span><span>${formatPrice(totals.tax)}</span></div>
      ${totals.coupon ? `<p class="summary-note">${icon('tag')} ${escapeHtml(totals.coupon.shortLabel)} applied. Manage it at checkout.</p>` : ''}
      <div class="summary-row total"><span>Estimated total</span><span>${formatPrice(totals.total)}</span></div>
      ${freeNote}
      <p class="summary-note">Sales tax is estimated. Your exact tax is calculated from your shipping address at checkout.</p>
      <a class="btn btn-primary btn-block btn-lg" href="checkout.html">Go to checkout</a>
      <a class="btn btn-ghost btn-block" href="shop.html" style="margin-top:var(--space-2)">Continue shopping</a>
    </div>`;
}

function render() {
  const items = getDetailedItems();
  if (!items.length) {
    root.innerHTML = emptyMarkup();
    refreshCartBadge();
    return;
  }
  const totals = getTotals('standard');
  root.innerHTML = `
    <div class="cart-layout">
      <div data-lines>${items.map(lineMarkup).join('')}</div>
      <div>${summaryMarkup(totals)}</div>
    </div>`;
  refreshCartBadge();
}

function handleClick(event) {
  const lineEl = event.target.closest('[data-line]');
  if (!lineEl) return;
  const id = lineEl.dataset.line;

  if (event.target.closest('[data-remove]')) {
    removeItem(id);
    render();
    return;
  }
  const stepBtn = event.target.closest('[data-line-step]');
  if (stepBtn) {
    const input = lineEl.querySelector('[data-line-qty]');
    const next = (Number(input.value) || 1) + Number(stepBtn.dataset.lineStep);
    setQty(id, next);
    render();
  }
}

function handleChange(event) {
  const input = event.target.closest('[data-line-qty]');
  if (!input) return;
  const id = event.target.closest('[data-line]').dataset.line;
  setQty(id, Math.floor(Number(input.value)) || 1);
  render();
}

function init() {
  if (!root) return;
  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
