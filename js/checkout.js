/**
 * Checkout: delivery choice, contact/address form with inline validation, and a
 * running total that updates with the delivery option. No real payment is taken;
 * submitting shows an order confirmation and clears the basket. Every charge is
 * shown before the customer confirms.
 */

import { refreshCartBadge } from './site.js';
import { getDetailedItems, getTotals, clear, applyCoupon, removeCoupon } from './cart.js';
import { formatPrice, DELIVERY, BUSINESS } from './data.js';
import { icon } from './icons.js';
import { escapeHtml } from './render.js';

const root = document.querySelector('[data-checkout-root]');
let deliveryKey = 'standard';
let couponDraft = '';
let couponMessage = null; // { ok, text }

function emptyMarkup() {
  return `
    <div class="empty-state">
      ${icon('cart')}
      <h2>There is nothing to check out</h2>
      <p>Your cart is empty.</p>
      <a class="btn btn-primary mt-6" href="shop.html">Start shopping</a>
    </div>`;
}

function deliveryOptions(totals) {
  const stdFree = totals.freeShippingReached;
  const stdPrice = stdFree ? 'Free' : formatPrice(DELIVERY.standard.price + (totals.hasBulky ? DELIVERY.bulkySurcharge : 0));
  const expPrice = formatPrice(DELIVERY.express.price + (totals.hasBulky ? DELIVERY.bulkySurcharge : 0));
  return `
    <div class="delivery-choice" role="radiogroup" aria-label="Shipping method">
      <label class="delivery-option">
        <input type="radio" name="delivery" value="standard" ${deliveryKey === 'standard' ? 'checked' : ''}>
        <span>
          <span class="opt-main">${DELIVERY.standard.label}</span>
          <span class="opt-sub">${DELIVERY.standard.days}</span>
        </span>
        <span class="opt-price">${stdPrice}</span>
      </label>
      <label class="delivery-option">
        <input type="radio" name="delivery" value="express" ${deliveryKey === 'express' ? 'checked' : ''}>
        <span>
          <span class="opt-main">${DELIVERY.express.label}</span>
          <span class="opt-sub">${DELIVERY.express.days}</span>
        </span>
        <span class="opt-price">${expPrice}</span>
      </label>
    </div>`;
}

function promoMarkup(totals) {
  if (totals.coupon) {
    return `
      <div class="promo-applied">
        <span class="promo-tag">${icon('tag')} ${escapeHtml(totals.coupon.shortLabel)}</span>
        <button type="button" class="link-btn" data-remove-coupon>Remove</button>
      </div>`;
  }
  const msg = couponMessage
    ? `<p class="promo-msg ${couponMessage.ok ? 'is-ok' : 'is-err'}" role="status">${escapeHtml(couponMessage.text)}</p>`
    : '';
  return `
    <div class="promo-field">
      <label class="visually-hidden" for="promo">Discount code</label>
      <input type="text" id="promo" data-coupon-input placeholder="Discount code"
             autocomplete="off" autocapitalize="characters" spellcheck="false" value="${escapeHtml(couponDraft)}">
      <button type="button" class="btn btn-ghost" data-apply-coupon>Apply</button>
    </div>
    ${msg}`;
}

function summaryMarkup(totals) {
  return `
    <div class="summary-card" data-summary>
      <h2>Your order</h2>
      <div>
        ${totals.items.map((line) => `
          <div class="summary-row">
            <span>${escapeHtml(line.product.name)} × ${line.qty}</span>
            <span>${formatPrice(line.lineTotal)}</span>
          </div>`).join('')}
      </div>
      <div class="promo-block">${promoMarkup(totals)}</div>
      <div class="summary-row" style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--color-border)">
        <span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span>
      </div>
      ${totals.discount > 0 ? `
      <div class="summary-row is-discount">
        <span>Discount (${escapeHtml(totals.coupon.code)})</span><span>−${formatPrice(totals.discount)}</span>
      </div>` : ''}
      <div class="summary-row"><span>${escapeHtml(totals.shippingLabel)}</span><span>${
        totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span></div>
      <div class="summary-row"><span>Estimated sales tax</span><span>${formatPrice(totals.tax)}</span></div>
      <div class="summary-row total"><span>Estimated total</span><span>${formatPrice(totals.total)}</span></div>
      <p class="summary-note">${icon('lock')} This is a demonstration store. No payment is taken and no card details are stored.</p>
    </div>`;
}

