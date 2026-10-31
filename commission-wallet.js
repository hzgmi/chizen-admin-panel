/* ═══════════════════════════════════════════════════════════════
   CHIZEN — Commission Wallet Widget
   محفظة العمولات — تظهر في أعلى لوحة كل موظف
   ═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var W = window.CommissionWallet = window.CommissionWallet || {};
  var MOUNTED = false;

  // ═══ Styles (حقن مرة واحدة) ═══
  var STYLES = `
  .cw-card {
    background: linear-gradient(135deg, #FF8A00 0%, #FF3D9A 30%, #9B4DFF 60%, #4D8CFF 100%);
    border-radius: 22px;
    padding: 22px 20px;
    margin-bottom: 18px;
    color: #fff;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 36px rgba(236,72,153,0.35);
  }
  .cw-card::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 180px; height: 180px;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    filter: blur(30px);
  }
  .cw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; z-index: 1; }
  .cw-title { font-size: 14px; font-weight: 800; opacity: 0.95; }
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
  .cw-loading { text-align: center; padding: 20px; font-size: 12px; opacity: 0.8; }
  `;

  function injectStyles() {
    if (document.getElementById('cw-styles')) return;
    var s = document.createElement('style');
    s.id = 'cw-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ═══ Render ═══
  W.render = function(wallet) {
    var fmt = function(n) { return Number(n || 0).toLocaleString('ar-EG'); };
    var html = 
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
      '</div>';
    return html;
  };

  // ═══ Load & Mount ═══
  W.load = async function() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    var user = firebase.auth().currentUser;
    if (!user) return;
    if (typeof window.CommissionEngine === 'undefined') {
      console.warn('[CW] CommissionEngine not loaded yet');
      return;
    }
    try {
      var wallet = await window.CommissionEngine.getWallet(user.uid);
      // عدد المنتجات الفعلي
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

      // Mount
      var slot = document.getElementById('commission-wallet-slot');
      if (!slot) {
        // ننشئ slot ديناميكياً ونضعه فوق #dash-v2
        var dashV2 = document.getElementById('dash-v2');
        if (!dashV2) return;
        slot = document.createElement('div');
        slot.id = 'commission-wallet-slot';
        dashV2.parentNode.insertBefore(slot, dashV2);
      }
      slot.innerHTML = '<div class="cw-card" id="cw-main-card">' + W.render(wallet) + '</div>';
      
      // Toggle details
      var toggleBtn = document.getElementById('cw-toggle-btn');
      if (toggleBtn) {
        toggleBtn.onclick = function() {
          var det = document.getElementById('cw-details');
          if (det) det.classList.toggle('open');
        };
      }
      
      MOUNTED = true;
      console.log('[CW] mounted for', user.email, '— total:', wallet.total);
    } catch(e) {
      console.warn('[CW] load error:', e.message);
    }
  };

  // ═══ Init ═══
  W.init = function() {
    injectStyles();
    if (typeof firebase === 'undefined' || !firebase.auth) {
      setTimeout(W.init, 1000);
      return;
    }
    firebase.auth().onAuthStateChanged(function(user) {
      if (!user) return;
      // انتظر حتى يظهر #dash-v2 (بعد الدخول للوحة)
      var attempts = 0;
      var waitForDash = setInterval(function() {
        attempts++;
        if (document.getElementById('dash-v2') || document.getElementById('commission-wallet-slot')) {
          clearInterval(waitForDash);
          W.load();
          // إعادة التحميل كل 30 ثانية
          setInterval(W.load, 30000);
        } else if (attempts > 30) {
          clearInterval(waitForDash);
        }
      }, 1000);
    });
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', W.init);
  } else {
    W.init();
  }

  console.log('[CW] Commission Wallet ready.');
})();
