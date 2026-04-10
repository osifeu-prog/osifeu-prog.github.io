// SLH Web3 Integration — MetaMask / Trust Wallet / WalletConnect
// Requires ethers.js v6 loaded BEFORE this script
// CDN: https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js

(function () {
  'use strict';

  const BSC_RPC = 'https://bsc-dataseed.binance.org/';
  const ETH_RPC = 'https://eth.llamarpc.com';
  const TON_API = 'https://toncenter.com/api/v2';
  const SLH_CONTRACT_BSC = '0xACb0A09414CEA1C879c67bB7A877E4e19480f022';
  const USDT_CONTRACT_BSC = '0x55d398326f99059fF775485246999027B3197955';

  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  let web3Provider = null;
  let web3Signer = null;
  let web3Address = null;

  function log(...args) {
    if (typeof console !== 'undefined') console.log('[SLH Web3]', ...args);
  }

  function hasEthers() {
    return typeof ethers !== 'undefined';
  }

  // ---- Helper: get logged-in user from either global currentUser or shared.js ----
  function _getUser() {
    try {
      if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) return currentUser;
    } catch (_) { /* currentUser not declared on this page */ }
    if (typeof getCurrentUser === 'function') {
      try { return getCurrentUser(); } catch (_) { return null; }
    }
    return null;
  }

  // ---- Connect / disconnect ----
  async function connectWallet() {
    if (!window.ethereum) {
      const msg = (typeof t === 'function' ? t('web3_no_wallet') : null)
        || 'No Web3 wallet detected. Install MetaMask (desktop) or open this page in Trust Wallet browser (mobile).';
      if (typeof showToast === 'function') showToast(msg, true);
      else alert(msg);
      return null;
    }
    if (!hasEthers()) {
      log('ethers.js not loaded — add <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js"></script>');
      if (typeof showToast === 'function') showToast('Web3 library not loaded, please refresh', true);
      return null;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3Address = accounts[0];
      web3Provider = new ethers.BrowserProvider(window.ethereum);
      web3Signer = await web3Provider.getSigner();
      localStorage.setItem('slh_web3_addr', web3Address);
      // Persist on server (requires user to be logged in)
      const u = _getUser();
      if (typeof apiPost === 'function' && u && u.id) {
        apiPost('/api/user/link-wallet', { user_id: u.id, address: web3Address })
          .then((r) => { if (r && r.ok) log('linked on server', r); })
          .catch(() => {});
      }
      if (typeof showToast === 'function') {
        const short = web3Address.slice(0, 6) + '...' + web3Address.slice(-4);
        showToast('✓ ' + short + ' connected');
      }
      log('connected', web3Address);
      return web3Address;
    } catch (err) {
      log('connect failed', err);
      if (typeof showToast === 'function') showToast('Failed to connect wallet', true);
      return null;
    }
  }

  async function disconnectWallet() {
    const prev = web3Address;
    web3Address = null;
    web3Provider = null;
    web3Signer = null;
    localStorage.removeItem('slh_web3_addr');
    // Best-effort server unlink
    const u = _getUser();
    if (typeof apiPost === 'function' && u && u.id) {
      try { await apiPost('/api/user/unlink-wallet', { user_id: u.id, address: prev || '' }); } catch (_) {}
    }
    log('disconnected');
  }

  // ---- Read balances ----
  async function getBSCBalance(address, contractAddress) {
    if (!hasEthers()) return 0;
    try {
      const rpc = new ethers.JsonRpcProvider(BSC_RPC);
      const contract = new ethers.Contract(contractAddress, ERC20_ABI, rpc);
      const [bal, dec] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals()
      ]);
      return parseFloat(ethers.formatUnits(bal, dec));
    } catch (e) { log('getBSCBalance', e); return 0; }
  }

  async function getBSCNativeBalance(address) {
    if (!hasEthers()) return 0;
    try {
      const rpc = new ethers.JsonRpcProvider(BSC_RPC);
      const bal = await rpc.getBalance(address);
      return parseFloat(ethers.formatEther(bal));
    } catch (e) { log('getBSCNativeBalance', e); return 0; }
  }

  async function getETHBalance(address) {
    if (!hasEthers()) return 0;
    try {
      const rpc = new ethers.JsonRpcProvider(ETH_RPC);
      const bal = await rpc.getBalance(address);
      return parseFloat(ethers.formatEther(bal));
    } catch (e) { log('getETHBalance', e); return 0; }
  }

  async function getTONBalance(tonAddress) {
    if (!tonAddress) return 0;
    try {
      const res = await fetch(`${TON_API}/getAddressBalance?address=${tonAddress}`);
      const data = await res.json();
      if (data && data.ok) return parseFloat(data.result) / 1e9;
    } catch (e) { log('getTONBalance', e); }
    return 0;
  }

  // ---- Render balances into the dashboard UI ----
  async function renderWeb3Balances(address) {
    if (!address) return;
    const setIf = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (val || 0).toFixed(4);
    };
    try {
      const [slh, bnb, eth, usdt] = await Promise.all([
        getBSCBalance(address, SLH_CONTRACT_BSC),
        getBSCNativeBalance(address),
        getETHBalance(address),
        getBSCBalance(address, USDT_CONTRACT_BSC)
      ]);
      setIf('w3-slh', slh);
      setIf('w3-bnb', bnb);
      setIf('w3-eth', eth);
      setIf('w3-usdt', usdt);
    } catch (e) { log('renderWeb3Balances', e); }
  }

  // ---- Sign a human-readable message (for P2P listings, auth proofs) ----
  async function signMessage(msg) {
    if (!web3Signer) throw new Error('Not connected');
    return await web3Signer.signMessage(msg);
  }

  // ---- Wire up the Connect / Disconnect UI ----
  function initWeb3UI() {
    const btnConnect = document.getElementById('btn-connect-wallet');
    const btnDisconnect = document.getElementById('btn-disconnect-wallet');
    const statusEl = document.getElementById('web3-status');
    const balancesEl = document.getElementById('web3-balances');
    const addrEl = document.getElementById('web3-addr-short');

    if (!btnConnect) return; // page has no Web3 panel

    const showConnected = (addr) => {
      if (statusEl) statusEl.style.display = 'none';
      if (balancesEl) balancesEl.style.display = 'block';
      if (addrEl) addrEl.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
      renderWeb3Balances(addr);
    };
    const showDisconnected = () => {
      if (statusEl) statusEl.style.display = 'block';
      if (balancesEl) balancesEl.style.display = 'none';
    };

    btnConnect.addEventListener('click', async () => {
      const addr = await connectWallet();
      if (addr) showConnected(addr);
    });
    if (btnDisconnect) {
      btnDisconnect.addEventListener('click', () => {
        disconnectWallet();
        showDisconnected();
      });
    }

    // Auto-reconnect if previously authorized
    const saved = localStorage.getItem('slh_web3_addr');
    if (saved && window.ethereum && hasEthers()) {
      web3Address = saved;
      showConnected(saved);
    }

    // Listen for account switch
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on('accountsChanged', (accs) => {
        if (!accs || accs.length === 0) {
          disconnectWallet();
          showDisconnected();
        } else {
          web3Address = accs[0];
          localStorage.setItem('slh_web3_addr', accs[0]);
          showConnected(accs[0]);
        }
      });
      window.ethereum.on('chainChanged', () => {
        if (web3Address) renderWeb3Balances(web3Address);
      });
    }
  }

  // ---- Expose globals ----
  window.SLHWeb3 = {
    connect: connectWallet,
    disconnect: disconnectWallet,
    sign: signMessage,
    getAddress: () => web3Address,
    getBalances: renderWeb3Balances,
    getBSCBalance: getBSCBalance,
    getBSCNative: getBSCNativeBalance,
    getETH: getETHBalance,
    getTON: getTONBalance,
    init: initWeb3UI,
    SLH_CONTRACT_BSC,
    USDT_CONTRACT_BSC
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeb3UI);
  } else {
    initWeb3UI();
  }
})();