function renderSummary() {
  const host = root.querySelector('[data-summary]');
  if (host) host.outerHTML = summaryMarkup(getTotals(deliveryKey));
}

function formMarkup() {
  return `
    <form class="form-card" data-checkout-form novalidate>
      <div class="form-section">
        <h2>Contact details</h2>
        <div class="form-grid">
          <div class="field" data-field>
            <label for="email">Email address <span class="req">*</span></label>
            <input type="email" id="email" name="email" autocomplete="email" required
                   aria-describedby="email-hint email-error">
            <span class="hint" id="email-hint">For your order confirmation only.</span>
            <span class="error" id="email-error">Please enter a valid email address.</span>
          </div>
          <div class="field" data-field>
            <label for="phone">Phone <span class="req">*</span></label>
            <input type="tel" id="phone" name="phone" autocomplete="tel" required
                   aria-describedby="phone-hint phone-error">
            <span class="hint" id="phone-hint">In case there is a delivery question.</span>
            <span class="error" id="phone-error">Please enter a contact phone number.</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>Shipping address</h2>
        <div class="form-grid two">
          <div class="field" data-field>
            <label for="firstName">First name <span class="req">*</span></label>
            <input type="text" id="firstName" name="firstName" autocomplete="given-name" required>
            <span class="error">Please enter your first name.</span>
          </div>
          <div class="field" data-field>
            <label for="lastName">Last name <span class="req">*</span></label>
            <input type="text" id="lastName" name="lastName" autocomplete="family-name" required>
            <span class="error">Please enter your last name.</span>
          </div>
        </div>
        <div class="form-grid" style="margin-top:var(--space-4)">
          <div class="field" data-field>
            <label for="address1">Street address <span class="req">*</span></label>
            <input type="text" id="address1" name="address1" autocomplete="address-line1" required>
            <span class="error">Please enter your street address.</span>
          </div>
          <div class="field">
            <label for="address2">Apt, suite, unit <span class="hint">(optional)</span></label>
            <input type="text" id="address2" name="address2" autocomplete="address-line2">
          </div>
          <div class="form-grid two">
            <div class="field" data-field>
              <label for="city">City <span class="req">*</span></label>
              <input type="text" id="city" name="city" autocomplete="address-level2" required>
              <span class="error">Please enter your city.</span>
            </div>
            <div class="field" data-field>
              <label for="state">State <span class="req">*</span></label>
              <input type="text" id="state" name="state" autocomplete="address-level1" required
                     placeholder="e.g. OR" maxlength="20">
              <span class="error">Please enter your state.</span>
            </div>
          </div>
          <div class="field" data-field>
            <label for="zip">ZIP code <span class="req">*</span></label>
            <input type="text" id="zip" name="zip" autocomplete="postal-code" inputmode="numeric"
                   pattern="[0-9]{5}(-[0-9]{4})?" required placeholder="12345"
                   aria-describedby="zip-error">
            <span class="error" id="zip-error">Please enter a valid 5-digit ZIP code.</span>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>Shipping method</h2>
        <div data-delivery-slot></div>
      </div>

      <div class="form-section">
        <h2>Payment</h2>
        <div class="alert alert-info">${icon('info')}
          <span>This is a demonstration store built to showcase the storefront.
          No payment is processed and no card details are requested or stored.</span>
        </div>
      </div>

      <div class="checkbox-field" style="margin-bottom:var(--space-5)">
        <input type="checkbox" id="newsletter" name="newsletter">
        <label for="newsletter">Email me seasonal planting tips and new arrivals. You can unsubscribe at any time.</label>
      </div>
      <div class="checkbox-field" data-field style="margin-bottom:var(--space-5)">
        <input type="checkbox" id="terms" name="terms" required aria-describedby="terms-error">
        <label for="terms">I have read and agree to the <a href="terms.html">terms &amp; conditions</a>
          and <a href="privacy.html">privacy policy</a>. <span class="req">*</span></label>
      </div>
      <span class="error" id="terms-error" style="display:none;color:var(--color-destructive);font-size:var(--text-sm)">
        Please accept the terms to continue.</span>

      <button type="submit" class="btn btn-primary btn-block btn-lg">
        ${icon('lock')} Place order
      </button>
    </form>`;
}

