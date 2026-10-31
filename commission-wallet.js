/* ═══════════════════════════════════════════════════════════════
   CHIZEN — Commission Wallet Widget v3 (Fixed return bug)
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var W = window.CommissionWallet = window.CommissionWallet || {};
  var DEBUG = location.search.indexOf('debug=1') !== -1;

  var STYLES = `
  .cw-card { background: linear-gradient(135deg, #FF8A00 0%, #FF3D9A 30%, #9B4DFF 60%, #4D8CFF 100%); border-radius: 22px; padding: 22px 20px; color: #fff; position: relative; overflow: hidden; box-shadow: 0 12px 36px rgba(236,72,153,0.35); }
  .cw-card::before { content: ''; position: absolute; top: -60px; right: -60px; width: 180px; height: 180px; background: rgba(255,255,255,0.15); border-radius: 50%; filter: blur(30px); }
  .cw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1; }
  .cw-title { font-size: 14px; font-weight: 800; }
  .cw-toggle { background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 6px 12px; border-radius: 10px; cursor: pointer; font-size: 11px; font-weight: 700; font-family: inherit; }
  .cw-total-label { font-size: 11px; opacity: 0.85; margin-bottom: 4px; position: relative; z-index: 1; }
  .cw-total-value { font-size: 32px; font-weight: 900; line-height: 1; margin-bottom: 4px; position: relative; z-index: 1; }
  .cw-total-currency { font-size: 14px; font-weight: 700; opacity: 0.9; }
  .cw-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 16px; position: relative; z-index: 1; }
  .cw-stat { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 10px 12px; backdrop-filter: blur(10px); }
  .cw-stat-label { font-size: 10px; opacity: 0.85; margin-bottom: 2px; }
  .cw-stat-value { font-size: 16px; font-weight: 900; }
  .cw-details { margin-top: 16px; display: none; position: relative; z-index: 1; }
  .cw-details.open { display: block; }
  .cw-log-item { background: rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 12px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 11px; }
  .cw-log-info { flex: 1; min-width: 0; }
  .cw-log-title { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .cw-log-meta { font-size: 10px; opacity: 0.8; }
  .cw-log-amount { font-weight: 900; font-size: 13px; white-space: nowrap; }
  .cw-log-status { font-size: 9px; padding: 2px 6px; border-radius: 6px; margin-top: 2px; display: inline-block; }
  .cw-log-status.earned { background: rgba(16,185,129,0.35); }
  .cw-log-status.paid { background: rgba(59,130,246,0.35); }
  .cw-log-status.pending { background: rgba(251,191,36,0.35); }
  .cw-empty { text-align: center; padding: 20px; opacity: 0.8; font-size: 12px; }
  .cw-slot { padding: 12px 16px 4px; }
  #cw-diag { position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.95); color: #0f0; padding: 12px; border-radius: 8px; font-size: 11px; font-family: monospace; z-index: 999999; max-width: 90vw; max-height: 300px; overflow: auto; }
  #cw-diag div { padding: 2px 0; }
  #cw-diag .err { color: #f00; }
  #cw-diag .ok { color: #0f0; }
  `;

  function injectStyles() {
    if (document.getElementById('cw-styles')) return;
    var s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ═══ Debug helper ═══
  var diagLines = [];
  function diag(msg, isError) {
    if (DEBUG) {
      diagLines.push((isError ? '❌ ' : '✓ ') + msg);
      var d = document.getElementById('cw-diag');
      if (!d) {
        d = document.createElement('div');
        d.id = 'cw-diag';
        document.body.appendChild(d);
      }
      d.innerHTML = diagLines.map(function(l) {
        var cls = l.indexOf('❌') === 0 ? 'err' : 'ok';
        return '<div class="' + cls + '">' + l + '</div>';
      }).join('');
    }
    console.log('[CW] ' + msg);
  }

  // ═══ Fixed render ═══
  W.render = function(wallet) {
    var fmt = function(n) { return Number(n || 0).toLocaleString('ar-EG'); };
    var html = (
      '<div class="cw-header">' +
        '<div class="cw-title">💰 محفظة عمولاتي</div>' +
        '<button class="cw-toggle" id="cw-toggle-btn">📋 السجل</button>' +
      '</div>' +
      '<div class="cw-total-label">إجمالي المكتسب</div>' +
      '<div class="cw-total-value">' + fmt(wallet.total) + ' <span class="cw-total-currency">ر.س</span></div>' +
      '<div class="cw-grid">' +
        '<div class="cw-stat"><div class="cw-stat-label">📅 هذا الشهر</div><div class="cw-stat-value">' + fmt(wallet.thisMonth) + '</div></div>' +
        '<div class="cw-stat"><div class="cw-stat-label">⏳ معلّقة</div><div class="cw-stat-value">' + fmt(wallet.pending) + '</div></div>' +
        '<div class="cw-stat"><div class="cw-stat-label">✅ مستحقة</div><div class="cw-stat-value">' + fmt(wallet.earned) + '</div></div>' +
        '<div class="cw-stat"><div class="cw-stat-label">💸 مدفوعة</div><div class="cw-stat-value">' + fmt(wallet.paid) + '</div></div>' +
      '</div>' +
      '<div class="cw-grid" style="margin-top:10px;">' +
        '<div class="cw-stat"><div class="cw-stat-label">📦 الطلبات</div><div class="cw-stat-value">' + (wallet.ordersCount || 0) + '</div></div>' +
        '<div class="cw-stat"><div class="cw-stat-label">🛍️ المنتجات</div><div class="cw-stat-value">' + (wallet.itemsCount || 0) + '</div></div>' +
      '</div>' +
      '<div class="cw-details" id="cw-details">' +
        (wallet.items.length === 0 ? 
          '<div class="cw-empty">لا توجد عمولات بعد — ستظهر هنا عند اكتمال طلباتك</div>' :
          wallet.items.slice(0, 20).map(function(c) {
            var date = c.earnedAt && c.earnedAt.seconds ? new Date(c.earnedAt.seconds * 1000).toLocaleDateString('ar-EG') : '—';
            var statusLabel = { earned: 'مستحقة', paid: 'مدفوعة', pending: 'معلقة', cancelled: 'ملغاة' }[c.status] || c.status;
            var icon = c.employeeRole === 'cat_manager' ? '🏷️' : (c.employeeRole === 'delivery_mgr' ? '🚚' : '✈️');
            return '<div class="cw-log-item">' +
              '<div class="cw-log-info">' +
                '<div class="cw-log-title">' + icon + ' طلب #' + String(c.orderId || '').substring(0, 8) + '</div>' +
                '<div class="cw-log-meta">' + date + ' · ' + (c.category || c.employeeRole) + '</div>' +
                '<span class="cw-log-status ' + c.status + '">' + statusLabel + '</span>' +
              '</div>' +
              '<div class="cw-log-amount">' + fmt(c.commissionAmount) + ' ر.س</div>' +
            '</div>';
          }).join('')
        ) +
      '</div>'
    );
    return html;
  };

  function findMountPoint() {
    // 0. #dlv-main — لوحة المندوب (أولوية أولى)
    var dlvMain = document.getElementById('dlv-main');
    if (dlvMain && dlvMain.parentNode) return { el: dlvMain, mode: 'before' };

    // 0b. #cm-content — لوحة مدير القسم
    var cmContent = document.getElementById('cm-content');
    if (cmContent && cmContent.parentNode) return { el: cmContent, mode: 'before' };

    // 1. #dash-v2 (أفضل مكان - داخل قسم الرئيسية)
    var dashV2 = document.getElementById('dash-v2');
    if (dashV2 && dashV2.parentNode) return { el: dashV2, mode: 'before' };
    
    // 2. #sc-dash
    var scDash = document.getElementById('sc-dash');
    if (scDash) return { el: scDash, mode: 'prepend' };
    
    // 3. #ct
    var ct = document.getElementById('ct');
    if (ct && ct.children.length > 0) return { el: ct, mode: 'prepend' };
    
    return null;
  }

    W._hookTabs = function() {
    if (!document.getElementById('cw-wallet-style')) {
      var _st = document.createElement('style');
      _st.id = 'cw-wallet-style';
      _st.textContent = '#commission-wallet-slot{display:none!important}body.cw-wallet-active #commission-wallet-slot{display:block!important}body.cw-wallet-active #cm-content,body.cw-wallet-active #dlv-main{display:none!important}';
      document.head.appendChild(_st);
    }
    var slot = W._slot, mount = W._mount;
    if (!slot || !mount || W._hooksInstalled) return;
    W._hooksInstalled = true;

    function showWallet() {
      try {
        if (typeof diag === 'function') diag('wallet click');
        document.body.classList.add('cw-wallet-active');
        document.querySelectorAll('.cm-tabs button, .dlv-nav-btn').forEach(function(b) { b.classList.remove('active'); });
        var w = document.querySelector('[data-cw-wallet-tab]'); if (w) w.classList.add('active');
      } catch(e) { console.error('[CW] showWallet', e); }
    }
    function hideWallet() {
      try { document.body.classList.remove('cw-wallet-active'); }
      catch(e) { console.error('[CW] hideWallet', e); }
    }

    var cmTabs = document.querySelector('.cm-tabs');
    if (cmTabs && !cmTabs.querySelector('[data-cw-wallet-tab]')) {
      var btn = document.createElement('button');
      btn.textContent = '💰 محفظتي';
      btn.setAttribute('data-cw-wallet-tab', '1');
      btn.onclick = showWallet;
      cmTabs.appendChild(btn);
    }

    var dlvNav = document.querySelector('.dlv-nav');
    if (dlvNav && !dlvNav.querySelector('[data-cw-wallet-tab]')) {
      var btn2 = document.createElement('button');
      btn2.className = 'dlv-nav-btn';
      btn2.setAttribute('data-cw-wallet-tab', '1');
      btn2.innerHTML = '<span class="icon">💰</span><span class="label">محفظة</span>';
      btn2.onclick = showWallet;
      dlvNav.appendChild(btn2);
    }

    if (window.catMgrApp && typeof window.catMgrApp.switchTab === 'function' && !window.catMgrApp.__cwHooked) {
      var orig = window.catMgrApp.switchTab;
      window.catMgrApp.switchTab = function(t) { hideWallet(); return orig.call(this, t); };
      window.catMgrApp.__cwHooked = true;
    }

    if (typeof window.__dlvSwitchTab === 'function' && !window.__dlvSwitchTab.__cwHooked) {
      var origDlv = window.__dlvSwitchTab;
      var newFn = function(t, el) { hideWallet(); return origDlv.call(this, t, el); };
      newFn.__cwHooked = true;
      window.__dlvSwitchTab = newFn;
    }

    if (!W._docClickHooked) {
      W._docClickHooked = true;
      document.addEventListener('click', function(e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('[data-cw-wallet-tab]')) {
          e.preventDefault();
          showWallet();
        }
      }, true);
    }
  };

W.load = async function() {
    diag('load() called');
    
    if (typeof firebase === 'undefined' || !firebase.auth) {
      diag('firebase not ready', true);
      return;
    }
    var user = firebase.auth().currentUser;
    if (!user) { diag('no user', true); return; }
    diag('user: ' + user.email);
    
    if (typeof window.CommissionEngine === 'undefined') {
      diag('engine not loaded', true);
      return;
    }
    diag('engine OK');
    
    var mount = findMountPoint();
    if (!mount) {
      diag('no mount point — retry in 2s', true);
      setTimeout(W.load, 2000);
      return;
    }
    diag('mount: ' + (mount.el.id || mount.el.className) + ' (' + mount.mode + ')');
    
    try {
      var wallet = await window.CommissionEngine.getWallet(user.uid);
      diag('wallet total=' + wallet.total + ' items=' + wallet.items.length);
      
      var itemsCount = 0;
      try {
        var ordersSnap = await firebase.firestore().collection('orders')
          .where('customerId', '==', user.uid).limit(50).get();
        ordersSnap.docs.forEach(function(d) {
          var o = d.data();
          if (o.items) itemsCount += o.items.length;
        });
      } catch(e) {}
      wallet.itemsCount = itemsCount;
      
      var html = W.render(wallet);
      diag('render OK, ' + html.length + ' chars');
      
            var slot = document.getElementById('commission-wallet-slot');
      if (!slot) {
        slot = document.createElement('div');
        slot.id = 'commission-wallet-slot';
        slot.className = 'cw-slot';
        slot.style.display = 'none';
        if (mount.mode === 'prepend') {
          mount.el.insertBefore(slot, mount.el.firstChild);
        } else if (mount.mode === 'before') {
          mount.el.parentNode.insertBefore(slot, mount.el);
        }
        W._slot = slot;
        W._mount = mount;
        W._hookTabs();
      }
      slot.innerHTML = '<div class="cw-card">' + html + '</div>';

      var toggleBtn = document.getElementById('cw-toggle-btn');
      if (toggleBtn) {
        toggleBtn.onclick = function() {
          var det = document.getElementById('cw-details');
          if (det) det.classList.toggle('open');
        };
      }
      
      diag('mounted ✅');
    } catch(e) {
      diag('load error: ' + e.message, true);
    }
  };

  W.init = function() {
    if (window.CHIZEN_DLV_WALLET_NATIVE) { diag('native wallet active — skip injection'); return; }
    injectStyles();
    diag('init called');
    if (typeof firebase === 'undefined' || !firebase.auth) {
      setTimeout(W.init, 1000);
      return;
    }
    firebase.auth().onAuthStateChanged(function(user) {
      if (!user) { diag('logged out'); return; }
      diag('auth: ' + user.email);
      var attempts = 0;
      var timer = setInterval(function() {
        attempts++;
        W.load();
        if (attempts >= 8) clearInterval(timer);
      }, 1000);
      setInterval(W.load, 30000);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', W.init);
  } else {
    W.init();
  }

  console.log('[CW] v3 loaded. Debug: add ?debug=1 to URL');
})();
