const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-acct-v93')) { console.log('already'); process.exit(0); }

const js = `
<style id="chz-acct-v93-css">
/* ═══ v93: Clean accountant extension — NO infinite loops ═══ */
#accountant-mgr-app .ca-nav-bar {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  gap: 6px !important;
  padding: 8px 10px !important;
  scrollbar-width: none !important;
  -webkit-overflow-scrolling: touch !important;
  background: rgba(15,10,35,0.98) !important;
  border-bottom: 1px solid rgba(168,85,247,0.15) !important;
  min-height: 60px !important;
  max-height: 68px !important;
  box-sizing: border-box !important;
}
#accountant-mgr-app .ca-nav-bar::-webkit-scrollbar { display: none !important; }

#accountant-mgr-app .ca-nav-btn {
  flex: 0 0 auto !important;
  min-width: 58px !important;
  max-width: 84px !important;
  padding: 6px 10px !important;
  display: inline-flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 2px !important;
  white-space: nowrap !important;
  transition: all 0.15s !important;
}

#accountant-mgr-app [id^="ca-content-"] {
  display: none !important;
  padding: 12px !important;
  box-sizing: border-box !important;
  width: 100% !important;
}
#accountant-mgr-app [id^="ca-content-"].v93-shown {
  display: block !important;
}

.v93-content {
  padding: 4px 0 !important;
  direction: rtl !important;
  font-family: 'Tajawal', sans-serif !important;
}
.v93-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 10px !important;
  margin-bottom: 14px !important;
}
.v93-card-kpi {
  padding: 12px !important;
  border-radius: 12px !important;
  text-align: center !important;
  border: 1.5px solid !important;
}
.v93-kpi-green { background: rgba(16,185,129,0.08) !important; border-color: rgba(16,185,129,0.3) !important; }
.v93-kpi-green .v93-v { color: #10b981 !important; }
.v93-kpi-red { background: rgba(239,68,68,0.08) !important; border-color: rgba(239,68,68,0.3) !important; }
.v93-kpi-red .v93-v { color: #ef4444 !important; }
.v93-kpi-purple { background: rgba(168,85,247,0.08) !important; border-color: rgba(168,85,247,0.3) !important; }
.v93-kpi-purple .v93-v { color: #a855f7 !important; }
.v93-kpi-yellow { background: rgba(245,158,11,0.08) !important; border-color: rgba(245,158,11,0.3) !important; }
.v93-kpi-yellow .v93-v { color: #f59e0b !important; }
.v93-l { font-size: 10px !important; color: #9ca3af !important; font-weight: 700 !important; margin-bottom: 4px !important; }
.v93-v { font-size: 16px !important; font-weight: 900 !important; }
.v93-row {
  padding: 12px !important;
  background: rgba(20,15,45,0.85) !important;
  border: 1px solid rgba(168,85,247,0.15) !important;
  border-radius: 12px !important;
  margin-bottom: 8px !important;
  font-size: 12px !important;
}
.v93-empty { padding: 30px !important; text-align: center !important; color: #6b7280 !important; font-size: 12px !important; }
</style>

<script id="chz-acct-v93">
(function(){
  'use strict';
  
  if (window.__V93Lock) return;
  window.__V93Lock = true;
  
  var NEW_TABS = ['products', 'employees', 'advances', 'report'];
  var isSwitching = false;
  var tried = 0;
  
  function start() {
    tried++;
    if (tried > 40) { console.warn('[v93] gave up'); return; }
    
    var app = document.getElementById('accountant-mgr-app');
    if (!app) return setTimeout(start, 400);
    
    var navBar = app.querySelector('.ca-nav-bar');
    if (!navBar) {
      var btns = app.querySelectorAll('.ca-nav-btn');
      if (!btns.length) return setTimeout(start, 400);
      navBar = btns[0].parentElement;
      if (navBar) navBar.classList.add('ca-nav-bar');
    }
    if (!navBar) return setTimeout(start, 400);
    
    install(app, navBar);
  }
  
  function install(app, navBar) {
    console.log('[v93] installing...');
    
    // 1. Add buttons (only if missing)
    var existing = {};
    navBar.querySelectorAll('.ca-nav-btn').forEach(function(b) {
      existing[b.getAttribute('data-tab')] = true;
    });
    
    var tabDefs = {
      products: { icon: '📦', label: 'المنتجات' },
      employees: { icon: '👥', label: 'الموظفون' },
      advances: { icon: '💳', label: 'التقدمات' },
      report: { icon: '📈', label: 'تقرير' }
    };
    
    NEW_TABS.forEach(function(key) {
      if (existing[key]) return;
      var btn = document.createElement('button');
      btn.className = 'ca-nav-btn';
      btn.setAttribute('data-tab', key);
      btn.setAttribute('onclick', 'window.__caSwitchTab(\\'' + key + '\\', this)');
      btn.innerHTML = '<span class="icon">' + tabDefs[key].icon + '</span><span class="label">' + tabDefs[key].label + '</span>';
      navBar.appendChild(btn);
    });
    
    // 2. Create content panels
    NEW_TABS.forEach(function(key) {
      var id = 'ca-content-' + key;
      if (document.getElementById(id)) return;
      var panel = document.createElement('div');
      panel.id = id;
      panel.className = 'v93-content';
      app.appendChild(panel);
    });
    
    // 3. Patch __caSwitchTab (guarded against recursion)
    var orig = window.__caSwitchTab;
    if (orig && !orig._v93) {
      window.__caSwitchTab = function(tab, btn) {
        if (isSwitching) return;
        isSwitching = true;
        try {
          // Handle new tabs FIRST — orig doesn't know them
          if (NEW_TABS.indexOf(tab) > -1) {
            app.querySelectorAll('[id^="ca-content-"]').forEach(function(c) {
              c.classList.remove('v93-shown');
              c.style.display = 'none';
            });
            var target = document.getElementById('ca-content-' + tab);
            if (target) {
              target.classList.add('v93-shown');
              target.style.display = 'block';
            }
            navBar.querySelectorAll('.ca-nav-btn').forEach(function(b) {
              b.classList.toggle('active', b.getAttribute('data-tab') === tab);
            });
            if (tab === 'products') renderProducts(target);
            if (tab === 'employees') renderEmployees(target);
            if (tab === 'advances') renderAdvances(target);
            if (tab === 'report') renderReport(target);
            return;
          }
          
          // Old tabs — call orig
          orig.call(this, tab, btn);
          
          // Hide new content
          app.querySelectorAll('[id^="ca-content-"]').forEach(function(c) {
            if (NEW_TABS.indexOf(c.id.replace('ca-content-', '')) > -1) {
              c.classList.remove('v93-shown');
              c.style.display = 'none';
            }
          });
        } finally {
          isSwitching = false;
        }
      };
      window.__caSwitchTab._v93 = true;
    }
    
    function esc(s) { return String(s || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    
    function renderProducts(t) {
      var prods = window.A.products || [];
      if (!prods.length) { t.innerHTML = '<div class="v93-empty">لا منتجات</div>'; return; }
      
      var tc = 0, ts = 0, tp = 0, wc = 0;
      prods.forEach(function(p) {
        var c = Number(p.costPrice) || 0;
        var s = Number(p.price) || 0;
        ts += s;
        if (c > 0) { tc += c; tp += (s - c); wc++; }
      });
      var mg = wc > 0 && ts > 0 ? Math.round((tp / ts) * 100) : 0;
      
      var html = '<div class="v93-grid">' +
        '<div class="v93-card-kpi v93-kpi-purple"><div class="v93-l">📦 المنتجات</div><div class="v93-v">' + prods.length + '</div></div>' +
        '<div class="v93-card-kpi v93-kpi-green"><div class="v93-l">💰 الربح (' + mg + '%)</div><div class="v93-v">' + (wc > 0 ? tp.toLocaleString('ar-EG') : '—') + '</div></div>' +
        '<div class="v93-card-kpi v93-kpi-red"><div class="v93-l">💵 الجملة</div><div class="v93-v">' + (wc > 0 ? tc.toLocaleString('ar-EG') : '—') + '</div></div>' +
        '<div class="v93-card-kpi v93-kpi-purple"><div class="v93-l">💵 البيع</div><div class="v93-v">' + ts.toLocaleString('ar-EG') + '</div></div>' +
      '</div>';
      
      prods.forEach(function(p) {
        var c = Number(p.costPrice) || 0;
        var s = Number(p.price) || 0;
        var pr = s - c;
        var m = c > 0 && s > 0 ? ((pr / s) * 100).toFixed(1) : '—';
        var col = c > 0 ? (pr > 0 ? (parseFloat(m) >= 20 ? '#10b981' : '#f59e0b') : '#ef4444') : '#6b7280';
        html += '<div class="v93-row">' +
          '<div style="font-weight:800;color:#e5e7eb;margin-bottom:4px;">' + esc(p.name) + '</div>' +
          '<div style="color:#9ca3af;font-size:10px;margin-bottom:6px;">🏢 ' + esc(p.supplierName || '—') + '</div>' +
          '<div style="display:flex;justify-content:space-between;">' +
            '<span>جملة: <b style="color:#ef4444;">' + (c > 0 ? c.toLocaleString('ar-EG') : '—') + '</b> · بيع: <b style="color:#a855f7;">' + s.toLocaleString('ar-EG') + '</b></span>' +
            '<b style="color:' + col + ';">' + (c > 0 ? (pr > 0 ? '+' : '') + pr.toLocaleString('ar-EG') + ' (' + m + '%)' : '—') + '</b>' +
          '</div>' +
        '</div>';
      });
      t.innerHTML = html;
    }
    
    function renderEmployees(t) {
      if (!window.FB || !FB.db) { t.innerHTML = '<div class="v93-empty">⚠️ Firebase</div>'; return; }
      t.innerHTML = '<div class="v93-empty">⏳ تحميل...</div>';
      FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(50).get().then(function(s) {
        var emps = [];
        s.forEach(function(d) { var u = d.data(); u._id = d.id; emps.push(u); });
        if (!emps.length) { t.innerHTML = '<div class="v93-empty">لا موظفين</div>'; return; }
        
        var lbl = { cat_manager: 'مدير قسم', delivery_mgr: 'مندوب', accountant: 'محاسب', bookings_mgr: 'مدير حجوزات' };
        var html = '<div class="v93-grid"><div class="v93-card-kpi v93-kpi-purple"><div class="v93-l">👥 الموظفون</div><div class="v93-v">' + emps.length + '</div></div></div>';
        emps.forEach(function(e) {
          html += '<div class="v93-row"><div style="font-weight:800;color:#e5e7eb;">' + esc(e.name || e.email || 'موظف') + '</div><div style="color:#9ca3af;font-size:10px;">' + (lbl[e.role] || e.role) + (e.assignedCategory ? ' · ' + e.assignedCategory : '') + '</div></div>';
        });
        t.innerHTML = html;
      }).catch(function(e) { t.innerHTML = '<div class="v93-empty">⚠️ ' + e.message + '</div>'; });
    }
    
    function renderAdvances(t) {
      if (!window.FB || !FB.db) { t.innerHTML = '<div class="v93-empty">⚠️ Firebase</div>'; return; }
      t.innerHTML = '<div class="v93-empty">⏳ تحميل...</div>';
      FB.db.collection('transactions').limit(100).get().then(function(s) {
        var tr = [];
        s.forEach(function(d) { var x = d.data(); x._id = d.id; tr.push(x); });
        if (!tr.length) { t.innerHTML = '<div class="v93-empty">لا حركات مالية</div>'; return; }
        
        var adv = 0, ded = 0, paid = 0;
        tr.forEach(function(x) {
          var a = Number(x.amount) || 0;
          if (x.type === 'advance') adv += a;
          else if (x.type === 'deduction') ded += a;
          else if (x.type === 'paid') paid += a;
        });
        
        var html = '<div class="v93-grid">' +
          '<div class="v93-card-kpi v93-kpi-yellow"><div class="v93-l">💸 تقدمات</div><div class="v93-v">' + adv.toLocaleString('ar-EG') + '</div></div>' +
          '<div class="v93-card-kpi v93-kpi-red"><div class="v93-l">📉 خصومات</div><div class="v93-v">' + ded.toLocaleString('ar-EG') + '</div></div>' +
          '<div class="v93-card-kpi v93-kpi-green"><div class="v93-l">✅ مدفوع</div><div class="v93-v">' + paid.toLocaleString('ar-EG') + '</div></div>' +
        '</div>';
        
        tr.forEach(function(x) {
          var ic = { advance: '💸', deduction: '📉', paid: '✅' }[x.type] || '📝';
          html += '<div class="v93-row"><div style="display:flex;justify-content:space-between;"><div><div style="font-weight:800;color:#e5e7eb;">' + ic + ' ' + esc(x.userName || 'موظف') + '</div><div style="color:#9ca3af;font-size:10px;">' + x.type + '</div></div><div style="text-align:left;"><div style="color:#a855f7;font-weight:900;">' + (Number(x.amount) || 0).toLocaleString('ar-EG') + '</div><div style="font-size:10px;">' + (x.status || '') + '</div></div></div></div>';
        });
        t.innerHTML = html;
      }).catch(function(e) { t.innerHTML = '<div class="v93-empty">⚠️ ' + e.message + '</div>'; });
    }
    
    function renderReport(t) {
      var orders = window.A.orders || [];
      var prods = window.A.products || [];
      var now = new Date();
      var mo = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
      var mOrd = orders.filter(function(o) {
        var ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
        return ts >= mo && o.status !== 'cancelled';
      });
      var rev = mOrd.reduce(function(s, o) { return s + (Number(o.total) || 0); }, 0);
      var cost = 0;
      mOrd.forEach(function(o) {
        (o.items || []).forEach(function(it) {
          var p = prods.find(function(x) { return String(x.id) === String(it.id); });
          if (p && p.costPrice > 0) cost += (Number(p.costPrice) || 0) * (Number(it.qty) || 1);
        });
      });
      var net = rev - cost;
      var col = net >= 0 ? '#10b981' : '#ef4444';
      
      t.innerHTML = '<div class="v93-grid">' +
        '<div class="v93-card-kpi v93-kpi-green"><div class="v93-l">💰 إيرادات</div><div class="v93-v">' + rev.toLocaleString('ar-EG') + '</div></div>' +
        '<div class="v93-card-kpi v93-kpi-red"><div class="v93-l">💵 التكلفة</div><div class="v93-v">' + cost.toLocaleString('ar-EG') + '</div></div>' +
        '<div class="v93-card-kpi v93-kpi-purple"><div class="v93-l">📦 طلبات</div><div class="v93-v">' + mOrd.length + '</div></div>' +
      '</div>' +
      '<div class="v93-row" style="text-align:center;padding:24px !important;">' +
        '<div style="font-size:12px;color:' + col + ';font-weight:800;margin-bottom:8px;">' + (net >= 0 ? '✅ صافي الربح' : '❌ خسارة') + '</div>' +
        '<div style="font-size:32px;font-weight:900;color:' + col + ';">' + Math.abs(net).toLocaleString('ar-EG') + ' ر.س</div>' +
      '</div>';
    }
    
    console.log('[v93] ✅ INSTALLED CLEAN');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(start, 1500); });
  } else {
    setTimeout(start, 1500);
  }
  setTimeout(start, 4000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v93 clean rebuild');
console.log('Size:', before, '->', h.length);
