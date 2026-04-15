/**
 * SLH Ecosystem — Shared Module
 * Core utilities, navigation, i18n, theme, auth, and ticker
 */

/* ===== 1. CONSTANTS ===== */

const API_BASE = 'https://slh-api-production.up.railway.app';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const TON_WALLET = 'UQCr743gEr_nqV_0SBkSp3CtYS_15R3LDLBvLmKeEv7XdGvp';
const BSC_CONTRACT = '0xACb0A09414CEA1C879c67bB7A877E4e19480f022';
const ADMIN_BSC_WALLET = '0xD0617B54FB4b6b66307846f217b4D685800E3dA4';
const SLH_PRICE_ILS = 444;

const RTL_LANGS = ['he', 'ar'];
const SUPPORTED_LANGS = ['he', 'en', 'ru', 'ar', 'fr'];
const THEMES = ['dark', 'terminal', 'crypto', 'cyberpunk', 'ocean', 'sunset', 'light'];
const THEME_META = {
  dark:      { icon: 'fa-moon',          label: 'Dark',      color: '#6c5ce7' },
  terminal:  { icon: 'fa-terminal',      label: 'Terminal',   color: '#00ff41' },
  crypto:    { icon: 'fa-bitcoin-sign',  label: 'Crypto',     color: '#a855f7' },
  cyberpunk: { icon: 'fa-robot',         label: 'Cyberpunk',  color: '#00f3ff' },
  ocean:     { icon: 'fa-water',         label: 'Ocean',      color: '#64ffda' },
  sunset:    { icon: 'fa-sun',           label: 'Sunset',     color: '#ff6b9d' },
  light:     { icon: 'fa-circle-half-stroke', label: 'Light', color: '#2563eb' }
};

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: 'fa-home' },
  { key: 'trade', href: '/trade.html', icon: 'fa-chart-line' },
  { key: 'earn', href: '/earn.html', icon: 'fa-coins' },
  { key: 'wallet', href: '/wallet.html', icon: 'fa-wallet', auth: true },
  { key: 'bots', href: '/bots.html', icon: 'fa-robot' },
  { key: 'referral', href: '/referral.html', icon: 'fa-users', auth: true },
  { key: 'community', href: '/community.html', icon: 'fa-comments' },
  { key: 'blog', href: '/daily-blog.html', icon: 'fa-newspaper' },
  { key: 'guides', href: '/guides.html', icon: 'fa-book' },
  { key: 'wallet_guide', href: '/wallet-guide.html', icon: 'fa-graduation-cap' },
  { key: 'blockchain', href: '/blockchain.html', icon: 'fa-cubes' },
  { key: 'network', href: '/network.html', icon: 'fa-project-diagram' },
  { key: 'roadmap', href: '/roadmap.html', icon: 'fa-road' },
  { key: 'liquidity', href: '/liquidity.html', icon: 'fa-tint' },
  { key: 'challenge', href: '/challenge.html', icon: 'fa-fire' },
  { key: 'healing', href: '/healing-vision.html', icon: 'fa-heart' },
  { key: 'jubilee', href: '/jubilee.html', icon: 'fa-dove' },
  { key: 'p2p', href: '/p2p.html', icon: 'fa-exchange-alt' },
  { key: 'about', href: '/about.html', icon: 'fa-info-circle' },
  { key: 'control_center', href: '/control-center.html', icon: 'fa-satellite-dish', admin: true },
  { key: 'project_map', href: '/project-map.html', icon: 'fa-sitemap', admin: true },
  { key: 'promo_shekel', href: '/promo-shekel.html', icon: 'fa-fire', admin: true },
  { key: 'mass_gift', href: '/mass-gift.html', icon: 'fa-gift', admin: true },
  { key: 'bot_registry', href: '/bot-registry.html', icon: 'fa-robot', admin: true },
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

function getJWT() {
  return localStorage.getItem('slh_jwt') || '';
}

function setJWT(token) {
  if (token) localStorage.setItem('slh_jwt', token);
}

