const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('// ═══ RENDER v79')) { console.log('already'); process.exit(0); }

// Insert before closing of main script (last `</script>`)
const mainEnd = h.lastIndexOf('</script>');
if (mainEnd === -1) { console.log('❌ no script'); process.exit(1); }

const newJS = `

  // ═══ RENDER v79 — Dashboard / Team / More ═══
  
  // ═══════════════════════════════════════════════════
  // DASHBOARD v2
  // ═══════════════════════════════════════════════════
  renderDash: async function() {
    var container = document.getElementById('dash-v2');
    if (!container) return;
    
    container.innerHTML = '<div class="dash-loading"><div class="dash-loading-spinner"></div><div>جاري تحميل البيانات...</div></div>';
    
    try {
      var now = new Date();
      var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
      
      // Fetch all data in parallel
      var [ordersSnap, bookingsSnap, listingsSnap, usersSnap, employeesSnap] = await Promise.all([
        FB.db.collection('orders').orderBy('createdAt', 'desc').limit(200).get().catch(function(){ return { docs: [] }; }),
        FB.db.collection('bookings').orderBy('createdAt', 'desc').limit(200).get().catch(function(){ return { docs: [] }; }),
        FB.db.collection('listings').limit(300).get().catch(function(){ return { docs: [] }; }),
        FB.db.collection('users').limit(100).get().catch(function(){ return { docs: [] }; }),
        FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(50).get().catch(function(){ return { docs: [] }; })
      ]);
      
      // Parse arrays
      var orders = [];
      ordersSnap.docs.forEach(function(d) {
        var o = d.data();
        o.id = d.id;
        o._ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
        orders.push(o);
      });
      
      var bookings = [];
      bookingsSnap.docs.forEach(function(d) {
        var b = d.data();
        b.id = d.id;
        b._ts = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        bookings.push(b);
      });
      
      var listings = [];
      listingsSnap.docs.forEach(function(d) {
        var l = d.data();
        l.id = d.id;
        l._ts = l.createdAt && l.createdAt.seconds ? l.createdAt.seconds : 0;
        listings.push(l);
      });
      
      // ═══ Compute Alerts ═══
      var alerts = [];
      
      // 1. Payment awaiting verification > 12h
      var pendingPayments = orders.filter(function(o) {
        return (o.workflowStatus === 'awaiting_verification') && (now.getTime()/1000 - o._ts > 12*3600);
      });
      if (pendingPayments.length > 0) {
        alerts.push({
          icon: '💳',
          title: pendingPayments.length + ' دفع بانتظار مراجعة',
          sub: 'منذ أكثر من 12 ساعة — قد يؤثر على تجربة العميل',
          action: 'orders'
        });
      }
      
      // 2. Bookings awaiting price quote > 6h
      var pendingQuotes = bookings.filter(function(b) {
        return b.status === 'pending' && (now.getTime()/1000 - b._ts > 6*3600);
      });
      if (pendingQuotes.length > 0) {
        alerts.push({
          icon: '✈️',
          title: pendingQuotes.length + ' حجز ينتظر رد السعر',
          sub: 'العميل ينتظر — الرد السريع يزيد فرص القبول',
          action: 'flights'
        });
      }
      
      // 3. Ready to send orders without driver > 2h
      var awaitingDriver = orders.filter(function(o) {
        return o.workflowStatus === 'ready_to_send' && !o.deliveryInfo && (now.getTime()/1000 - o._ts > 2*3600);
      });
      if (awaitingDriver.length > 0) {
        alerts.push({
          icon: '🚚',
          title: awaitingDriver.length + ' طلب جاهز بدون سائق',
          sub: 'بحاجة لتعيين سائق للتوصيل',
          action: 'dispatcher'
        });
      }
      
      // 4. Categories with pending orders > 24h (if pending_categories workflow exists)
      var pendingCats = orders.filter(function(o) {
        return o.workflowStatus === 'awaiting_categories' && (now.getTime()/1000 - o._ts > 24*3600);
      });
      if (pendingCats.length > 0) {
        alerts.push({
          icon: '📦',
          title: pendingCats.length + ' طلب لم يجهزه القسم',
          sub: 'منذ أكثر من 24 ساعة — راجع الأقسام',
          action: 'team'
        });
      }
      
      // 5. Listings pending review > 24h
      var pendingListings = listings.filter(function(l) {
        return l.status === 'active' && !l.reviewedBy && (now.getTime()/1000 - l._ts > 24*3600);
      });
      if (pendingListings.length > 3) {
        alerts.push({
          icon: '🏪',
          title: pendingListings.length + ' إعلان حراج لم يُراجع',
          sub: 'راجع الإعلانات الجديدة',
          action: 'haraj'
        });
      }
      
      // ═══ KPIs ═══
      var ordersToday = orders.filter(function(o){ return o._ts >= todayStart; }).length;
      var bookingsToday = bookings.filter(function(b){ return b._ts >= todayStart; }).length;
      var activeListings = listings.filter(function(l){ return l.status === 'active'; }).length;
      var monthRevenue = orders
        .filter(function(o){ return o._ts >= monthStart && o.status !== 'cancelled'; })
        .reduce(function(sum, o){ return sum + (Number(o.total) || 0); }, 0);
      
      // ═══ Team Health ═══
      var teamStats = {
        green: 0,
        yellow: 0,
        red: 0,
        items: []
      };
      
      // Group by category for cat_managers
      var categoryIssues = {};
      orders.forEach(function(o) {
        if (o.status === 'cancelled') return;
        var cats = Object.keys(o.categories || o.categoryStatus || {});
        var wf = o.workflowStatus || '';
        if (wf === 'awaiting_categories') {
          var hoursOld = (now.getTime()/1000 - o._ts) / 3600;
          cats.forEach(function(cat) {
            if (!categoryIssues[cat]) categoryIssues[cat] = { count: 0, oldest: 0 };
            categoryIssues[cat].count++;
            categoryIssues[cat].oldest = Math.max(categoryIssues[cat].oldest, hoursOld);
          });
        }
      });
      
      // Cat managers
      var catManagers = {};
      employeesSnap.docs.forEach(function(d) {
        var u = d.data();
        if (u.role === 'cat_manager' && u.assignedCategory) {
          catManagers[u.assignedCategory] = u;
        }
      });
      
      // Build team rows
      var catNames = {
        electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
        sports: 'أدوات رياضية', beauty: 'جمال وعطور', kids: 'مستلزمات أطفال',
        tools: 'أدوات منزلية', home: 'منزل وأثاث'
      };
      
      Object.keys(catNames).forEach(function(catKey) {
        var mgr = catManagers[catKey];
        var issues = categoryIssues[catKey] || { count: 0, oldest: 0 };
        var status = 'green';
        var reason = '';
        
        if (!mgr) {
          status = 'red';
          reason = 'لا يوجد مدير قسم';
        } else if (issues.count > 0 && issues.oldest > 24) {
          status = 'red';
          reason = issues.count + ' طلب معلق منذ ' + Math.floor(issues.oldest/24) + ' يوم';
        } else if (issues.count > 0) {
          status = 'yellow';
          reason = issues.count + ' طلب معلق';
        }
        
        if (status === 'green') teamStats.green++;
        else if (status === 'yellow') teamStats.yellow++;
        else teamStats.red++;
        
        teamStats.items.push({
          key: catKey,
          name: catNames[catKey],
          manager: mgr ? (mgr.name || mgr.email || '—') : '—',
          status: status,
          reason: reason
        });
      });
      
      // ═══ Recent Activity ═══
      var activity = [];
      
      // Recent orders
      orders.slice(0, 3).forEach(function(o) {
        var status = o.workflowStatus || o.status || '';
        var action = {
          'awaiting_verification': 'طلب جديد',
          'awaiting_categories': 'تم تأكيد دفع',
          'ready_to_send': 'جاهز للشحن',
          'sent_to_customer': 'تم تعيين سائق',
          'delivered': 'تم التسليم'
        }[status] || 'تحديث طلب';
        
        activity.push({
          ts: o._ts,
          icon: '🛒',
          text: action + ' #' + (o.orderNumber || o.id.substring(0, 6))
        });
      });
      
      // Recent bookings
      bookings.slice(0, 2).forEach(function(b) {
        var action = {
          'pending': 'حجز جديد',
          'confirmed': 'تأكيد حجز',
          'completed': 'إتمام حجز',
          'cancelled': 'إلغاء حجز'
        }[b.status] || 'تحديث حجز';
        
        activity.push({
          ts: b._ts,
          icon: '✈️',
          text: action + ' — ' + (b.data && b.data.type ? b.data.type : '')
        });
      });
      
      // Recent listings
      listings.slice(0, 2).forEach(function(l) {
        activity.push({
          ts: l._ts,
          icon: '🏪',
          text: 'إعلان حراج: ' + (l.title || '').substring(0, 30)
        });
      });
      
      // Sort by time
      activity.sort(function(a, b) { return b.ts - a.ts; });
      activity = activity.slice(0, 6);
      
      // ═══ Build HTML ═══
      var html = '';
      
      // Alerts section (only if there are alerts)
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
          (teamStats.yellow > 0 ? ' · <span style="color:#fbbf24;">' + teamStats.yellow + ' يحتاج انتباه</span>' : '') +
          (teamStats.red > 0 ? ' · <span style="color:#fca5a5;">' + teamStats.red + ' مشكلة</span>' : '') +
        '</div>';
      
      // Show top 3 problem categories
      var problems = teamStats.items.filter(function(t) { return t.status !== 'green'; });
      if (problems.length > 0) {
        problems.slice(0, 3).forEach(function(t) {
          var dotClass = t.status === 'red' ? 'red' : 'yellow';
          html += '<div class="dash-team-row">' +
            '<div class="dash-team-dot ' + dotClass + '"></div>' +
            '<div class="dash-team-name">' + t.name + '</div>' +
            '<div class="dash-team-count">' + (t.reason || '—') + '</div>' +
          '</div>';
        });
      }
      html += '</div>';
      
      // Recent activity
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
      
    } catch(e) {
      console.error('[dashboard]', e);
      container.innerHTML = '<div class="dash-loading"><div style="color:#f87171;font-size:32px;margin-bottom:12px;">⚠️</div><div>تعذر تحميل البيانات</div><div style="font-size:10px;color:#6b7280;margin-top:8px;">' + (e.message || '') + '</div></div>';
    }
  };
  
  // ═══════════════════════════════════════════════════
  // TEAM
  // ═══════════════════════════════════════════════════
  renderTeam: async function() {
    var container = document.getElementById('team-content');
    if (!container) return;
    
    container.innerHTML = '<div class="dash-loading"><div class="dash-loading-spinner"></div></div>';
    
    try {
      var now = new Date();
      
      var [ordersSnap, employeesSnap] = await Promise.all([
        FB.db.collection('orders').orderBy('createdAt', 'desc').limit(200).get().catch(function(){ return { docs: [] }; }),
        FB.db.collection('users').where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr']).limit(50).get().catch(function(){ return { docs: [] }; })
      ]);
      
      var orders = [];
      ordersSnap.docs.forEach(function(d) {
        var o = d.data();
        o.id = d.id;
        o._ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
        orders.push(o);
      });
      
      var employees = [];
      employeesSnap.docs.forEach(function(d) {
        var u = d.data();
        u._id = d.id;
        employees.push(u);
      });
      
      // Build category stats
      var catStats = {};
      var catNames = {
        electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
        sports: 'أدوات رياضية', beauty: 'جمال وعطور', kids: 'مستلزمات أطفال',
        tools: 'أدوات منزلية', home: 'منزل وأثاث'
      };
      
      Object.keys(catNames).forEach(function(k) {
        catStats[k] = { total: 0, pending: 0, oldestPending: 0, manager: null };
      });
      
      // Scan orders
      orders.forEach(function(o) {
        if (o.status === 'cancelled') return;
        var cats = Object.keys(o.categories || o.categoryStatus || {});
        cats.forEach(function(cat) {
          if (!catStats[cat]) return;
          catStats[cat].total++;
          if (o.workflowStatus === 'awaiting_categories') {
            catStats[cat].pending++;
            var hoursOld = (now.getTime()/1000 - o._ts) / 3600;
            catStats[cat].oldestPending = Math.max(catStats[cat].oldestPending, hoursOld);
          }
        });
      });
      
      // Assign managers
      employees.forEach(function(emp) {
        if (emp.role === 'cat_manager' && emp.assignedCategory && catStats[emp.assignedCategory]) {
          catStats[emp.assignedCategory].manager = emp;
        }
      });
      
      // Build HTML
      var html = '';
      
      // Tabs
      html += '<div class="team-tabs">' +
        '<button class="team-tab active" data-view="cats" onclick="A._teamView(\\'cats\\',this)">📦 الأقسام</button>' +
        '<button class="team-tab" data-view="employees" onclick="A._teamView(\\'employees\\',this)">👤 الموظفون</button>' +
      '</div>';
      
      // Categories view
      html += '<div id="team-view-cats">';
      Object.keys(catNames).forEach(function(k) {
        var s = catStats[k];
        var status = 'green';
        var reason = '';
        
        if (!s.manager) {
          status = 'red';
          reason = 'لا يوجد مدير قسم — عيّن واحداً من "المزيد"';
        } else if (s.pending > 0 && s.oldestPending > 24) {
          status = 'red';
          reason = s.pending + ' طلب معلق منذ ' + Math.floor(s.oldestPending/24) + ' يوم';
        } else if (s.pending > 0) {
          status = 'yellow';
          reason = s.pending + ' طلب معلق (' + Math.floor(s.oldestPending) + ' ساعة)';
        }
        
        var cardClass = 'team-card' + (status === 'red' ? ' danger' : (status === 'yellow' ? ' warning' : ''));
        
        html += '<div class="' + cardClass + '">' +
          '<div class="team-card-icon">📦</div>' +
          '<div class="team-card-body">' +
            '<div class="team-card-title">' +
              '<div class="status-dot ' + status + '"></div>' +
              catNames[k] +
            '</div>' +
            '<div class="team-card-meta">' +
              '👤 <strong>' + (s.manager ? (s.manager.name || s.manager.email) : 'بدون مدير') + '</strong>' +
              ' · 📦 ' + s.total + ' طلب' +
            '</div>' +
            (reason ? '<div class="team-card-warn ' + (status === 'red' ? 'danger' : '') + '">⚠️ ' + reason + '</div>' : '') +
          '</div>' +
        '</div>';
      });
      html += '</div>';
      
      // Employees view
      html += '<div id="team-view-employees" style="display:none;">';
      if (employees.length === 0) {
        html += '<div class="team-card"><div class="team-card-body"><div class="team-card-title">لا يوجد موظفون</div><div class="team-card-meta">أضف موظفين من "المزيد" → الموظفين</div></div></div>';
      } else {
        var roleLabels = {
          cat_manager: 'مدير قسم',
          delivery_mgr: 'مندوب طلبات',
          accountant: 'محاسب',
          bookings_mgr: 'مدير حجوزات'
        };
        employees.forEach(function(emp) {
          var roleLbl = roleLabels[emp.role] || emp.role;
          html += '<div class="team-card">' +
            '<div class="team-card-icon">👤</div>' +
            '<div class="team-card-body">' +
              '<div class="team-card-title">' +
                '<div class="status-dot green"></div>' +
                (emp.name || emp.email || '—') +
              '</div>' +
              '<div class="team-card-meta">' +
                '🎯 ' + roleLbl +
                (emp.assignedCategory ? ' · ' + (catNames[emp.assignedCategory] || emp.assignedCategory) : '') +
              '</div>' +
            '</div>' +
          '</div>';
        });
      }
      html += '</div>';
      
      container.innerHTML = html;
      
    } catch(e) {
      console.error('[team]', e);
      container.innerHTML = '<div class="dash-loading">⚠️ تعذر التحميل</div>';
    }
  };
  
  A._teamView = function(view, btn) {
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
  
  // ═══════════════════════════════════════════════════
  // MORE
  // ═══════════════════════════════════════════════════
  renderMore: function() {
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
    
    var html = '';
    items.forEach(function(item) {
      html += '<div class="more-tile" onclick="A.tab(\\'' + item.tab + '\\',null)">' +
        '<div class="more-tile-icon">' + item.icon + '</div>' +
        '<div class="more-tile-label">' + item.label + '</div>' +
      '</div>';
    });
    
    container.innerHTML = html;
  };

`;

h = h.slice(0, mainEnd) + newJS + h.slice(mainEnd);

fs.writeFileSync(p, h);
console.log('✅ 3 render functions added');
console.log('size:', before, '->', h.length, '(', h.length - before, ')');
