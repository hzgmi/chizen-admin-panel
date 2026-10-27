const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-direct-click-v83')) { console.log('already'); process.exit(0); }

const js = `
<script id="chz-direct-click-v83">
(function(){
  'use strict';
  
  console.log('[v83] loaded, waiting for DOM...');
  
  // ═══ Direct click interception (capture phase) ═══
  function attachClickListener() {
    if (document.body._v83Attached) return;
    document.body._v83Attached = true;
    
    document.body.addEventListener('click', function(e) {
      var btn = e.target.closest('[onclick]');
      if (!btn) return;
      var onclick = btn.getAttribute('onclick') || '';
      
      console.log('[v83] click detected:', onclick.substring(0, 60));
      
      if (onclick.indexOf("'team'") > -1 || onclick.indexOf('"team"') > -1) {
        console.log('[v83] → TEAM tab clicked, forcing render in 100ms');
        setTimeout(function(){ window.__v83RenderTeam(); }, 100);
      }
      if (onclick.indexOf("'more'") > -1 || onclick.indexOf('"more"') > -1) {
        console.log('[v83] → MORE tab clicked, forcing render in 100ms');
        setTimeout(function(){ window.__v83RenderMore(); }, 100);
      }
    }, true);
    
    console.log('[v83] click listener attached');
  }
  
  // ═══ Render More ═══
  window.__v83RenderMore = function() {
    console.log('[v83] renderMore start');
    var container = document.getElementById('more-grid');
    if (!container) {
      console.error('[v83] more-grid NOT FOUND — attempting recovery');
      // Try to find sc-more and add more-grid
      var scMore = document.getElementById('sc-more');
      if (scMore && !document.getElementById('more-grid')) {
        var div = document.createElement('div');
        div.className = 'more-grid';
        div.id = 'more-grid';
        scMore.appendChild(div);
        container = div;
        console.log('[v83] more-grid created inside sc-more');
      }
      if (!container) {
        console.error('[v83] RECOVERY FAILED');
        return;
      }
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
    console.log('[v83] renderMore ✓ ' + items.length + ' tiles injected');
  };
  
  // ═══ Render Team ═══
  window.__v83RenderTeam = async function() {
    console.log('[v83] renderTeam start');
    var container = document.getElementById('team-content');
    if (!container) {
      console.error('[v83] team-content NOT FOUND — attempting recovery');
      var scTeam = document.getElementById('sc-team');
      if (scTeam && !document.getElementById('team-content')) {
        var div = document.createElement('div');
        div.id = 'team-content';
        scTeam.appendChild(div);
        container = div;
        console.log('[v83] team-content created inside sc-team');
      }
      if (!container) {
        console.error('[v83] RECOVERY FAILED');
        return;
      }
    }
    
    // Show loading immediately
    container.innerHTML = '<div style="padding:40px;text-align:center;color:#9ca3af;font-family:Tajawal,sans-serif;">' +
      '<div style="width:24px;height:24px;border:3px solid rgba(168,85,247,0.3);border-top-color:#a855f7;border-radius:50%;animation:dash-spin 0.8s linear infinite;display:inline-block;margin-bottom:12px;"></div>' +
      '<div>جاري تحميل الفريق...</div>' +
    '</div>';
    
    // Check Firebase
    if (!window.FB || !FB.db) {
      console.log('[v83] FB not ready, retrying in 1s');
      setTimeout(window.__v83RenderTeam, 1000);
      return;
    }
    
    try {
      console.log('[v83] Fetching employees + pending orders...');
      var nowSec = Math.floor(Date.now() / 1000);
      
      var [employeesSnap, pendingOrdersSnap] = await Promise.all([
        FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(30).get().catch(function(e){ console.warn('[v83] employees err:', e.message); return { docs: [] }; }),
        FB.db.collection('orders').where('workflowStatus', '==', 'awaiting_categories').limit(50).get().catch(function(e){ console.warn('[v83] orders err:', e.message); return { docs: [] }; })
      ]);
      
      console.log('[v83] employees found:', employeesSnap.docs.length, '| pending orders:', pendingOrdersSnap.docs.length);
      
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
        '<button class="team-tab active" onclick="window.__v83SwitchTeam(\\'cats\\',this)">📦 الأقسام</button>' +
        '<button class="team-tab" onclick="window.__v83SwitchTeam(\\'employees\\',this)">👤 الموظفون</button>' +
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
      console.log('[v83] renderTeam ✓ DONE');
      
    } catch(e) {
      console.error('[v83] renderTeam FATAL:', e);
      container.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;font-family:Tajawal,sans-serif;">' +
        '<div style="font-size:32px;margin-bottom:12px;">⚠️</div>' +
        '<div style="font-weight:900;margin-bottom:8px;">تعذر التحميل</div>' +
        '<div style="font-size:11px;color:#9ca3af;">' + (e.message || 'خطأ غير معروف') + '</div>' +
      '</div>';
    }
  };
  
  // ═══ Switch team tab ═══
  window.__v83SwitchTeam = function(view, btn) {
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
  
  // ═══ Init ═══
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(attachClickListener, 500); });
  } else {
    setTimeout(attachClickListener, 500);
  }
  setTimeout(attachClickListener, 2000);
  
  console.log('[v83] setup complete');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);

fs.writeFileSync(p, h);
console.log('✅ v83 direct click + logging added');
console.log('size:', before, '->', h.length);