function _authHeaders() {
  const jwt = getJWT();
  const h = { 'Content-Type': 'application/json' };
  if (jwt) h['Authorization'] = `Bearer ${jwt}`;
  return h;
}

async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: _authHeaders() });
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
      headers: _authHeaders(),
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
    if (!raw) return null;
    const user = JSON.parse(raw);

    // Migrate old schema — ensure wallets + profile fields exist
    let dirty = false;
    if (!user.wallets) { user.wallets = { bsc: null, ton: null }; dirty = true; }
    if (!user.profilePhoto) { user.profilePhoto = null; dirty = true; }
    if (!user.coverPhoto) { user.coverPhoto = null; dirty = true; }
    if (!user.avatarGrad && user.avatarGrad !== 0) { user.avatarGrad = Math.floor(Math.random() * 8); dirty = true; }
    // Normalize username: use first_name as fallback
    if (!user.username && user.first_name) { user.username = user.first_name; dirty = true; }
    if (dirty) localStorage.setItem('slh_user', JSON.stringify(user));

    return user;
  } catch { return null; }
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function login(id, username, photo) {
  // Preserve existing wallets/profile on re-login
  const existing = getCurrentUser();
  const user = {
    id,
    username,
    photo: photo || existing?.photo || null,
    profilePhoto: existing?.profilePhoto || null,
    coverPhoto: existing?.coverPhoto || null,
    wallets: existing?.wallets || { bsc: null, ton: null },
    avatarGrad: existing?.avatarGrad ?? Math.floor(Math.random() * 8),
    loggedAt: Date.now()
  };
  localStorage.setItem('slh_user', JSON.stringify(user));
  return user;
}

function logout() {
  // Keep wallet data even after logout
  const user = getCurrentUser();
  if (user?.wallets?.bsc || user?.wallets?.ton) {
    localStorage.setItem('slh_wallets_backup', JSON.stringify(user.wallets));
  }
  localStorage.removeItem('slh_user');
  localStorage.removeItem('slh_jwt');
  window.location.href = '/';
}

function updateUserProfile(updates) {
  const user = getCurrentUser();
  if (!user) return null;
  Object.assign(user, updates);
  localStorage.setItem('slh_user', JSON.stringify(user));
  return user;
}

/* Profile photo upload — converts to compressed base64 */
function uploadProfilePhoto(callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large (max 5MB)', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Compress via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let w = img.width, h = img.height;
        if (w > h) { h = (maxSize * h) / w; w = maxSize; }
        else { w = (maxSize * w) / h; h = maxSize; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        updateUserProfile({ profilePhoto: dataUrl });
        showToast('Profile photo updated!');
        if (callback) callback(dataUrl);
        // Re-render nav to show new photo
        renderTopNav(document.getElementById('topnav-root')?.dataset?.page);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/dashboard.html';
    return false;
  }
  return true;
}

function isRegistered() {
  const user = getCurrentUser();
  return user?.is_registered === true;
}

function requireRegistration() {
  if (!isLoggedIn()) {
    window.location.href = '/dashboard.html';
    return false;
  }
  if (!isRegistered()) {
    window.location.href = '/dashboard.html#register';
    return false;
  }
  return true;
}

/** Capture ?ref= parameter on any page and store it */
function captureReferral() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && /^\d+$/.test(ref)) {
    localStorage.setItem('slh_ref', ref);
  }
}


/* ===== 4. i18n ENGINE ===== */

function t(key, fallback) {
  const lang = getLang();
  if (T[lang] && T[lang][key]) return T[lang][key];
  if (T[T._default] && T[T._default][key]) return T[T._default][key];
  return (fallback !== undefined) ? fallback : key;
}

