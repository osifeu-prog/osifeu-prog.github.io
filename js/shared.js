/**
 * SLH Ecosystem — Shared Module
 * Core utilities, navigation, i18n, theme, auth, and ticker
 */

/* ===== 1. CONSTANTS ===== */

const API_BASE = 'https://slh-api-production.up.railway.app';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const TON_WALLET = 'UQBxYz_example_ton_wallet_address';
const BSC_CONTRACT = '0x_example_bsc_contract_address';
const SLH_PRICE_ILS = 444;

const RTL_LANGS = ['he', 'ar'];
const SUPPORTED_LANGS = ['he', 'en', 'ru', 'ar', 'fr'];
const THEMES = ['dark', 'terminal', 'crypto', 'light'];

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: 'fa-home' },
  { key: 'trade', href: '/trade.html', icon: 'fa-chart-line' },
  { key: 'earn', href: '/earn.html', icon: 'fa-coins' },
  { key: 'wallet', href: '/wallet.html', icon: 'fa-wallet', auth: true },
  { key: 'bots', href: '/bots.html', icon: 'fa-robot' },
  { key: 'referral', href: '/referral.html', icon: 'fa-users', auth: true },
  { key: 'blockchain', href: '/blockchain.html', icon: 'fa-cubes' },
  { key: 'dashboard', href: '/dashboard.html', icon: 'fa-tachometer-alt', auth: true }
];

const BOTTOM_NAV_ITEMS = [
  { key: 'home', href: '/', icon: 'fa-home' },
  { key: 'wallet', href: '/wallet.html', icon: 'fa-wallet' },
  { key: 'earn', href: '/earn.html', icon: 'fa-coins' },
  { key: 'bots', href: '/bots.html', icon: 'fa-robot' },
  { key: 'referral', href: '/referral.html', icon: 'fa-users' }
];


/* ===== 2. API CLIENT ===== */

async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('[API GET]', path, err);
    return null;
  }
}

async function apiPost(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('[API POST]', path, err);
    return null;
  }
}


/* ===== 3. AUTH MODULE ===== */

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('slh_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function login(id, username, photo) {
  const user = { id, username, photo, loggedAt: Date.now() };
  localStorage.setItem('slh_user', JSON.stringify(user));
  return user;
}

function logout() {
  localStorage.removeItem('slh_user');
  window.location.href = '/';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/dashboard.html';
    return false;
  }
  return true;
}


/* ===== 4. i18n ENGINE ===== */

function t(key) {
  const lang = getLang();
  if (T[lang] && T[lang][key]) return T[lang][key];
  if (T[T._default] && T[T._default][key]) return T[T._default][key];
  return key;
}

