const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-fix-v81')) { console.log('already'); process.exit(0); }

// Add JS injection at end of body — bulletproof
const js = `
<script id="chz-fix-v81">
(function(){
  'use strict';
  
  function ensureScreens() {
    var screens = document.getElementById('screens');
    if (!screens) { setTimeout(ensureScreens, 300); return; }
    
    // ─── sc-team ───
    if (!document.getElementById('sc-team')) {
      var t = document.createElement('div');
      t.className = 'sc';
      t.id = 'sc-team';
      t.innerHTML = '<div class="ib">👥 الفريق والأقسام — مراقبة بصرية</div><div id="team-content"></div>';
      screens.appendChild(t);
      console.log('[v81] sc-team created');
    }
    
    // ─── sc-more ───
    if (!document.getElementById('sc-more')) {
      var m = document.createElement('div');
      m.className = 'sc';
      m.id = 'sc-more';
      m.innerHTML = '<div class="ib">➕ كل الأدوات</div><div class="more-grid" id="more-grid"></div>';
      screens.appendChild(m);
      console.log('[v81] sc-more created');
    }
    
    // ─── Ensure renderMore exists ───
    if (!window.A) window.A = {};
    if (typeof window.A.renderMore !== 'function') {
      window.A.renderMore = function() {
        var container = document.getElementById('more-grid');
        if (!container) return;
        var items = [
          { icon: '📦', label: 'المنتجات', tab: 'products' },
          { icon: '🏪', label: 'حراج شيزن', tab: 'haraj' },
          { icon: '✈️', label: 'الحجوزات', tab: 'flights' },
          { icon: '🚚', label: 'مندوب الطلبات', tab: 'dispatcher' },
          { icon: '👤', label: 'الموظفين', tab: 'employees' },
          { icon: '👥', label: 'المستخدمين', tab: 'users' },
          { icon: '💰', label: 'المالية', tab: 'reports' },
          { icon: '💳', label: 'طرق الدفع', tab: 'pays' },
          { icon: '🏷️', label: 'الماركات', tab: 'brands' },
          { icon: '🗂️', label: 'الأقسام', tab: 'cats' },
          { icon: '🖼️', label: 'البانرات', tab: 'banners' },
          { icon: '🏢', label: 'الموردين', tab: 'sups' },
          { icon: '💸', label: 'الديون', tab: 'balances' },
          { icon: '📍', label: 'التوصيل', tab: 'delivery' },
          { icon: '📍', label: 'مواقع التسليم', tab: 'pickup' },
          { icon: '🔑', label: 'المسؤولين', tab: 'admins' },
          { icon: '🔔', label: 'الإشعارات', tab: 'push' },
          { icon: '⚙️', label: 'الإعدادات', tab: 'settings' }
        ];
        container.innerHTML = items.map(function(item){
          return '<div class="more-tile" onclick="A.tab(\\'' + item.tab + '\\',null)">' +
            '<div class="more-tile-icon">' + item.icon + '</div>' +
            '<div class="more-tile-label">' + item.label + '</div>' +
          '</div>';
        }).join('');
        console.log('[v81] renderMore OK — ' + items.length + ' tiles');
      };
      console.log('[v81] renderMore defined');
    }
    
    // ─── Ensure renderTeam exists ───
    if (typeof window.A.renderTeam !== 'function') {
      window.A.renderTeam = async function() {
        var container = document.getElementById('team-content');
        if (!container) return;
        
        container.innerHTML = '<div class="dash-loading"><div class="dash-loading-spinner"></div><div>جاري التحميل...</div></div>';
        
        try {
          var employeesSnap = await FB.db.collection('users')
            .where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr'])
            .limit(30).get().catch(function(){ return { docs: [] }; });
          
          var employees = [];
          employeesSnap.docs.forEach(function(d){
            var u = d.data();
            u._id = d.id;
            employees.push(u);
          });
          
          var pendingOrdersSnap = await FB.db.collection('orders')
            .where('workflowStatus', '==', 'awaiting_categories')
            .limit(50).get().catch(function(){ return { docs: [] }; });
          
          var pendingOrders = [];
          var nowSec = Math.floor(Date.now() / 1000);
          pendingOrdersSnap.docs.forEach(function(d){
            var o = d.data();
            o.id = d.id;
            o._ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
            pendingOrders.push(o);
          });
          
          var catNames = {
            electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
            sports: 'أدوات رياضية', beauty: 'جمال وعطور', kids: 'مستلزمات أطفال',
            tools: 'أدوات منزلية', home: 'منزل وأثاث'
          };
          
          var catManagers = {};
          employees.forEach(function(e){
            if (e.role === 'cat_manager' && e.assignedCategory) {
              catManagers[e.assignedCategory] = e;
            }
          });
          
          var catPending = {};
          pendingOrders.forEach(function(o){
            var cats = Object.keys(o.categories || o.categoryStatus || {});
            var hoursOld = (nowSec - o._ts) / 3600;
            cats.forEach(function(c){
              if (!catPending[c]) catPending[c] = { count: 0, oldest: 0 };
              catPending[c].count++;
              catPending[c].oldest = Math.max(catPending[c].oldest, hoursOld);
            });
          });
          
          var html = '<div class="team-tabs">' +
            '<button class="team-tab active" onclick="A._teamView(\\'cats\\',this)">📦 الأقسام</button>' +
            '<button class="team-tab" onclick="A._teamView(\\'employees\\',this)">👤 الموظفون</button>' +
          '</div>';
          
          html += '<div id="team-view-cats">';
          Object.keys(catNames).forEach(function(k){
            var mgr = catManagers[k];
            var pending = catPending[k] || { count: 0, oldest: 0 };
            var status = 'green';
            var reason = '';
            
            if (!mgr) {
              status = 'red';
              reason = 'لا يوجد مدير قسم';
            } else if (pending.count > 0 && pending.oldest > 24) {
              status = 'red';
              reason = pending.count + ' طلب معلق منذ ' + Math.floor(pending.oldest/24) + ' يوم';
            } else if (pending.count > 0) {
              status = 'yellow';
              reason = pending.count + ' طلب معلق (' + Math.floor(pending.oldest) + ' ساعة)';
            }
            
            var cardClass = 'team-card' + (status === 'red' ? ' danger' : (status === 'yellow' ? ' warning' : ''));
            
            html += '<div class="' + cardClass + '">' +
              '<div class="team-card-icon">📦</div>' +
              '<div class="team-card-body">' +
                '<div class="team-card-title"><div class="status-dot ' + status + '"></div>' + catNames[k] + '</div>' +
                '<div class="team-card-meta">👤 <strong>' + (mgr ? (mgr.name || mgr.email || '—') : 'بدون مدير') + '</strong></div>' +
                (reason ? '<div class="team-card-warn ' + (status === 'red' ? 'danger' : '') + '">⚠️ ' + reason + '</div>' : '') +
              '</div>' +
            '</div>';
          });
          html += '</div>';
          
          html += '<div id="team-view-employees" style="display:none;">';
          if (employees.length === 0) {
            html += '<div class="team-card"><div class="team-card-body"><div class="team-card-title">لا يوجد موظفون</div><div class="team-card-meta">أضف موظفين من "المزيد" → الموظفين</div></div></div>';
          } else {
            var roleLabels = { cat_manager: 'مدير قسم', delivery_mgr: 'مندوب طلبات', accountant: 'محاسب', bookings_mgr: 'مدير حجوزات' };
            employees.forEach(function(e){
              html += '<div class="team-card">' +
                '<div class="team-card-icon">👤</div>' +
                '<div class="team-card-body">' +
                  '<div class="team-card-title"><div class="status-dot green"></div>' + (e.name || e.email || '—') + '</div>' +
                  '<div class="team-card-meta">🎯 ' + (roleLabels[e.role] || e.role) + (e.assignedCategory ? ' · ' + (catNames[e.assignedCategory] || e.assignedCategory) : '') + '</div>' +
                '</div>' +
              '</div>';
            });
          }
          html += '</div>';
          
          container.innerHTML = html;
          console.log('[v81] renderTeam OK — ' + employees.length + ' employees');
          
        } catch(e) {
          console.error('[v81] renderTeam error:', e);
          container.innerHTML = '<div class="dash-loading">⚠️ تعذر التحميل: ' + (e.message || '') + '</div>';
        }
      };
      console.log('[v81] renderTeam defined');
    }
    
    // ─── Ensure _teamView exists ───
    if (typeof window.A._teamView !== 'function') {
      window.A._teamView = function(view, btn){
        document.querySelectorAll('.team-tab').forEach(function(t){ t.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        var catsView = document.getElementById('team-view-cats');
        var empView = document.getElementById('team-view-employees');
        if (view === 'cats') {
          if (catsView) catsView.style.display = 'block';
          if (empView) empView.style.display = 'none';
        } else {
          if (catsView) catsView.style.display = 'none';
          if (empView) empView.style.display = 'block';
        }
      };
    }
    
    // ─── Patch A.tab to include team/more ───
    if (window.A && window.A.tab && !window.A.tab._v81Patched) {
      var origTab = window.A.tab;
      window.A.tab = function(n, el) {
        origTab.call(this, n, el);
        // Extra: if team/more and no render happened, force it
        if (n === 'team' && typeof this.renderTeam === 'function') {
          try { this.renderTeam(); } catch(e){ console.warn('[v81] tab team:', e.message); }
        }
        if (n === 'more' && typeof this.renderMore === 'function') {
          try { this.renderMore(); } catch(e){ console.warn('[v81] tab more:', e.message); }
        }
      };
      window.A.tab._v81Patched = true;
      console.log('[v81] A.tab patched');
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(ensureScreens, 1500); });
  } else {
    setTimeout(ensureScreens, 1500);
  }
  setTimeout(ensureScreens, 3500);
  
  console.log('[v81] fix script loaded');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);

fs.writeFileSync(p, h);
console.log('✅ v81 bulletproof fix added');
console.log('size:', before, '->', h.length, '(', h.length - before, ')');