function confirmationMarkup(totals, name, email) {
  const ref = 'HH-' + Date.now().toString(36).toUpperCase().slice(-6);
  return `
    <div class="form-card text-center" style="max-width:640px;margin-inline:auto">
      <div style="color:var(--color-leaf);display:flex;justify-content:center;margin-bottom:var(--space-4)">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
      </div>
      <h1>Thank you${name ? ', ' + escapeHtml(name) : ''}</h1>
      <p style="color:var(--color-fg-muted);margin-top:var(--space-2)">
        Your order has been received. Reference <strong>${ref}</strong>.</p>
      <div class="alert alert-success" style="margin-top:var(--space-5);text-align:left">${icon('mail')}
        <span>A confirmation would be sent to <strong>${escapeHtml(email)}</strong> in a live store.
        This demonstration does not send email or take payment.</span>
      </div>
      <div class="summary-row total" style="border:none">
        <span>Order total</span><span>${formatPrice(totals.total)}</span>
      </div>
      <a class="btn btn-primary btn-lg mt-6" href="shop.html">Continue shopping</a>
    </div>`;
}

function validate(form) {
  let firstInvalid = null;
  form.querySelectorAll('[data-field]').forEach((field) => {
    const control = field.querySelector('input');
    if (!control) return;
    const ok = control.type === 'checkbox' ? control.checked : control.checkValidity();
    field.classList.toggle('invalid', !ok);
    if (!ok && !firstInvalid) firstInvalid = control;
  });

  const terms = form.querySelector('#terms');
  const termsError = form.querySelector('#terms-error');
  if (termsError) termsError.style.display = terms.checked ? 'none' : 'block';

  return firstInvalid;
}

function handleApplyCoupon() {
  const input = root.querySelector('[data-coupon-input]');
  const code = input ? input.value.trim() : '';
  if (!code) { couponDraft = ''; couponMessage = null; renderSummary(); return; }
  const result = applyCoupon(code);
  couponMessage = { ok: result.ok, text: result.message };
  couponDraft = result.ok ? '' : code;
  renderSummary();
  if (!result.ok) {
    const again = root.querySelector('[data-coupon-input]');
    if (again) again.focus();
  }
  refreshCartBadge();
}

function render() {
  const items = getDetailedItems();
  if (!items.length) {
    root.innerHTML = emptyMarkup();
    refreshCartBadge();
    return;
  }

  const totals = getTotals(deliveryKey);
  root.innerHTML = `
    <div class="cart-layout">
      <div>${formMarkup()}</div>
      <div>${summaryMarkup(totals)}</div>
    </div>`;

  root.querySelector('[data-delivery-slot]').innerHTML = deliveryOptions(totals);

  root.addEventListener('change', (event) => {
    if (event.target.name === 'delivery') {
      deliveryKey = event.target.value;
      renderSummary();
    }
  });

  // Coupon controls (delegated, since the summary re-renders).
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-apply-coupon]')) {
      event.preventDefault();
      handleApplyCoupon();
    } else if (event.target.closest('[data-remove-coupon]')) {
      event.preventDefault();
      removeCoupon();
      couponMessage = null;
      couponDraft = '';
      renderSummary();
      refreshCartBadge();
    }
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('[data-coupon-input]')) {
      event.preventDefault();
      handleApplyCoupon();
    }
  });

  const form = root.querySelector('[data-checkout-form]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const firstInvalid = validate(form);
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const finalTotals = getTotals(deliveryKey);
    const name = form.firstName.value.trim();
    const email = form.email.value.trim();
    clear();
    removeCoupon();     // a first-order code is single-use
    couponMessage = null;
    couponDraft = '';
    refreshCartBadge();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    root.innerHTML = confirmationMarkup(finalTotals, name, email);
  });

  // Clear a field's error as soon as it becomes valid.
  form.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (field && field.classList.contains('invalid')) {
      const ok = event.target.type === 'checkbox' ? event.target.checked : event.target.checkValidity();
      if (ok) field.classList.remove('invalid');
    }
  });

  refreshCartBadge();
}

function init() {
  if (!root) return;
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