function getLang() {
  return localStorage.getItem('slh_lang') || T._default || 'he';
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = T._default || 'he';
  localStorage.setItem('slh_lang', lang);

  const isRTL = RTL_LANGS.includes(lang);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  // Update active state in language selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}


/* ===== 5. THEME SYSTEM ===== */

let _themeCycleInterval = null;

function getTheme() {
  return localStorage.getItem('slh_theme') || 'dark';
}

function setTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'dark';
  localStorage.setItem('slh_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function startThemeCycle() {
  if (_themeCycleInterval) clearInterval(_themeCycleInterval);
  let idx = THEMES.indexOf(getTheme());
  _themeCycleInterval = setInterval(() => {
    idx = (idx + 1) % THEMES.length;
    setTheme(THEMES[idx]);
  }, 8000);
}

function stopThemeCycle() {
  if (_themeCycleInterval) {
    clearInterval(_themeCycleInterval);
    _themeCycleInterval = null;
  }
}


/* ===== 6. NAVIGATION RENDERER ===== */

function renderTopNav(activePage) {
  const root = document.getElementById('topnav-root');
  if (!root) return;

  const lang = getLang();
  const logged = isLoggedIn();
  const user = getCurrentUser();

  const links = NAV_ITEMS
    .filter(item => !item.auth || logged)
    .map(item => {
      const cls = item.key === activePage ? 'active' : '';
      return `<a href="${item.href}" class="${cls}" data-page="${item.key}">
        <i class="fas ${item.icon}"></i>
        <span data-i18n="nav_${item.key}">${t('nav_' + item.key)}</span>
      </a>`;
    }).join('');

  const langSelector = SUPPORTED_LANGS.map(l =>
    `<button class="lang-btn ${l === lang ? 'active' : ''}" data-lang="${l}" onclick="setLang('${l}')">${l.toUpperCase()}</button>`
  ).join('');

  const authBtn = logged
    ? `<div class="nav-user">
        <img src="${user.photo || '/img/avatar.svg'}" alt="" class="user-avatar">
        <span class="nav-username">${user.username || ''}</span>
        <button class="login-btn" onclick="logout()" data-i18n="nav_logout">${t('nav_logout')}</button>
       </div>`
    : `<a href="/dashboard.html" class="login-btn" data-i18n="nav_login">${t('nav_login')}</a>`;

  root.innerHTML = `
    <nav class="topnav">
      <a href="/" class="topnav-logo">
        <div class="logo-icon">⚡</div>
        <span>SLH Spark</span>
      </a>
      <div class="topnav-links hide-mobile">${links}</div>
      <div class="topnav-right">
        ${langSelector}
        ${authBtn}
        <button class="hamburger show-mobile" onclick="toggleDrawer()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>`;
}

function renderMobileDrawer() {
  if (document.getElementById('mobile-drawer')) return;

  const logged = isLoggedIn();
  const links = NAV_ITEMS
    .filter(item => !item.auth || logged)
    .map(item =>
      `<a href="${item.href}" class="drawer-link" data-page="${item.key}">
        <i class="fas ${item.icon}"></i>
        <span data-i18n="nav_${item.key}">${t('nav_' + item.key)}</span>
      </a>`
    ).join('');

  const drawer = document.createElement('div');
  drawer.id = 'mobile-drawer';
  drawer.className = 'mobile-drawer';
  drawer.innerHTML = `
    <div class="drawer-overlay" onclick="toggleDrawer()"></div>
    <div class="drawer-panel">
      <div class="drawer-header">
        <img src="/img/logo.svg" alt="SLH" class="drawer-logo">
        <button class="drawer-close" onclick="toggleDrawer()"><i class="fas fa-times"></i></button>
      </div>
      <div class="drawer-links">${links}</div>
      <div class="drawer-footer">
        ${logged
          ? `<button class="btn btn-outline full-w" onclick="logout()" data-i18n="nav_logout">${t('nav_logout')}</button>`
          : `<a href="/dashboard.html" class="btn btn-primary full-w" data-i18n="nav_login">${t('nav_login')}</a>`
        }
      </div>
    </div>`;
  document.body.appendChild(drawer);
}

function renderBottomNav(activePage) {
  const root = document.getElementById('bottomnav-root');
  if (!root) return;

  const items = BOTTOM_NAV_ITEMS.map(item => {
    const cls = item.key === activePage ? 'bnav-item active' : 'bnav-item';
    return `<a href="${item.href}" class="${cls}">
      <i class="fas ${item.icon}"></i>
      <span data-i18n="nav_${item.key}">${t('nav_' + item.key)}</span>
    </a>`;
  }).join('');

  root.innerHTML = `<nav class="bottom-nav">${items}</nav>`;
}

function renderFooter() {
  const root = document.getElementById('footer-root');
  if (!root) return;

  const year = new Date().getFullYear();
  root.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="/img/logo.svg" alt="SLH" class="footer-logo">
          <span>SLH Spark</span>
        </div>
        <div class="footer-copy">
          &copy; ${year} SLH Spark. <span data-i18n="footer_rights">${t('footer_rights')}</span>
        </div>
        <div class="footer-powered" data-i18n="footer_powered">${t('footer_powered')}</div>
      </div>
    </footer>`;
}

function toggleDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (!drawer) { renderMobileDrawer(); return toggleDrawer(); }
  drawer.classList.toggle('open');
  document.body.classList.toggle('drawer-open');
}


/* ===== 7. PRICE TICKER ===== */

let _tickerInterval = null;

async function fetchPrices() {
  try {
    const res = await fetch(`${COINGECKO_API}/simple/price?ids=bitcoin,ethereum,the-open-network,binancecoin&vs_currencies=usd,ils&include_24hr_change=true`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[Ticker]', err);
    return null;
  }
}

function renderTickerContent(prices) {
  if (!prices) return '';

  const coins = [
    { id: 'bitcoin', sym: 'BTC', icon: 'fab fa-bitcoin' },
    { id: 'ethereum', sym: 'ETH', icon: 'fab fa-ethereum' },
    { id: 'the-open-network', sym: 'TON', icon: 'fas fa-gem' },
    { id: 'binancecoin', sym: 'BNB', icon: 'fas fa-coins' }
  ];

  const items = coins.map(c => {
    const d = prices[c.id];
    if (!d) return '';
    const change = (d.usd_24h_change || 0).toFixed(2);
    const cls = parseFloat(change) >= 0 ? 'ticker-up' : 'ticker-down';
    const arrow = parseFloat(change) >= 0 ? '\u25B2' : '\u25BC';
    return `<span class="ticker-item">
      <i class="${c.icon}"></i> ${c.sym} $${formatNumber(d.usd)}
      <span class="${cls}">${arrow} ${change}%</span>
    </span>`;
  }).join('<span class="ticker-sep">|</span>');

  // Add SLH
  const slhItem = `<span class="ticker-item ticker-slh">
    <i class="fas fa-bolt"></i> SLH ${formatCurrency(SLH_PRICE_ILS, 'ILS')}
  </span>`;

  return slhItem + '<span class="ticker-sep">|</span>' + items;
}

async function initTicker() {
  const root = document.getElementById('ticker-root');
  if (!root) return;

  async function update() {
    const prices = await fetchPrices();
    const content = renderTickerContent(prices);
    root.innerHTML = `<div class="ticker-wrap"><div class="ticker-track">${content}${content}</div></div>`;
  }

  await update();
  if (_tickerInterval) clearInterval(_tickerInterval);
  _tickerInterval = setInterval(update, 60000);
}


/* ===== 8. UTILITIES ===== */

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('common_copied'));
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(t('common_copied'));
    return true;
  }
}

function showToast(msg, isError = false) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  toast.textContent = msg;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatCurrency(num, currency) {
  if (num == null || isNaN(num)) return '0';
  const symbols = { ILS: '\u20AA', USD: '$', EUR: '\u20AC', RUB: '\u20BD' };
  const sym = symbols[currency] || currency || '';
  return `${sym}${formatNumber(num)}`;
}

function timeAgo(date) {
  const now = Date.now();
  const d = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 2592000)}mo`;
}

function initScrollReveal() {
  const els = document.querySelectorAll('.rv');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

function renderBackgroundEffects() {
  // Skip if already rendered
  if (document.getElementById('bg-effects')) return;

  const container = document.createElement('div');
  container.id = 'bg-effects';
  container.className = 'bg-effects';

  // Gradient orbs
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement('div');
    orb.className = `bg-orb bg-orb-${i + 1}`;
    container.appendChild(orb);
  }

  // Mesh grid
  const mesh = document.createElement('div');
  mesh.className = 'bg-mesh';
  container.appendChild(mesh);

  // Floating particles
  const particleWrap = document.createElement('div');
  particleWrap.className = 'bg-particles';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'bg-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 6}s`;
    p.style.animationDuration = `${4 + Math.random() * 6}s`;
    particleWrap.appendChild(p);
  }
  container.appendChild(particleWrap);

  document.body.prepend(container);
}


