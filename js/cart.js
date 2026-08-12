/**
 * Cart state. Persisted to localStorage as an array of { id, qty }.
 * The product catalogue in data.js remains the source of truth for names,
 * prices and images; the cart only stores ids and quantities.
 */

import { PRODUCTS, DELIVERY, findProduct, findCoupon } from './data.js';

const STORAGE_KEY = 'hh-cart-v1';
const COUPON_KEY = 'hh-coupon-v1';
const MAX_QTY = 20;
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && findProduct(item.id))
      .map((item) => ({ id: item.id, qty: clampQty(item.qty) }));
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode, quota) - cart simply won't persist */
  }
  listeners.forEach((fn) => fn(items));
}

function clampQty(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QTY);
}

export function getItems() {
  return read();
}

/** Cart lines joined to their catalogue product. Skips anything no longer sold. */
export function getDetailedItems() {
  return read()
    .map((item) => {
      const product = findProduct(item.id);
      return product ? { product, qty: item.qty, lineTotal: product.price * item.qty } : null;
    })
    .filter(Boolean);
}

export function getCount() {
  return read().reduce((sum, item) => sum + item.qty, 0);
}

export function addItem(id, qty = 1) {
  if (!findProduct(id)) return;
  const items = read();
  const existing = items.find((item) => item.id === id);
  if (existing) {
    existing.qty = clampQty(existing.qty + qty);
  } else {
    items.push({ id, qty: clampQty(qty) });
  }
  write(items);
}

export function setQty(id, qty) {
  const items = read();
  const existing = items.find((item) => item.id === id);
  if (!existing) return;
  existing.qty = clampQty(qty);
  write(items);
}

export function removeItem(id) {
  write(read().filter((item) => item.id !== id));
}

export function clear() {
  write([]);
}

/* ---- Coupons ------------------------------------------------------------- */

/** The applied coupon object, or null. Re-validated against the catalogue on read. */
export function getCoupon() {
  try {
    return findCoupon(localStorage.getItem(COUPON_KEY));
  } catch {
    return null;
  }
}

/**
 * Apply a discount code. Returns { ok, coupon, message } so the UI can show a
 * clear result near the field rather than a generic error.
 */
export function applyCoupon(code) {
  const coupon = findCoupon(code);
  if (!coupon) {
    return { ok: false, message: 'That code isn’t valid. Check the spelling and try again.' };
  }
  try {
    localStorage.setItem(COUPON_KEY, coupon.code);
  } catch {
    /* storage unavailable — coupon just won't persist */
  }
  listeners.forEach((fn) => fn(read()));
  return { ok: true, coupon, message: `${coupon.label} applied.` };
}

export function removeCoupon() {
  try {
    localStorage.removeItem(COUPON_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(read()));
}

/**
 * Full order breakdown. Every figure a customer will be charged is derived here,
 * so the cart and checkout pages always agree and nothing appears for the first
 * time at the final step. A percentage coupon discounts the merchandise
 * subtotal; shipping thresholds and sales tax are then assessed on the
 * discounted amount.
 */
export function getTotals(deliveryKey = 'standard') {
  const items = getDetailedItems();
  const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
  const hasBulky = items.some((line) => line.product.bulky);

  const coupon = items.length ? getCoupon() : null;
  const discount = coupon && coupon.type === 'percent'
    ? Math.round(subtotal * (coupon.value / 100))
    : 0;
  const netSubtotal = subtotal - discount;

  const band = DELIVERY[deliveryKey] || DELIVERY.standard;
  let shipping = 0;
  let shippingLabel = band.label;

  if (items.length === 0) {
    shipping = 0;
  } else if (deliveryKey === 'standard' && netSubtotal >= DELIVERY.freeThreshold) {
    shipping = 0;
    shippingLabel = 'Standard shipping (free)';
  } else {
    shipping = band.price + (hasBulky ? DELIVERY.bulkySurcharge : 0);
  }

  // US model: listed prices exclude sales tax; tax is estimated on the
  // (discounted) merchandise subtotal and finalised against the shipping address.
  const tax = Math.round(netSubtotal * DELIVERY.salesTaxRate);
  const total = netSubtotal + shipping + tax;

  return {
    items,
    count: items.reduce((sum, line) => sum + line.qty, 0),
    subtotal,
    coupon,
    discount,
    netSubtotal,
    shipping,
    shippingLabel,
    hasBulky,
    tax,
    total,
    freeShippingReached: netSubtotal >= DELIVERY.freeThreshold,
    freeShippingRemaining: Math.max(0, DELIVERY.freeThreshold - netSubtotal)
  };
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Keep multiple open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    listeners.forEach((fn) => fn(read()));
  }
});

export { MAX_QTY, PRODUCTS };
