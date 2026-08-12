/**
 * Contact page form: inline validation and an on-page success message.
 * This demonstration does not transmit the message anywhere.
 */

import './site.js';
import { icon } from './icons.js';

function init() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let firstInvalid = null;

    form.querySelectorAll('[data-field]').forEach((field) => {
      const control = field.querySelector('input, textarea');
      if (!control) return;
      const ok = control.checkValidity();
      field.classList.toggle('invalid', !ok);
      if (!ok && !firstInvalid) firstInvalid = control;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const name = form.name.value.trim();
    const panel = document.querySelector('[data-contact-panel]');
    panel.innerHTML = `
      <div class="alert alert-success" role="status">${icon('check')}
        <span>Thanks${name ? ', ' + name : ''} — your message has been received.
        We reply within one business day. (This demonstration store does not send email.)
      </div>`;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  form.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (field && field.classList.contains('invalid') && event.target.checkValidity()) {
      field.classList.remove('invalid');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
