(() => {
  const key = 'shici-font-size-v1';
  const sizes = [100, 110, 120, 130, 140, 150, 160, 170, 180];
  const defaultSize = 120;
  const validSize = value => sizes.includes(Number(value)) ? Number(value) : defaultSize;
  let size = defaultSize;
  try { size = validSize(localStorage.getItem(key)); } catch {}

  const controls = document.createElement('div');
  controls.className = 'font-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', '调节字号');
  controls.innerHTML = '<span class="font-controls-label">字号</span><button type="button" data-font="smaller" aria-label="缩小字号" title="缩小字号">A−</button><output aria-live="polite" aria-atomic="true"></output><button type="button" data-font="larger" aria-label="放大字号" title="放大字号">A+</button><button type="button" data-font="reset" class="font-reset" aria-label="恢复默认字号">默认</button><span class="font-save-message" role="status"></span>';
  const smaller = controls.querySelector('[data-font="smaller"]');
  const larger = controls.querySelector('[data-font="larger"]');
  const output = controls.querySelector('output');
  const message = controls.querySelector('.font-save-message');

  function apply() {
    document.documentElement.style.setProperty('--font-scale', String(size / 100));
    output.textContent = `${size}%`;
    smaller.disabled = size === sizes[0];
    larger.disabled = size === sizes[sizes.length - 1];
  }
  apply();
  function mount(){const header=document.querySelector('.topbar');if(header)header.insertAdjacentElement('afterend',controls);else document.querySelector('main')?.prepend(controls);}
  mount();window.addEventListener('shici-render',mount);

  controls.addEventListener('click', event => {
    const button = event.target.closest('button[data-font]');
    if (!button || button.disabled) return;
    if (button.dataset.font === 'reset') size = defaultSize;
    else size = sizes[Math.max(0, Math.min(sizes.length - 1, sizes.indexOf(size) + (button.dataset.font === 'larger' ? 1 : -1)))];
    apply();
    try { localStorage.setItem(key, String(size)); message.textContent = ''; }
    catch { message.textContent = '当前浏览器无法保存设置，字号已在本页生效。'; }
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { size = validSize(event.newValue); apply(); }
  });
})();
