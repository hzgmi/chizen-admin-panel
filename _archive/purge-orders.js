/* CHIZEN | purge-orders.js — أداة تصدير وحذف الطلبات التجريبية */
(function() {
  'use strict';

  var ADMIN_EMAILS = ['hazimchat@gmail.com'];
  var SECTION_ID = 'chz-purge-section';

  function visible() {
    return window.location && window.location.search.indexOf('purge=1') !== -1;
  }

  function ensureUser() {
    var u = firebase.auth && firebase.auth().currentUser;
    if (!u) { alert('يجب تسجيل الدخول'); return null; }
    if (ADMIN_EMAILS.indexOf(u.email) === -1) { alert('⛔ هذه الأداة للمدير فقط'); return null; }
    return u;
  }

  async function exportAll() {
    if (!ensureUser()) return;
    var db = firebase.firestore();
    var result = { exportedAt: new Date().toISOString(), collections: {} };
    var cols = ['orders', 'payments', 'notifications', 'activity_log', 'commissions'];
    for (var i = 0; i < cols.length; i++) {
      var name = cols[i];
      try {
        var snap = await db.collection(name).get();
        var arr = [];
        snap.forEach(function(d) { var o = d.data(); o._id = d.id; arr.push(o); });
        result.collections[name] = { count: arr.length, docs: arr };
        console.log('[export] ' + name + ': ' + arr.length);
      } catch(e) {
        console.warn('[export] ' + name + ' error:', e.message);
        result.collections[name] = { count: 0, docs: [], error: e.message };
      }
    }
    var json = JSON.stringify(result, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'chizen-backup-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); a.remove(); }, 1000);
    alert('✅ تم تصدير: ' + Object.keys(result.collections).map(function(k) {
      return k + '=' + result.collections[k].count;
    }).join(' | ') + '\n\nالملف نزل في مجلد التنزيلات.');
  }

  function render() {
    if (!visible()) return;
    if (!ensureUser()) return;
    if (document.getElementById(SECTION_ID)) return;
    var anchor = document.getElementById('sc-orders') || document.body;
    var sec = document.createElement('div');
    sec.id = SECTION_ID;
    sec.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#0b1220;border:2px solid #ef4444;border-radius:16px;padding:14px;box-shadow:0 10px 40px rgba(239,68,68,0.4);max-width:280px;font-family:sans-serif;direction:rtl;';
    sec.innerHTML =
      '<div style="font-weight:900;color:#ef4444;font-size:13px;margin-bottom:6px;">⚠️ أدوات الصيانة</div>' +
      '<div style="font-size:10px;color:#9ca3af;margin-bottom:10px;">تصدير البيانات التجريبية قبل أي حذف</div>' +
      '<button id="chz-export-btn" style="width:100%;background:#10b981;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit;">📥 تصدير JSON</button>' +
      '<button id="chz-close-btn" style="width:100%;margin-top:6px;background:#374151;color:#9ca3af;border:none;padding:8px;border-radius:10px;font-size:11px;cursor:pointer;font-family:inherit;">إغلاق</button>';
    document.body.appendChild(sec);
    document.getElementById('chz-export-btn').onclick = function() {
      this.disabled = true; this.textContent = 'جاري التصدير...';
      exportAll().finally(function() {
        var b = document.getElementById('chz-export-btn');
        if (b) { b.disabled = false; b.textContent = '📥 تصدير JSON'; }
      });
    };
    document.getElementById('chz-close-btn').onclick = function() { sec.remove(); };
  }

  function boot() {
    if (typeof firebase === 'undefined') { setTimeout(boot, 500); return; }
    firebase.auth().onAuthStateChanged(function() { setTimeout(render, 1500); });
  }
  boot();
  console.log('[CHIZEN] purge-orders.js loaded (export only)');
})();
