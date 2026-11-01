const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('// ═══ RENDER v80 LIGHT')) { console.log('already'); process.exit(0); }

// ═══ 1) Replace renderDash with optimized version ═══
const oldStart = h.indexOf('  // ═══════════════════════════════════════════════════\n  // DASHBOARD v2');
const oldEnd = h.indexOf('  // ═══════════════════════════════════════════════════\n  // TEAM');
if (oldStart === -1 || oldEnd === -1) { console.log('❌ dashboard bounds not found', oldStart, oldEnd); process.exit(1); }

const newDash = `  // ═══════════════════════════════════════════════════
  // ═══ RENDER v80 LIGHT — Optimized for slow networks ═══
  // ═══════════════════════════════════════════════════

  _dashCache: null,
  
  renderDash: async function() {
    var container = document.getElementById('dash-v2');
    if (!container) return;
    
    var self = this;
    var CACHE_KEY = 'chizen_dash_cache_v80';
    var CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // ─── STEP 1: Show cache immediately if exists ───
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed.html) {
          container.innerHTML = parsed.html;
          console.log('[dash v80] cache shown (' + Math.round((Date.now()-parsed.ts)/1000) + 's ago)');
          
          // If fresh enough, skip fetch
          if (Date.now() - parsed.ts < CACHE_TTL) {
            console.log('[dash v80] cache fresh — skip fetch');
            return;
          }
        }
      } else {
        container.innerHTML = '<div class="dash-loading"><div class="dash-loading-spinner"></div><div>جاري التحميل السريع...</div></div>';
      }
    } catch(e) {}
    
    try {
      var now = new Date();
      var nowSec = Math.floor(now.getTime() / 1000);
      var todayStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
      var monthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
      var twelveHoursAgo = nowSec - (12 * 3600);
      var sixHoursAgo = nowSec - (6 * 3600);
      var twoHoursAgo = nowSec - (2 * 3600);
      var dayAgo = nowSec - (24 * 3600);
      
      // ═══ STEP 2: Fire 5 COUNT queries in parallel (tiny payloads) ═══
      var counts = await Promise.all([
        // Orders today count
        FB.db.collection('orders').where('createdAt', '>=', new Date(todayStart * 1000)).count().get().catch(function(){ return { data: function(){ return { count: 0 }; } }; }),
        // Bookings today count
        FB.db.collection('bookings').where('createdAt', '>=', new Date(todayStart * 1000)).count().get().catch(function(){ return { data: function(){ return { count: 0 }; } }; }),
        // Active listings count
        FB.db.collection('listings').where('status', '==', 'active').count().get().catch(function(){ return { data: function(){ return { count: 0 }; } }; }),
        // Pending payments count (old > 12h)
        FB.db.collection('orders').where('workflowStatus', '==', 'awaiting_verification').count().get().catch(function(){ return { data: function(){ return { count: 0 }; } }; }),
        // Pending bookings count
        FB.db.collection('bookings').where('status', '==', 'pending').count().get().catch(function(){ return { data: function(){ return { count: 0 }; } }; })
      ]);
      
      var ordersToday = counts[0].data().count || 0;
      var bookingsToday = counts[1].data().count || 0;
      var activeListings = counts[2].data().count || 0;
      var pendingPaymentsCount = counts[3].data().count || 0;
      var pendingBookingsCount = counts[4].data().count || 0;
      
      // ═══ STEP 3: Fetch ONLY recent data for alerts + activity (small limits) ═══
      var [recentOrdersSnap, recentBookingsSnap, recentListingsSnap, monthOrdersSnap, employeesSnap] = await Promise.all([
        // Only 20 recent orders (for alerts + activity)
        FB.db.collection('orders').orderBy('createdAt', 'desc').limit(20).get().catch(function(){ return { docs: [] }; }),
        // Only 10 recent bookings
        FB.db.collection('bookings').orderBy('createdAt', 'desc').limit(10).get().catch(function(){ return { docs: [] }; }),
        // Only 10 recent listings
        FB.db.collection('listings').orderBy('createdAt', 'desc').limit(10).get().catch(function(){ return { docs: [] }; }),
        // Orders this month (for revenue) — small limit
        FB.db.collection('orders').where('createdAt', '>=', new Date(monthStart * 1000)).limit(100).get().catch(function(){ return { docs: [] }; }),
        // Employees for team health
        FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(20).get().catch(function(){ return { docs: [] }; })
      ]);
      
      // Parse
      var recentOrders = [];
      recentOrdersSnap.docs.forEach(function(d) {
        var o = d.data();
        o.id = d.id;
        o._ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
        recentOrders.push(o);
      });
      
      var recentBookings = [];
      recentBookingsSnap.docs.forEach(function(d) {
        var b = d.data();
        b.id = d.id;
        b._ts = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        recentBookings.push(b);
      });
      
      var recentListings = [];
      recentListingsSnap.docs.forEach(function(d) {
        var l = d.data();
        l.id = d.id;
        l._ts = l.createdAt && l.createdAt.seconds ? l.createdAt.seconds : 0;
        recentListings.push(l);
      });
      
      var monthOrders = [];
      monthOrdersSnap.docs.forEach(function(d) {
        var o = d.data();
        if (o.status !== 'cancelled') {
          monthOrders.push(Number(o.total) || 0);
        }
      });
      
      var employees = [];
      employeesSnap.docs.forEach(function(d) {
        var u = d.data();
        u._id = d.id;
        employees.push(u);
      });
      
      var monthRevenue = monthOrders.reduce(function(s, v) { return s + v; }, 0);
      
      // ═══ STEP 4: Build Alerts ═══
      var alerts = [];
      
      // Alert 1: pending payments (count > 0, check age on recent orders)
      if (pendingPaymentsCount > 0) {
        var oldPayments = recentOrders.filter(function(o) {
          return o.workflowStatus === 'awaiting_verification' && o._ts < twelveHoursAgo;
        });
        if (oldPayments.length > 0 || pendingPaymentsCount > 0) {
          alerts.push({
            icon: '💳',
            title: pendingPaymentsCount + ' دفع بانتظار مراجعة',
            sub: 'راجع الدفعات الواردة',
            action: 'orders'
          });
        }
      }
      
      // Alert 2: pending bookings
      if (pendingBookingsCount > 0) {
        alerts.push({
          icon: '✈️',
          title: pendingBookingsCount + ' حجز ينتظر رد السعر',
          sub: 'الرد السريع يزيد فرص القبول',
          action: 'flights'
        });
      }
      
      // Alert 3: ready to send without driver
      var awaitingDriver = recentOrders.filter(function(o) {
        return o.workflowStatus === 'ready_to_send' && !o.deliveryInfo;
      });
      if (awaitingDriver.length > 0) {
        alerts.push({
          icon: '🚚',
          title: awaitingDriver.length + ' طلب جاهز بدون سائق',
          sub: 'عيّن سائق للتوصيل',
          action: 'dispatcher'
        });
      }
      
      // Alert 4: pending categories
      var pendingCats = recentOrders.filter(function(o) {
        return o.workflowStatus === 'awaiting_categories' && o._ts < dayAgo;
      });
      if (pendingCats.length > 0) {
        alerts.push({
          icon: '📦',
          title: pendingCats.length + ' طلب لم يجهزه القسم',
          sub: 'راجع الأقسام',
          action: 'team'
        });
      }
      
      // ═══ STEP 5: Team Health ═══
      var catNames = {
        electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
        sports: 'أدوات رياضية', beauty: 'جمال وعطور', kids: 'مستلزمات أطفال',
        tools: 'أدوات منزلية', home: 'منزل وأثاث'
      };
      
      var catManagers = {};
      employees.forEach(function(e) {
        if (e.role === 'cat_manager' && e.assignedCategory) {
          catManagers[e.assignedCategory] = e;
        }
      });
      
      var teamStats = { green: 0, yellow: 0, red: 0, items: [] };
      
      Object.keys(catNames).forEach(function(k) {
        var mgr = catManagers[k];
        var status = mgr ? 'green' : 'red';
        var reason = mgr ? '' : 'بدون مدير';
        
        if (status === 'green') teamStats.green++;
        else teamStats.red++;
        
        teamStats.items.push({
          name: catNames[k],
          manager: mgr ? (mgr.name || mgr.email || '—') : '—',
          status: status,
          reason: reason
        });
      });
      
      // ═══ STEP 6: Activity ═══
      var activity = [];
      recentOrders.slice(0, 3).forEach(function(o) {
        var status = o.workflowStatus || o.status || '';
        var action = {
          'awaiting_verification': 'طلب جديد',
          'awaiting_categories': 'تم تأكيد دفع',
          'ready_to_send': 'جاهز للشحن',
          'sent_to_customer': 'تم تعيين سائق',
          'delivered': 'تم التسليم'
        }[status] || 'تحديث طلب';
        activity.push({ ts: o._ts, icon: '🛒', text: action + ' #' + (o.orderNumber || o.id.substring(0, 6)) });
      });
      
      recentBookings.slice(0, 2).forEach(function(b) {
        var action = { 'pending': 'حجز جديد', 'confirmed': 'تأكيد حجز', 'completed': 'إتمام حجز', 'cancelled': 'إلغاء حجز' }[b.status] || 'تحديث حجز';
        activity.push({ ts: b._ts, icon: '✈️', text: action });
      });
      
      recentListings.slice(0, 2).forEach(function(l) {
        activity.push({ ts: l._ts, icon: '🏪', text: 'إعلان: ' + (l.title || '').substring(0, 30) });
      });
      
      activity.sort(function(a, b) { return b.ts - a.ts; });
      activity = activity.slice(0, 6);
      
      // ═══ STEP 7: Build HTML ═══
      var html = '';
      
      // Alerts
      if (alerts.length > 0) {
        html += '<div class="dash-alerts">' +
          '<div class="dash-alerts-title">⚠️ يحتاج تدخلك الآن (' + alerts.length + ')</div>';
        alerts.forEach(function(a) {
          html += '<div class="dash-alert" onclick="A.tab(\\'' + a.action + '\\',null)">' +
            '<div class="dash-alert-icon">' + a.icon + '</div>' +
            '<div class="dash-alert-body">' +
              '<div class="dash-alert-title">' + a.title + '</div>' +
              '<div class="dash-alert-sub">' + a.sub + '</div>' +
            '</div>' +
            '<div class="dash-alert-arrow">←</div>' +
          '</div>';
        });
        html += '</div>';
      } else {
        html += '<div class="dash-alerts" style="text-align:center;padding:20px;background:rgba(16,185,129,0.06);border:1.5px solid rgba(16,185,129,0.25);border-radius:12px;margin-bottom:16px;">' +
          '<div style="font-size:32px;margin-bottom:8px;">✨</div>' +
          '<div style="font-size:13px;font-weight:900;color:#10b981;">كل شيء تحت السيطرة</div>' +
          '<div style="font-size:11px;color:#9ca3af;margin-top:4px;">لا توجد تنبيهات حالياً</div>' +
        '</div>';
      }
      
      // KPIs
      html += '<div class="dash-kpis">' +
        '<div class="dash-kpi">' +
          '<div class="dash-kpi-icon">🛒</div>' +
          '<div class="dash-kpi-value">' + ordersToday + '</div>' +
          '<div class="dash-kpi-label">طلبات اليوم</div>' +
        '</div>' +
        '<div class="dash-kpi">' +
          '<div class="dash-kpi-icon">✈️</div>' +
          '<div class="dash-kpi-value">' + bookingsToday + '</div>' +
          '<div class="dash-kpi-label">حجوزات اليوم</div>' +
        '</div>' +
        '<div class="dash-kpi">' +
          '<div class="dash-kpi-icon">🏪</div>' +
          '<div class="dash-kpi-value">' + activeListings + '</div>' +
          '<div class="dash-kpi-label">إعلان حراج</div>' +
        '</div>' +
        '<div class="dash-kpi">' +
          '<div class="dash-kpi-icon">💰</div>' +
          '<div class="dash-kpi-value">' + (monthRevenue >= 1000 ? Math.round(monthRevenue/1000) + 'K' : monthRevenue) + '</div>' +
          '<div class="dash-kpi-label">مبيعات الشهر</div>' +
        '</div>' +
      '</div>';
      
      // Team health
      var teamColorClass = teamStats.red > 0 ? 'red' : (teamStats.yellow > 0 ? 'yellow' : 'green');
      html += '<div class="dash-team">' +
        '<div class="dash-team-title">' +
          '<span>👥 حالة الفريق</span>' +
          '<button onclick="A.tab(\\'team\\',null)">التفاصيل ←</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;font-size:12px;font-weight:800;color:#e5e7eb;">' +
          '<div class="dash-team-dot ' + teamColorClass + '"></div>' +
          '<span>' + teamStats.green + ' قسم نشط</span>' +
          (teamStats.red > 0 ? ' · <span style="color:#fca5a5;">' + teamStats.red + ' مشكلة</span>' : '') +
        '</div>';
      
      var problems = teamStats.items.filter(function(t) { return t.status !== 'green'; });
      if (problems.length > 0) {
        problems.slice(0, 3).forEach(function(t) {
          html += '<div class="dash-team-row">' +
            '<div class="dash-team-dot ' + t.status + '"></div>' +
            '<div class="dash-team-name">' + t.name + '</div>' +
            '<div class="dash-team-count">' + (t.reason || '—') + '</div>' +
          '</div>';
        });
      }
      html += '</div>';
      
      // Activity
      if (activity.length > 0) {
        html += '<div class="dash-activity">' +
          '<div class="dash-activity-title">📊 آخر الأنشطة</div>';
        activity.forEach(function(a) {
          var time = a.ts ? new Date(a.ts * 1000) : new Date();
          var timeStr = String(time.getHours()).padStart(2,'0') + ':' + String(time.getMinutes()).padStart(2,'0');
          html += '<div class="dash-activity-item">' +
            '<div class="dash-activity-time">' + timeStr + '</div>' +
            '<div class="dash-activity-text">' + a.icon + ' ' + a.text + '</div>' +
          '</div>';
        });
        html += '</div>';
      }
      
      container.innerHTML = html;
      
      // ─── Save to cache ───
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ html: html, ts: Date.now() }));
      } catch(e) {}
      
      console.log('[dash v80] fresh data loaded & cached');
      
    } catch(e) {
      console.error('[dashboard v80]', e);
      container.innerHTML = '<div class="dash-loading"><div style="color:#f87171;font-size:32px;margin-bottom:12px;">⚠️</div><div>تعذر تحميل البيانات</div><div style="font-size:10px;color:#6b7280;margin-top:8px;">' + (e.message || '') + '</div></div>';
    }
  };
  
  // ═══ Refresh button (manual) ═══
  A.clearDashCache = function() {
    try { localStorage.removeItem('chizen_dash_cache_v80'); } catch(e) {}
    this.renderDash();
  };

`;

