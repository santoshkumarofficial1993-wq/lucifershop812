/**
 * Site-wide behaviour shared by every page: cart badge, mobile navigation,
 * cookie notice, scroll reveal, toasts, and delegated add-to-cart buttons.
 * The header and footer are real HTML in each page, so the site still navigates
 * with JavaScript disabled; this file only enhances what is already there.
 */

import { addItem, getCount } from './cart.js';
import { findProduct, BUSINESS } from './data.js';
import { icon } from './icons.js';

const COOKIE_KEY = 'hh-cookie-choice';

/* ---- Cart badge ---------------------------------------------------------- */

export function refreshCartBadge() {
  const count = getCount();
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.dataset.count = String(count);
    el.textContent = String(count);
    const label = count === 1 ? '1 item in cart' : `${count} items in cart`;
    const link = el.closest('a');
    if (link) link.setAttribute('aria-label', `Cart, ${label}`);
  });
}

/* ---- Toasts -------------------------------------------------------------- */

let toastRegion;

function ensureToastRegion() {
  if (toastRegion) return toastRegion;
  toastRegion = document.createElement('div');
  toastRegion.className = 'toast-region';
  toastRegion.setAttribute('role', 'status');
  toastRegion.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastRegion);
  return toastRegion;
}

export function toast(message) {
  const region = ensureToastRegion();
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon('check')}<span></span>`;
  el.querySelector('span').textContent = message;
  region.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 240ms ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

/* ---- Mobile navigation --------------------------------------------------- */

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-primary-nav]');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? icon('close') : icon('menu');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Reset state if the viewport grows past the mobile breakpoint.
  const mq = window.matchMedia('(min-width: 860px)');
  mq.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

/* ---- Current page highlight ---------------------------------------------- */

function markCurrentNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-primary-nav] a').forEach((link) => {
    const target = link.getAttribute('href');
    if (target === here || (here === 'index.html' && target === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ---- Cookie notice ------------------------------------------------------- */

function initCookieBanner() {
  if (localStorage.getItem(COOKIE_KEY)) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Cookie notice');
  banner.innerHTML = `
    <p>We use essential cookies for your cart, and Microsoft Clarity to see how the
    site is used so we can improve it. We don't use advertising cookies. See our
    <a href="privacy.html">privacy &amp; cookie policy</a>.</p>
    <div class="cookie-actions">
      <button type="button" class="btn btn-primary" data-cookie="accept">Got it</button>
      <a class="btn btn-ghost" href="privacy.html">Learn more</a>
    </div>`;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('is-visible'));

  banner.querySelector('[data-cookie="accept"]').addEventListener('click', () => {
    try { localStorage.setItem(COOKIE_KEY, 'essential'); } catch { /* ignore */ }
    banner.classList.remove('is-visible');
    setTimeout(() => banner.remove(), 440);
  });
}

/* ---- Scroll reveal ------------------------------------------------------- */

let revealObserver = null;
let revealFallback;

/**
 * Observe any not-yet-revealed elements. Safe to call repeatedly, so pages that
 * inject cards after load can reveal them without re-initialising the whole site.
 */
export function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.is-in):not([data-observed])');
  if (!els.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduced) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.revealDelay || 0);
        setTimeout(() => el.classList.add('is-in'), delay);
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  }

  els.forEach((el) => {
    el.dataset.observed = 'true';
    revealObserver.observe(el);
  });

  // Safety net: a storefront must never leave its products invisible. If the
  // observer has not revealed an element within a few seconds (obscure browser
  // quirks, background tabs throttling callbacks), show it anyway.
  clearTimeout(revealFallback);
  revealFallback = setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => el.classList.add('is-in'));
  }, 2500);
}

/* ---- Add to cart (delegated) --------------------------------------------- */

function initAddToCart() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-add-to-cart]');
    if (!btn) return;
    const id = btn.dataset.addToCart;
    const product = findProduct(id);
    if (!product) return;
    const qtyInput = btn.closest('[data-add-scope]')?.querySelector('[data-qty-input]');
    const qty = qtyInput ? Number(qtyInput.value) || 1 : 1;
    addItem(id, qty);
    refreshCartBadge();
    toast(qty > 1 ? `${qty} × ${product.name} added to cart` : `${product.name} added to cart`);
  });
}

/* ---- Footer year --------------------------------------------------------- */

function initFooterYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

/* ---- Boot ---------------------------------------------------------------- */

export function initSite() {
  initNav();
  markCurrentNav();
  initFooterYear();
  refreshCartBadge();
  initAddToCart();
  initCookieBanner();
  initReveal();
}

export { BUSINESS };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSite);
} else {
  initSite();
}
