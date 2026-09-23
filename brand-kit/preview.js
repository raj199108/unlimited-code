(() => {
  const root = document.documentElement;
  const main = document.getElementById('main');
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const themeButtons = [...document.querySelectorAll('[data-theme]')];
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function setTheme(theme) {
    if (!['paper', 'ink'].includes(theme)) return;
    root.dataset.ucTheme = theme;
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === theme)));
    themeMeta.content = theme === 'paper' ? '#fdfcfc' : '#201d1d';
    try { localStorage.setItem('unlimit-code-theme', theme); } catch (_) { /* Preview also works without storage. */ }
  }
  function setView(view, focus = false) {
    if (!['landing', 'system'].includes(view)) return;
    document.getElementById('landing-view').hidden = view !== 'landing';
    document.getElementById('system-view').hidden = view !== 'system';
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (focus) main.focus({ preventScroll: true });
  }
  themeButtons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme)));
  viewButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.querySelectorAll('[data-open-system]').forEach(button => button.addEventListener('click', () => setView('system', true)));
  try { setTheme(localStorage.getItem('unlimit-code-theme') || 'paper'); } catch (_) { setTheme('paper'); }

  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      status.textContent = `${button.dataset.copy} copied.`;
    } catch (_) {
      status.textContent = `Select and copy this value: ${button.dataset.copy}`;
    }
  }));
  document.getElementById('sample-primary').addEventListener('click', () => {
    document.getElementById('action-status').textContent = '[OK] Primary action activated.';
  });
  document.getElementById('sample-secondary').addEventListener('click', () => {
    document.getElementById('action-status').textContent = '[OK] Secondary action activated.';
  });
  const input = document.getElementById('project-name');
  const formStatus = document.getElementById('form-status');
  document.getElementById('sample-form').addEventListener('submit', event => {
    event.preventDefault();
    const valid = input.value.trim().length > 0;
    input.setAttribute('aria-invalid', String(!valid));
    input.setAttribute('aria-describedby', valid ? 'field-help' : 'field-help form-status');
    formStatus.textContent = valid ? '[OK] Project name looks good.' : '[!] Enter a project name to continue.';
    if (!valid) input.focus();
  });
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true' && input.value.trim()) {
      input.setAttribute('aria-invalid', 'false');
      input.setAttribute('aria-describedby', 'field-help');
      formStatus.textContent = '';
    }
  });
})();
