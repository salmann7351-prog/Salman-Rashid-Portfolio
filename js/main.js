document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const form = document.getElementById('comment-form');
  const status = document.getElementById('comment-form-status');
  if (form && status) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      status.textContent = 'Submitting for review…';
      const data = new FormData(form);
      try {
        const res = await fetch('/api/comment', { method: 'POST', body: data });
        const json = await res.json();
        status.textContent = json.message || 'Unable to submit.';
        if (json.ok) form.reset();
      } catch (_) {
        status.textContent = 'Unable to submit at the moment.';
      }
    });
  }
});