/* ===== 9. INIT FUNCTION ===== */

/**
 * Initialize shared modules on every page.
 * @param {Object} options
 * @param {string} options.activePage — current page key (e.g. 'home', 'trade')
 * @param {boolean} [options.requireAuth=false] — redirect if not logged in
 * @param {boolean} [options.showTicker=true] — show price ticker
 * @param {boolean} [options.showBottomNav=false] — show mobile bottom nav
 */
function initShared(options = {}) {
  const {
    activePage = 'home',
    requireAuth: needAuth = false,
    showTicker = true,
    showBottomNav = false
  } = options;

  // Auth gate
  if (needAuth && !requireAuth()) return;

  // Language
  const lang = getLang();
  setLang(lang);

  // Theme
  const theme = getTheme();
  setTheme(theme);

  // Navigation
  renderTopNav(activePage);
  renderMobileDrawer();
  renderFooter();

  if (showBottomNav) {
    renderBottomNav(activePage);
  }

  // Ticker
  if (showTicker) {
    initTicker();
  }

  // Background
  renderBackgroundEffects();

  // Scroll reveal
  initScrollReveal();

  // Global keyboard shortcut — Escape to close drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const drawer = document.getElementById('mobile-drawer');
      if (drawer && drawer.classList.contains('open')) {
        toggleDrawer();
      }
    }
  });
}
