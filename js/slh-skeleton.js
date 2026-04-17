/**
 * SLH Skeleton Loaders v1.0
 * Auto-replace elements marked with [data-skeleton] or [data-loading]
 * with shimmer placeholders until content loads.
 *
 * Usage:
 *   <div data-skeleton="text" data-lines="3"></div>
 *   <div data-skeleton="title"></div>
 *   <div data-skeleton="avatar"></div>
 *   <div data-skeleton="card"></div>
 *
 * Remove skeleton manually with: SLHSkeleton.reveal(el, content)
 * Or mark container with data-skeleton-auto="5000" to auto-clear after 5s.
 */
(function (w) {
  function createSkeleton(type, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'slh-skeleton-wrap';
    wrap.setAttribute('aria-busy', 'true');
    wrap.setAttribute('aria-live', 'polite');

    switch (type) {
      case 'title':
        wrap.innerHTML = '<div class="skeleton skeleton-title"></div>';
        break;
      case 'avatar':
        wrap.innerHTML = '<div class="skeleton skeleton-avatar"></div>';
        break;
      case 'card': {
        const lines = parseInt(opts.lines || 3, 10);
        let html = '<div class="skeleton skeleton-title"></div>';
        for (let i = 0; i < lines; i++) html += '<div class="skeleton skeleton-text"></div>';
        wrap.innerHTML = html;
        break;
      }
      case 'list': {
        const count = parseInt(opts.count || 4, 10);
        let html = '';
        for (let i = 0; i < count; i++) {
          html += `
            <div class="slh-skeleton-row" style="display:flex;gap:12px;align-items:center;padding:8px 0">
              <div class="skeleton skeleton-avatar"></div>
              <div style="flex:1">
                <div class="skeleton skeleton-title" style="width:50%"></div>
                <div class="skeleton skeleton-text" style="width:80%"></div>
              </div>
            </div>`;
        }
        wrap.innerHTML = html;
        break;
      }
      case 'text':
      default: {
        const n = parseInt(opts.lines || 3, 10);
        let html = '';
        for (let i = 0; i < n; i++) {
          const w = i === n - 1 ? '60%' : '100%';
          html += `<div class="skeleton skeleton-text" style="width:${w}"></div>`;
        }
        wrap.innerHTML = html;
        break;
      }
    }
    return wrap;
  }

  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-skeleton]:not([data-skeleton-applied])').forEach(el => {
      const type = el.dataset.skeleton || 'text';
      const opts = { lines: el.dataset.lines, count: el.dataset.count };
      const sk = createSkeleton(type, opts);
      el.innerHTML = '';
      el.appendChild(sk);
      el.setAttribute('data-skeleton-applied', 'true');

      const auto = el.dataset.skeletonAuto;
      if (auto) {
        const ms = parseInt(auto, 10) || 3000;
        setTimeout(() => reveal(el), ms);
      }
    });
  }

  function reveal(el, content) {
    if (!el) return;
    const wrap = el.querySelector('.slh-skeleton-wrap');
    if (wrap) wrap.remove();
    el.removeAttribute('aria-busy');
    el.removeAttribute('data-skeleton-applied');
    if (content !== undefined) {
      if (typeof content === 'string') el.innerHTML = content;
      else if (content instanceof Node) { el.innerHTML = ''; el.appendChild(content); }
    }
  }

  function track(promise, el, options = {}) {
    apply(el.parentNode || document);
    return promise
      .then(data => {
        if (options.onSuccess) options.onSuccess(data, el);
        else if (options.template) el.innerHTML = options.template(data);
        reveal(el);
        return data;
      })
      .catch(err => {
        reveal(el);
        el.innerHTML = `<div class="alert alert-error">${options.errorMessage || 'טעינה נכשלה'}</div>`;
        throw err;
      });
  }

  const api = { apply, reveal, track, createSkeleton };
  w.SLHSkeleton = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply());
  } else {
    apply();
  }
})(window);
