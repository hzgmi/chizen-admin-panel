const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-force-render-v82')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-force-render-v82">
(function(){
  'use strict';
  
  // Bulletproof: watch for tab switches via DOM mutation
  function setupObserver() {
    var screens = document.getElementById('screens');
    if (!screens) { setTimeout(setupObserver, 300); return; }
    
    // Watch for class changes on all .sc elements
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.type !== 'attributes' || m.attributeName !== 'class') return;
        var el = m.target;
        if (!el.classList.contains('active')) return;
        
        // Tab became active — force render
        if (el.id === 'sc-more') {
          console.log('[v82] sc-more active → rendering');
          setTimeout(function(){ forceRenderMore(); }, 50);
        }
        if (el.id === 'sc-team') {
          console.log('[v82] sc-team active → rendering');
          setTimeout(function(){ forceRenderTeam(); }, 50);
        }
      });
    });
    
    document.querySelectorAll('.sc').forEach(function(sc) {
      observer.observe(sc, { attributes: true, attributeFilter: ['class'] });
    });
    
    // Also observe future .sc additions
    var screensObserver = new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.classList && node.classList.contains('sc')) {
            observer.observe(node, { attributes: true, attributeFilter: ['class'] });
          }
        });
      });
    });
    screensObserver.observe(screens, { childList: true });
    
    console.log('[v82] observer setup done, watching ' + document.querySelectorAll('.sc').length + ' screens');
  }
  
  // ─── Force renderMore ───
  function forceRenderMore() {
    var container = document.getElementById('more-grid');
    if (!container) {
      console.error('[v82] more-grid NOT FOUND');
      return;
    }
    
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
    
    var html = '';
    items.forEach(function(item) {
      html += '<div class="more-tile" onclick="A.tab(\\'' + item.tab + '\\',null)">' +
        '<div class="more-tile-icon">' + item.icon + '</div>' +
        '<div class="more-tile-label">' + item.label + '</div>' +
      '</div>';
    });
    
    container.innerHTML = html;
    console.log('[v82] renderMore ✓ ' + items.length + ' tiles');
  }
  
  // ─── Force renderTeam ───
  async function forceRenderTeam() {
    var container = document.getElementById('team-content');
    if (!container) {
      console.error('[v82] team-content NOT FOUND');
      return;
    }
    
    if (!window.FB || !FB.db) {
      container.innerHTML = '<div class="dash-loading">⚠️ Firebase غير جاهز</div>';
      setTimeout(forceRenderTeam, 1000);
      return;
    }
    
    container.innerHTML = '<div class="dash-loading"><div class="dash-loading-spinner"></div><div>جاري تحميل الفريق...</div></div>';
    
    try {
      var nowSec = Math.floor(Date.now() / 1000);
      
      var [employeesSnap, pendingOrdersSnap] = await Promise.all([
        FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(30).get().catch(function(){ return { docs: [] }; }),
        FB.db.collection('orders').where('workflowStatus', '==', 'awaiting_categories').limit(50).get().catch(function(){ return { docs: [] }; })
      ]);
      
      var employees = [];
      employeesSnap.docs.forEach(function(d){
        var u = d.data();
        u._id = d.id;
        employees.push(u);
      });
      
      var pendingOrders = [];
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
      console.log('[v82] renderTeam ✓ ' + employees.length + ' employees, ' + pendingOrders.length + ' pending');
      
    } catch(e) {
      console.error('[v82] renderTeam error:', e);
      container.innerHTML = '<div class="dash-loading">⚠️ تعذر التحميل: ' + (e.message || '') + '</div>';
    }
  }
  
  // ─── Ensure _teamView ───
  window.A = window.A || {};
  if (typeof window.A._teamView !== 'function') {
    window.A._teamView = function(view, btn){
      document.querySelectorAll('.team-tab').forEach(function(t){ t.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      var cats = document.getElementById('team-view-cats');
      var emp = document.getElementById('team-view-employees');
      if (view === 'cats') {
        if (cats) cats.style.display = 'block';
        if (emp) emp.style.display = 'none';
      } else {
        if (cats) cats.style.display = 'none';
        if (emp) emp.style.display = 'block';
      }
    };
  }
  
  // ─── Init ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(setupObserver, 1000); });
  } else {
    setTimeout(setupObserver, 1000);
  }
  setTimeout(setupObserver, 3000);
  
  // ─── Fallback: check every 500ms for empty grids ───
  setInterval(function() {
    var moreGrid = document.getElementById('more-grid');
    var scMore = document.getElementById('sc-more');
    if (moreGrid && scMore && scMore.classList.contains('active') && !moreGrid.innerHTML.trim()) {
      console.log('[v82] fallback: more-grid empty → rendering');
      forceRenderMore();
    }
  }, 800);
  
  console.log('[v82] force-render script loaded');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);

fs.writeFileSync(p, h);
console.log('✅ v82 force-render added');
console.log('size:', before, '->', h.length);