h = h.slice(0, oldStart) + newDash + h.slice(oldEnd);

// ═══ 2) Optimize Team with cache ═══
const teamStart = h.indexOf('  renderTeam: async function() {');
if (teamStart !== -1) {
  const teamEnd = h.indexOf('  A._teamView = function(view, btn) {', teamStart);
  if (teamEnd > -1) {
    const newTeam = `  renderTeam: async function() {
    var container = document.getElementById('team-content');
    if (!container) return;
    
    var CACHE_KEY = 'chizen_team_cache_v80';
    var CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    
    // Cache first
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed.html && Date.now() - parsed.ts < CACHE_TTL) {
          container.innerHTML = parsed.html;
          console.log('[team v80] cache fresh');
          return;
        }
        if (parsed.html) container.innerHTML = parsed.html;
      }
    } catch(e) {}
    
    if (!container.innerHTML || container.innerHTML.indexOf('dash-loading') > -1) {
      container.innerHTML = '<div class="dash-loading"><div class="dash-loading-spinner"></div></div>';
    }
    
    try {
      var [employeesSnap, pendingOrdersSnap] = await Promise.all([
        FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(30).get().catch(function(){ return { docs: [] }; }),
        // Only pending orders, small limit
        FB.db.collection('orders').where('workflowStatus', '==', 'awaiting_categories').limit(50).get().catch(function(){ return { docs: [] }; })
      ]);
      
      var employees = [];
      employeesSnap.docs.forEach(function(d) {
        var u = d.data();
        u._id = d.id;
        employees.push(u);
      });
      
      var pendingOrders = [];
      pendingOrdersSnap.docs.forEach(function(d) {
        var o = d.data();
        o.id = d.id;
        o._ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
        pendingOrders.push(o);
      });
      
      var now = Math.floor(Date.now() / 1000);
      var catNames = {
        electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
        sports: 'أدوات رياضية', beauty: 'جمال وعطور', kids: 'مستلزمات أطفال',
        tools: 'أدوات منزلية', home: 'منزل وأثاث'
      };
      
      var catManagers = {};
      employees.forEach(function(e) {
        if (e.role === 'cat_manager' && e.assignedCategory) {
          catManagers[e.assignedCategory] = e;
        }
      });
      
      // Count pending per category
      var catPending = {};
      pendingOrders.forEach(function(o) {
        var cats = Object.keys(o.categories || o.categoryStatus || {});
        var hoursOld = (now - o._ts) / 3600;
        cats.forEach(function(c) {
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
      Object.keys(catNames).forEach(function(k) {
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
        employees.forEach(function(e) {
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
      
      // Cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ html: html, ts: Date.now() }));
      } catch(e) {}
      
      console.log('[team v80] loaded & cached');
      
    } catch(e) {
      console.error('[team v80]', e);
      container.innerHTML = '<div class="dash-loading">⚠️ تعذر التحميل</div>';
    }
  };
  
`;
    h = h.slice(0, teamStart) + newTeam + h.slice(teamEnd);
    console.log('✅ renderTeam replaced');
  }
}

// ═══ 3) Remove login preflight (saves 5s) ═══
const preflightStart = h.indexOf('      // ═══ Stage 1: Preflight (fast connection check) ═══');
if (preflightStart > -1) {
  const preflightEnd = h.indexOf('      // ═══ Stage 2: Auth ═══', preflightStart);
  if (preflightEnd > preflightStart) {
    h = h.slice(0, preflightStart) + h.slice(preflightEnd);
    console.log('✅ preflight removed (saves 5s)');
  }
}

fs.writeFileSync(p, h);
console.log('✅ v80 light version installed');
console.log('size:', before, '->', h.length, '(', h.length - before, ')');