// Returns true if a translation exists for the given key in current or default language
function hasT(key) {
  const lang = getLang();
  return !!(T[lang] && T[lang][key]) || !!(T[T._default] && T[T._default][key]);
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
    // Keep original text as fallback on first run, cache it on dataset
    if (!el.dataset.i18nOrig) {
      el.dataset.i18nOrig = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
        ? (el.placeholder || '')
        : (el.textContent || '');
    }
    // Only replace if translation exists, otherwise keep original default
    if (!hasT(key)) {
      // Restore original (in case previous lang had it but new lang doesn't)
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = el.dataset.i18nOrig;
      } else {
        el.textContent = el.dataset.i18nOrig;
      }
      return;
    }
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (!el.dataset.i18nOrigHtml) {
      el.dataset.i18nOrigHtml = el.innerHTML || '';
    }
    if (!hasT(key)) {
      el.innerHTML = el.dataset.i18nOrigHtml;
      return;
    }
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

  // Wallet badges
  const walletBadges = logged && typeof getWalletBadgeHTML === 'function' ? getWalletBadgeHTML() : '';

  // Avatar with gradient fallback
  const avatarGrads = ['#6c5ce7,#a29bfe','#00cec9,#81ecec','#fd79a8,#fab1a0','#ffd32a,#fdcb6e','#e17055,#d63031','#00b894,#55efc4','#0984e3,#74b9ff','#e84393,#fd79a8'];
  const gradIdx = user?.avatarGrad ?? 0;
  const displayName = user?.username || user?.first_name || 'User';
  const userInitial = displayName[0].toUpperCase();
  const avatarSrc = [user?.profilePhoto, user?.photo_url, user?.photo].find(s => s && s.length > 5) || null;
  const avatarHTML = avatarSrc
    ? `<img src="${avatarSrc}" alt="" class="user-avatar" onclick="toggleProfileDropdown()">`
    : `<div class="user-avatar-grad" style="background:linear-gradient(135deg,${avatarGrads[gradIdx]})" onclick="toggleProfileDropdown()">${userInitial}</div>`;

  const authBtn = logged
    ? `<div class="nav-user-wrap">
        ${avatarHTML}
        <div class="profile-dropdown" id="profile-dropdown">
          <div class="pd-header">
            <div class="pd-avatar">${avatarSrc ? `<img src="${avatarSrc}" alt="">` : `<div class="pd-avatar-grad" style="background:linear-gradient(135deg,${avatarGrads[gradIdx]})">${userInitial}</div>`}</div>
            <div class="pd-info">
              <div class="pd-name">${displayName}</div>
              <div class="pd-id">ID: ${user.id || '--'}</div>
            </div>
          </div>
          ${walletBadges ? `<div class="pd-wallets">${walletBadges}</div>` : ''}
          <div class="pd-menu">
            <a href="javascript:void(0)" class="pd-item" onclick="uploadProfilePhoto()"><i class="fas fa-camera"></i> ${lang === 'he' ? 'שנה תמונה' : 'Change Photo'}</a>
            <a href="/dashboard.html" class="pd-item"><i class="fas fa-tachometer-alt"></i> ${t('nav_dashboard')}</a>
            <a href="/wallet.html" class="pd-item"><i class="fas fa-wallet"></i> ${t('nav_wallet')}</a>
            <a href="/community.html" class="pd-item"><i class="fas fa-comments"></i> ${t('nav_community')}</a>
            <a href="/referral.html" class="pd-item"><i class="fas fa-users"></i> ${t('nav_referral')}</a>
          </div>
          <div class="pd-footer">
            <button class="pd-logout" onclick="logout()"><i class="fas fa-sign-out-alt"></i> ${t('nav_logout')}</button>
          </div>
        </div>
       </div>`
    : `<a href="/dashboard.html" class="login-btn" data-i18n="nav_login">${t('nav_login')}</a>`;

  // Main nav: show only top 5 items, rest go to "More" dropdown
  const mainNavItems = NAV_ITEMS.filter(item => !item.auth || logged);
  const visibleItems = mainNavItems.slice(0, 5);
  const moreItems = mainNavItems.slice(5);

  const mainLinks = visibleItems.map(item => {
    const cls = item.key === activePage ? 'active' : '';
    return `<a href="${item.href}" class="${cls}" data-page="${item.key}">
      <i class="fas ${item.icon}"></i>
      <span data-i18n="nav_${item.key}">${t('nav_' + item.key)}</span>
    </a>`;
  }).join('');

  const moreDropdown = moreItems.length ? `
    <div class="nav-more-wrap">
      <button class="nav-more-btn" onclick="this.parentElement.classList.toggle('open')">
        <i class="fas fa-ellipsis-h"></i> <span>${t('nav_more') || 'More'}</span>
      </button>
      <div class="nav-more-dropdown">
        ${moreItems.map(item => {
          const cls = item.key === activePage ? 'active' : '';
          return `<a href="${item.href}" class="${cls}"><i class="fas ${item.icon}"></i> ${t('nav_' + item.key)}</a>`;
        }).join('')}
      </div>
    </div>` : '';

  // Theme picker
  const currentTheme = getTheme();
  const themeMeta = THEME_META[currentTheme] || THEME_META.dark;
  const themeOptions = THEMES.map(th => {
    const m = THEME_META[th] || {};
    const active = th === currentTheme ? ' active' : '';
    return `<button class="theme-option${active}" data-theme="${th}" onclick="setTheme('${th}');document.querySelector('.theme-picker-wrap')?.classList.remove('open')" title="${m.label}">
      <span class="theme-dot" style="background:${m.color}"></span>
      <span>${m.label}</span>
    </button>`;
  }).join('');

  root.dataset.page = activePage;
  root.innerHTML = `
    <nav class="topnav">
      <a href="/" class="topnav-logo">
        <div class="logo-icon">⚡</div>
        <span>SLH Spark</span>
      </a>
      <div class="topnav-links hide-mobile">${mainLinks}${moreDropdown}</div>
      <div class="topnav-right">
        <div class="theme-picker-wrap">
          <button class="theme-picker-btn" onclick="this.parentElement.classList.toggle('open')" title="Theme">
            <i class="fas ${themeMeta.icon}" style="color:${themeMeta.color}"></i>
          </button>
          <div class="theme-picker-dropdown">${themeOptions}</div>
        </div>
        <div class="lang-selector">${langSelector}</div>
        ${authBtn}
        <button class="hamburger show-mobile" onclick="toggleDrawer()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>`;

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('profile-dropdown');
    if (dd && !e.target.closest('.nav-user-wrap')) dd.classList.remove('open');
    const more = document.querySelector('.nav-more-wrap');
    if (more && !e.target.closest('.nav-more-wrap')) more.classList.remove('open');
    const tp = document.querySelector('.theme-picker-wrap');
    if (tp && !e.target.closest('.theme-picker-wrap')) tp.classList.remove('open');
  });
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
    <footer class="site-footer" style="margin-top:60px;padding:50px 20px 30px;background:var(--surface);border-top:1px solid var(--border)">
      <div class="footer-sitemap" style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:30px;margin-bottom:30px">
        <div class="footer-col">
          <h4 style="color:var(--accent);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;font-weight:700">🏠 ${t('footer_main', 'ראשי')}</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            <li><a href="/" style="color:var(--text2);text-decoration:none;font-size:13px">${t('nav_home', 'ראשי')}</a></li>
            <li><a href="/trade.html" style="color:var(--text2);text-decoration:none;font-size:13px">${t('nav_trade', 'מסחר')}</a></li>
            <li><a href="/earn.html" style="color:var(--text2);text-decoration:none;font-size:13px">${t('nav_earn', 'הרוויח')}</a></li>
            <li><a href="/wallet.html" style="color:var(--text2);text-decoration:none;font-size:13px">${t('nav_wallet', 'ארנק')}</a></li>
            <li><a href="/dashboard.html" style="color:var(--text2);text-decoration:none;font-size:13px">${t('dashboard', 'לוח בקרה')}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4 style="color:var(--accent);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;font-weight:700">👥 ${t('footer_community', 'קהילה')}</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            <li><a href="/community.html" style="color:var(--text2);text-decoration:none;font-size:13px">💬 ${t('nav_community', 'פורום')}</a></li>
            <li><a href="/community.html#marketplace" style="color:var(--text2);text-decoration:none;font-size:13px">🏪 ${t('nav_marketplace', 'חנות קהילתית')}</a></li>
            <li><a href="/daily-blog.html" style="color:var(--text2);text-decoration:none;font-size:13px">📰 ${t('nav_blog', 'בלוג יומי')}</a></li>
            <li><a href="/invite.html" style="color:var(--text2);text-decoration:none;font-size:13px">🎁 ${t('nav_invite', 'הזמן חברים')}</a></li>
            <li><a href="/referral.html" style="color:var(--text2);text-decoration:none;font-size:13px">🤝 ${t('nav_referral', 'הפניות')}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4 style="color:var(--accent);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;font-weight:700">💎 ${t('footer_products', 'מוצרים')}</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            <li><a href="/bots.html" style="color:var(--text2);text-decoration:none;font-size:13px">🤖 ${t('nav_bots', '20+ בוטים')}</a></li>
            <li><a href="/staking.html" style="color:var(--text2);text-decoration:none;font-size:13px">💰 ${t('nav_staking', 'סטייקינג 65%')}</a></li>
            <li><a href="/blockchain.html" style="color:var(--text2);text-decoration:none;font-size:13px">⛓️ ${t('nav_blockchain', "בלוקצ'יין")}</a></li>
            <li><a href="/analytics.html" style="color:var(--text2);text-decoration:none;font-size:13px">📊 ${t('nav_analytics', 'אנליטיקה')}</a></li>
            <li><a href="/whitepaper.html" style="color:var(--text2);text-decoration:none;font-size:13px">📜 ${t('nav_whitepaper', 'ספר לבן')}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4 style="color:var(--accent);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;font-weight:700">📚 ${t('footer_learn', 'למד')}</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            <li><a href="/guides.html" style="color:var(--text2);text-decoration:none;font-size:13px">📖 ${t('nav_guides', 'מדריכים')}</a></li>
            <li><a href="/wallet-guide.html" style="color:var(--text2);text-decoration:none;font-size:13px">💼 ${t('nav_wallet_guide', 'מדריך ארנק')}</a></li>
            <li><a href="/roadmap.html" style="color:var(--text2);text-decoration:none;font-size:13px">🗺️ ${t('nav_roadmap', 'מפת דרכים')}</a></li>
            <li><a href="/terms.html" style="color:var(--text2);text-decoration:none;font-size:13px">${t('nav_terms', 'תנאי שימוש')}</a></li>
            <li><a href="/privacy.html" style="color:var(--text2);text-decoration:none;font-size:13px">${t('nav_privacy', 'פרטיות')}</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4 style="color:var(--accent);font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;font-weight:700">🔗 ${t('footer_connect', 'התחברות')}</h4>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
            <li><a href="https://t.me/SLH_AIR_bot" target="_blank" rel="noopener" style="color:var(--text2);text-decoration:none;font-size:13px"><i class="fab fa-telegram"></i> @SLH_AIR_bot</a></li>
            <li><a href="https://t.me/SLH_community_bot" target="_blank" rel="noopener" style="color:var(--text2);text-decoration:none;font-size:13px"><i class="fab fa-telegram"></i> Community</a></li>
            <li><a href="https://t.me/SLH_Academia_bot" target="_blank" rel="noopener" style="color:var(--text2);text-decoration:none;font-size:13px"><i class="fab fa-telegram"></i> Academia</a></li>
            <li><a href="https://t.me/Osif83" target="_blank" rel="noopener" style="color:var(--text2);text-decoration:none;font-size:13px">💬 ${t('nav_support', 'תמיכה')}</a></li>
            <li><a href="/admin.html" style="color:var(--text2);text-decoration:none;font-size:13px">⚙️ ${t('nav_admin', 'אדמין')}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-inner" style="max-width:1200px;margin:0 auto;padding-top:24px;border-top:1px solid var(--border);text-align:center">
        <div class="footer-brand" style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:10px">
          <img src="/img/logo.svg" alt="SLH" class="footer-logo" style="width:32px;height:32px">
          <span style="font-weight:800;font-size:16px;background:linear-gradient(135deg,var(--accent),var(--cyan));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">SLH Spark</span>
        </div>
        <div class="footer-copy" style="font-size:12px;color:var(--text2)">
          &copy; ${year} SLH Spark. <span data-i18n="footer_rights">${t('footer_rights', 'כל הזכויות שמורות')}</span>
        </div>
        <div class="footer-powered" data-i18n="footer_powered" style="font-size:11px;color:var(--text3);margin-top:4px">${t('footer_powered', 'מופעל על ידי SLH Spark · SPARK IND')}</div>
      </div>
    </footer>`;

  // Auto-inject footer-root if missing
  if (!document.getElementById('footer-root-auto')) {
    const autoFooter = document.createElement('div');
    autoFooter.id = 'footer-root-auto';
    // marker only — no-op
  }
}

// Auto-create footer-root on pages that don't have one
function ensureFooterRoot() {
  if (!document.getElementById('footer-root')) {
    const root = document.createElement('div');
    root.id = 'footer-root';
    document.body.appendChild(root);
  }
}

function toggleProfileDropdown() {
  const dd = document.getElementById('profile-dropdown');
  if (dd) dd.classList.toggle('open');
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

// === Hebrew Date Utilities (global) ===
function getHebrewDateString(date) {
  date = date || new Date();
  try {
    const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    return `${day} ${month} ${year}`;
  } catch (e) {
    try { return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { dateStyle: 'long' }).format(date); }
    catch (e2) { return ''; }
  }
}

function getGregorianDateString(date) {
  date = date || new Date();
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function renderDateWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  // Inject styles once
  if (!document.getElementById('slh-date-widget-styles')) {
    const style = document.createElement('style');
    style.id = 'slh-date-widget-styles';
    style.textContent = `
      .date-widget-hero, .date-widget {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 10px 18px;
        background: linear-gradient(135deg, rgba(139,92,246,.12), rgba(0,229,255,.08));
        border: 1px solid rgba(139,92,246,.3);
        border-radius: 14px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 4px 20px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.08);
        font-family: inherit;
        transition: transform .3s ease, box-shadow .3s ease;
      }
      .date-widget-hero:hover, .date-widget:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.1);
      }
      .date-widget-hero .dw-hebrew, .date-widget .dw-hebrew {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--accent, #8b5cf6);
        letter-spacing: .2px;
        white-space: nowrap;
      }
      .date-widget-hero .dw-hebrew::before, .date-widget .dw-hebrew::before {
        content: '✡';
        font-size: 14px;
        opacity: .8;
      }
      .date-widget-hero .dw-separator, .date-widget .dw-separator {
        width: 1px;
        height: 22px;
        background: rgba(255,255,255,.15);
      }
      .date-widget-hero .dw-greg, .date-widget .dw-greg {
        font-size: 11px;
        color: var(--text2, #a0a0b8);
        white-space: nowrap;
      }
      .date-widget-hero .dw-clock, .date-widget .dw-clock {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-bright, #fff);
        font-variant-numeric: tabular-nums;
        letter-spacing: .5px;
        white-space: nowrap;
      }
      .date-widget-hero .dw-clock::before, .date-widget .dw-clock::before {
        content: '🕐 ';
        font-size: 13px;
        margin-inline-end: 2px;
      }
      @media (max-width: 520px) {
        .date-widget-hero, .date-widget {
          flex-wrap: wrap;
          gap: 6px 10px;
          padding: 8px 12px;
        }
        .date-widget-hero .dw-separator, .date-widget .dw-separator { display: none; }
        .date-widget-hero .dw-hebrew, .date-widget .dw-hebrew { font-size: 11px; }
        .date-widget-hero .dw-greg, .date-widget .dw-greg { font-size: 10px; }
        .date-widget-hero .dw-clock, .date-widget .dw-clock { font-size: 13px; }
      }
    `;
    document.head.appendChild(style);
  }
  // Ensure the container has widget class
  if (!el.classList.contains('date-widget-hero') && !el.classList.contains('date-widget')) {
    el.classList.add('date-widget');
  }
  function tick() {
    const now = new Date();
    el.innerHTML = `
      <span class="dw-hebrew">${getHebrewDateString(now)}</span>
      <span class="dw-separator"></span>
      <span class="dw-greg">${getGregorianDateString(now)}</span>
      <span class="dw-separator"></span>
      <span class="dw-clock">${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>`;
  }
  tick();
  setInterval(tick, 1000);
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
 * @param {boolean} [options.requireRegistered=false] — redirect if not registered (paid)
 * @param {boolean} [options.showTicker=true] — show price ticker
 * @param {boolean} [options.showBottomNav=false] — show mobile bottom nav
 */
function initShared(options = {}) {
  const {
    activePage = 'home',
    requireAuth: needAuth = false,
    requireRegistered = false,
    showTicker = true,
    showBottomNav = false
  } = options;

  // Capture referral from URL
  captureReferral();

  // Auth gate
  if (needAuth && !requireAuth()) return;

  // Registration gate
  if (requireRegistered && !requireRegistration()) return;

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

  // Re-apply translations AFTER nav/footer are injected
  // (so any data-i18n attrs inside injected HTML get translated properly)
  setLang(lang);

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

  // Cookie consent banner
  initCookieConsent();

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // PWA manifest link (if not already in head)
  if (!document.querySelector('link[rel="manifest"]')) {
    const m = document.createElement('link');
    m.rel = 'manifest';
    m.href = '/manifest.json';
    document.head.appendChild(m);
  }
}


/* ===== COOKIE CONSENT ===== */

function initCookieConsent() {
  if (localStorage.getItem('slh_cookie_consent')) return;

  const lang = getLang();
  const texts = {
    he: {
      msg: 'אתר זה משתמש בקובצי עוגיות (cookies) כדי לשפר את חוויית השימוש, לנתח תנועה באתר ולשמור את ההעדפות שלך.',
      accept: 'מסכים',
      decline: 'דוחה',
      settings: 'הגדרות',
      title: '🍪 הודעת פרטיות',
      essential: 'חיוניים',
      analytics: 'אנליטיקה',
      preferences: 'העדפות',
      essentialDesc: 'נחוצים לתפקוד האתר',
      analyticsDesc: 'עוזרים לנו להבין את השימוש באתר',
      preferencesDesc: 'שמירת שפה, ערכת נושא והגדרות'
    },
    en: {
      msg: 'This site uses cookies to improve your experience, analyze traffic, and save your preferences.',
      accept: 'Accept',
      decline: 'Decline',
      settings: 'Settings',
      title: '🍪 Privacy Notice',
      essential: 'Essential',
      analytics: 'Analytics',
      preferences: 'Preferences',
      essentialDesc: 'Required for the site to function',
      analyticsDesc: 'Help us understand site usage',
      preferencesDesc: 'Save language, theme, and settings'
    },
    ru: {
      msg: 'Этот сайт использует файлы cookie для улучшения работы, анализа трафика и сохранения настроек.',
      accept: 'Принять',
      decline: 'Отклонить',
      settings: 'Настройки',
      title: '🍪 Уведомление о конфиденциальности',
      essential: 'Необходимые',
      analytics: 'Аналитика',
      preferences: 'Настройки',
      essentialDesc: 'Необходимы для работы сайта',
      analyticsDesc: 'Помогают понять использование сайта',
      preferencesDesc: 'Сохранение языка, темы и настроек'
    },
    ar: {
      msg: 'يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربتك وتحليل حركة المرور وحفظ تفضيلاتك.',
      accept: 'قبول',
      decline: 'رفض',
      settings: 'إعدادات',
      title: '🍪 إشعار الخصوصية',
      essential: 'أساسية',
      analytics: 'تحليلات',
      preferences: 'تفضيلات',
      essentialDesc: 'مطلوبة لعمل الموقع',
      analyticsDesc: 'تساعدنا على فهم استخدام الموقع',
      preferencesDesc: 'حفظ اللغة والسمة والإعدادات'
    },
    fr: {
      msg: 'Ce site utilise des cookies pour améliorer votre expérience, analyser le trafic et sauvegarder vos préférences.',
      accept: 'Accepter',
      decline: 'Refuser',
      settings: 'Paramètres',
      title: '🍪 Avis de confidentialité',
      essential: 'Essentiels',
      analytics: 'Analytiques',
      preferences: 'Préférences',
      essentialDesc: 'Nécessaires au fonctionnement du site',
      analyticsDesc: 'Nous aident à comprendre l\'utilisation',
      preferencesDesc: 'Sauvegarde de la langue, thème et paramètres'
    }
  };

  const t = texts[lang] || texts.en;
  const isRtl = RTL_LANGS.includes(lang);

  const banner = document.createElement('div');
  banner.id = 'cookie-consent';
  banner.innerHTML = `
    <div class="cookie-inner">
      <div class="cookie-text">
        <strong>${t.title}</strong>
        <p>${t.msg}</p>
      </div>
      <div class="cookie-details" id="cookie-details" style="display:none">
        <label class="cookie-opt">
          <input type="checkbox" checked disabled> <b>${t.essential}</b> — ${t.essentialDesc}
        </label>
        <label class="cookie-opt">
          <input type="checkbox" id="ck-analytics" checked> <b>${t.analytics}</b> — ${t.analyticsDesc}
        </label>
        <label class="cookie-opt">
          <input type="checkbox" id="ck-prefs" checked> <b>${t.preferences}</b> — ${t.preferencesDesc}
        </label>
      </div>
      <div class="cookie-btns">
        <button class="ck-btn ck-settings" onclick="document.getElementById('cookie-details').style.display=document.getElementById('cookie-details').style.display==='none'?'block':'none'">${t.settings}</button>
        <button class="ck-btn ck-decline" onclick="saveCookieConsent('decline')">${t.decline}</button>
        <button class="ck-btn ck-accept" onclick="saveCookieConsent('accept')">${t.accept}</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #cookie-consent{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:rgba(10,10,10,.97);border-top:1px solid rgba(0,255,65,.2);backdrop-filter:blur(12px);padding:16px 20px;font-family:var(--font-main,'Inter',sans-serif);animation:ck-slide .4s ease}
    @keyframes ck-slide{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .cookie-inner{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:16px;direction:${isRtl?'rtl':'ltr'}}
    .cookie-text{flex:1;min-width:250px;color:#ccc;font-size:13px;line-height:1.5}
    .cookie-text strong{color:#00ff41;display:block;margin-bottom:4px;font-size:14px}
    .cookie-details{width:100%;padding:12px 0;border-top:1px solid rgba(255,255,255,.08)}
    .cookie-opt{display:block;color:#aaa;font-size:12px;margin:6px 0;cursor:pointer}
    .cookie-opt input{accent-color:#00ff41;margin-${isRtl?'left':'right'}:6px}
    .cookie-opt b{color:#e0e0e0}
    .cookie-btns{display:flex;gap:8px;flex-shrink:0}
    .ck-btn{padding:8px 18px;border:1px solid rgba(255,255,255,.15);border-radius:4px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
    .ck-accept{background:#00ff41;color:#000;border-color:#00ff41}
    .ck-accept:hover{background:#39ff14}
    .ck-decline{background:transparent;color:#888;border-color:rgba(255,255,255,.15)}
    .ck-decline:hover{color:#fff;border-color:#fff}
    .ck-settings{background:transparent;color:#00e5ff;border-color:rgba(0,229,255,.3)}
    .ck-settings:hover{border-color:#00e5ff}
    @media(max-width:600px){.cookie-inner{flex-direction:column;text-align:center}.cookie-btns{width:100%;justify-content:center}}
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);
}

function saveCookieConsent(choice) {
  const consent = {
    essential: true,
    analytics: choice === 'accept' ? (document.getElementById('ck-analytics')?.checked ?? true) : false,
    preferences: choice === 'accept' ? (document.getElementById('ck-prefs')?.checked ?? true) : false,
    timestamp: new Date().toISOString(),
    choice: choice
  };
  localStorage.setItem('slh_cookie_consent', JSON.stringify(consent));
  const el = document.getElementById('cookie-consent');
  if (el) el.style.animation = 'ck-slide .3s ease reverse forwards';
  setTimeout(() => { if (el) el.remove(); }, 300);
}
