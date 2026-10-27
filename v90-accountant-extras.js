const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-acct-v90')) { console.log('already'); process.exit(0); }

const js = `
<style id="chz-acct-v90-css">
.ca-extra-panel { padding: 14px; direction: rtl; font-family: 'Tajawal', sans-serif; }
.ca-kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
.ca-kpi { padding: 12px; border-radius: 12px; text-align: center; border: 1.5px solid; }
.ca-kpi-green { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.3); }
.ca-kpi-red { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3); }
.ca-kpi-purple { background: rgba(168,85,247,0.08); border-color: rgba(168,85,247,0.3); }
.ca-kpi-yellow { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.3); }
.ca-kpi-label { font-size: 10px; color: #9ca3af; font-weight: 700; margin-bottom: 4px; }
.ca-kpi-value { font-size: 16px; font-weight: 900; }
.ca-kpi-green .ca-kpi-value { color: #10b981; }
.ca-kpi-red .ca-kpi-value { color: #ef4444; }
.ca-kpi-purple .ca-kpi-value { color: #a855f7; }
.ca-kpi-yellow .ca-kpi-value { color: #f59e0b; }
.ca-card { padding: 14px; background: rgba(20,15,45,0.85); border: 1px solid rgba(168,85,247,0.15); border-radius: 12px; margin-bottom: 10px; }
.ca-card-title { font-size: 12px; font-weight: 900; color: #e5e7eb; margin-bottom: 4px; }
.ca-card-meta { font-size: 10.5px; color: #9ca3af; margin-bottom: 8px; }
.ca-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ca-btn { padding: 8px 14px; border-radius: 8px; border: none; font-family: inherit; font-size: 11px; font-weight: 800; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ca-btn:active { transform: scale(0.96); }
.ca-btn-primary { background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; }
.ca-btn-success { background: rgba(16,185,129,0.15); border: 1.5px solid #10b981; color: #10b981; }
.ca-btn-danger { background: rgba(239,68,68,0.15); border: 1.5px solid #ef4444; color: #ef4444; }
.ca-btn-ghost { background: rgba(168,85,247,0.08); border: 1.5px solid rgba(168,85,247,0.3); color: #c084fc; }
.ca-input { width: 100%; padding: 10px 12px; background: rgba(10,14,42,0.8); border: 1.5px solid rgba(168,85,247,0.2); border-radius: 8px; color: #e5e7eb; font-family: inherit; font-size: 12px; box-sizing: border-box; }
.ca-input:focus { outline: none; border-color: #a855f7; }
.ca-empty { padding: 30px; text-align: center; color: #6b7280; font-size: 12px; }
.ca-row { padding: 12px; background: rgba(20,15,45,0.85); border: 1px solid rgba(168,85,247,0.15); border-radius: 10px; margin-bottom: 8px; }
.ca-row-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px; }
.ca-row-title { font-size: 12px; font-weight: 800; color: #e5e7eb; }
.ca-row-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
.ca-badge { padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 800; }
.ca-badge-green { background: rgba(16,185,129,0.15); color: #10b981; }
.ca-badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }
.ca-badge-yellow { background: rgba(245,158,11,0.15); color: #f59e0b; }
.ca-badge-gray { background: rgba(107,114,128,0.15); color: #9ca3af; }
.ca-section-title { font-size: 13px; font-weight: 900; color: #f59e0b; margin: 16px 0 10px; display: flex; align-items: center; gap: 6px; }
.ca-tabs-inner { display: flex; gap: 6px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; }
.ca-tab-inner { flex-shrink: 0; padding: 7px 14px; border-radius: 10px; border: 1.5px solid rgba(168,85,247,0.2); background: rgba(168,85,247,0.06); color: #9ca3af; font-family: inherit; font-size: 11px; font-weight: 800; cursor: pointer; white-space: nowrap; }
.ca-tab-inner.active { background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; border-color: #a855f7; }
</style>

<script id="chz-acct-v90">
(function(){
  'use strict';
  console.log('[v90] accountant extras loading...');
  
  var _esc = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  
  window.CAExtras = {
    employees: [],
    transactions: [],
    rates: {},
    loaded: false,
    activeTab: 'all'
  };
  
  // ═══════════════════════════════════════════════
  // INIT FIRESTORE COLLECTIONS
  // ═══════════════════════════════════════════════
  async function ensureCollections() {
    if (!window.FB || !FB.db) return;
    try {
      // Ensure commission_rates exists
      var ratesDoc = await FB.db.collection('config').doc('commission_rates').get();
      if (!ratesDoc.exists) {
        await FB.db.collection('config').doc('commission_rates').set({
          list: [
            { role: 'cat_manager', pct: 10, label: 'مدير قسم — 10% من مبيعات قسمه' },
            { role: 'delivery_mgr', pct: 2, label: 'مندوب طلبات — 2% من كل توصيل' },
            { role: 'bookings_mgr', pct: 5, label: 'مدير حجوزات — 5% من قيمة الحجوزات' },
            { role: 'accountant', pct: 0, label: 'محاسب — راتب ثابت' }
          ]
        });
        console.log('[v90] commission_rates created with defaults');
      }
    } catch(e) { console.warn('[v90] ensureCollections:', e.message); }
  }
  
  // ═══════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════
  async function loadEmployeesData() {
    if (!window.FB || !FB.db) return;
    try {
      var snap = await FB.db.collection('users')
        .where('role', 'in', ['cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr'])
        .limit(50).get();
      
      window.CAExtras.employees = [];
      snap.forEach(function(d) {
        var u = d.data();
        u._id = d.id;
        window.CAExtras.employees.push(u);
      });
      
      var ratesDoc = await FB.db.collection('config').doc('commission_rates').get();
      if (ratesDoc.exists) {
        var rates = {};
        (ratesDoc.data().list || []).forEach(function(r) {
          rates[r.role] = r.pct;
        });
        window.CAExtras.rates = rates;
      }
      
      console.log('[v90] loaded', window.CAExtras.employees.length, 'employees');
    } catch(e) { console.warn('[v90] loadEmployeesData:', e.message); }
  }
  
  async function loadTransactions() {
    if (!window.FB || !FB.db) return;
    try {
      var snap = await FB.db.collection('transactions').orderBy('createdAt', 'desc').limit(100).get();
      window.CAExtras.transactions = [];
      snap.forEach(function(d) {
        var t = d.data();
        t._id = d.id;
        window.CAExtras.transactions.push(t);
      });
      console.log('[v90] loaded', window.CAExtras.transactions.length, 'transactions');
    } catch(e) {
      // orderBy may fail if no index — try without
      try {
        var snap2 = await FB.db.collection('transactions').limit(100).get();
        window.CAExtras.transactions = [];
        snap2.forEach(function(d) {
          var t = d.data();
          t._id = d.id;
          window.CAExtras.transactions.push(t);
        });
      } catch(e2) { console.warn('[v90] transactions:', e2.message); }
    }
  }
  
  // ═══════════════════════════════════════════════
  // CALCULATE EMPLOYEE COMMISSIONS
  // ═══════════════════════════════════════════════
  function calcCommission(emp) {
    var pct = window.CAExtras.rates[emp.role] || 0;
    var monthlySales = 0;
    
    if (emp.role === 'cat_manager' && emp.assignedCategory) {
      // Sum sales from his category
      var orders = window.A.orders || [];
      orders.forEach(function(o) {
        if (o.status === 'cancelled') return;
        var catData = (o.categories || {})[emp.assignedCategory];
        if (catData && catData.status === 'confirmed') {
          monthlySales += Number(catData.subtotal) || 0;
        }
      });
    } else if (emp.role === 'bookings_mgr') {
      var bookings = window.A.bookings || [];
      bookings.forEach(function(b) {
        if (b.status === 'confirmed' || b.status === 'completed') {
          monthlySales += Number((b.priceQuote && b.priceQuote.amount) || b.estimatedPrice || 0);
        }
      });
    } else if (emp.role === 'delivery_mgr') {
      // Count deliveries
      var orders2 = window.A.orders || [];
      orders2.forEach(function(o) {
        if (o.status === 'completed' && o.deliveryInfo && o.deliveryInfo.deliveryFee) {
          monthlySales += Number(o.deliveryInfo.deliveryFee) || 0;
        }
      });
    }
    
    var commission = Math.round(monthlySales * pct / 100);
    return { sales: monthlySales, pct: pct, commission: commission };
  }
  
  function calcBalance(emp) {
    var trans = window.CAExtras.transactions.filter(function(t) {
      return t.userId === emp._id && t.status !== 'rejected';
    });
    
    var advances = 0, deductions = 0, paid = 0;
    trans.forEach(function(t) {
      var amt = Number(t.amount) || 0;
      if (t.type === 'advance') advances += amt;
      else if (t.type === 'deduction') deductions += amt;
      else if (t.type === 'paid') paid += amt;
    });
    
    var commission = calcCommission(emp).commission;
    var owed = commission + advances - deductions - paid;
    
    return { owed: owed, advances: advances, deductions: deductions, paid: paid, commission: commission };
  }
  
  // ═══════════════════════════════════════════════
  // TAB 7: EMPLOYEES
  // ═══════════════════════════════════════════════
  window.__caRenderEmployees = function() {
    var container = document.getElementById('ca-content-employees');
    if (!container) return;
    
    if (!window.CAExtras.loaded) {
      container.innerHTML = '<div class="ca-empty"><div style="font-size:32px;margin-bottom:10px;">⏳</div>جاري التحميل...</div>';
      loadEmployeesData().then(function() {
        loadTransactions().then(function() {
          window.CAExtras.loaded = true;
          window.__caRenderEmployees();
        });
      });
      return;
    }
    
    var emps = window.CAExtras.employees;
    if (!emps.length) {
      container.innerHTML = '<div class="ca-empty">لا موظفين مسجلين</div>';
      return;
    }
    
    var totalCommissions = 0, totalAdvances = 0, totalOwed = 0;
    var empCalculations = [];
    
    emps.forEach(function(emp) {
      var c = calcCommission(emp);
      var b = calcBalance(emp);
      totalCommissions += c.commission;
      totalAdvances += b.advances;
      totalOwed += Math.max(0, b.owed);
      empCalculations.push({ emp: emp, calc: c, balance: b });
    });
    
    var html = '<div class="ca-extra-panel">';
    
    // KPIs
    html += '<div class="ca-kpi-grid">' +
      '<div class="ca-kpi ca-kpi-purple"><div class="ca-kpi-label">👥 الموظفون</div><div class="ca-kpi-value">' + emps.length + '</div></div>' +
      '<div class="ca-kpi ca-kpi-green"><div class="ca-kpi-label">💰 إجمالي العمولات</div><div class="ca-kpi-value">' + totalCommissions.toLocaleString('ar-EG') + '</div></div>' +
      '<div class="ca-kpi ca-kpi-yellow"><div class="ca-kpi-label">💸 إجمالي التقدمات</div><div class="ca-kpi-value">' + totalAdvances.toLocaleString('ar-EG') + '</div></div>' +
      '<div class="ca-kpi ca-kpi-red"><div class="ca-kpi-label">📊 المستحقات</div><div class="ca-kpi-value">' + totalOwed.toLocaleString('ar-EG') + '</div></div>' +
    '</div>';
    
    // Employees list
    var roleLabels = {
      cat_manager: { label: 'مدير قسم', icon: '📦' },
      delivery_mgr: { label: 'مندوب طلبات', icon: '🚚' },
      accountant: { label: 'محاسب', icon: '💰' },
      bookings_mgr: { label: 'مدير حجوزات', icon: '✈️' }
    };
    
    html += '<div class="ca-section-title">👥 فريق العمل — العمولات والرواتب</div>';
    
    empCalculations.forEach(function(item) {
      var e = item.emp, c = item.calc, b = item.balance;
      var role = roleLabels[e.role] || { label: e.role, icon: '👤' };
      var catLabel = e.assignedCategory ? ' · قسم ' + e.assignedCategory : '';
      var owedColor = b.owed > 0 ? '#10b981' : (b.owed < 0 ? '#ef4444' : '#6b7280');
      
      html += '<div class="ca-card">' +
        '<div class="ca-row-header">' +
          '<div>' +
            '<div class="ca-card-title">' + role.icon + ' ' + _esc(e.name || e.email || 'موظف') + '</div>' +
            '<div class="ca-card-meta">' + role.label + catLabel + '</div>' +
          '</div>' +
          '<div class="ca-badge ' + (b.owed > 0 ? 'ca-badge-green' : b.owed < 0 ? 'ca-badge-red' : 'ca-badge-gray') + '">' +
            (b.owed > 0 ? '+' : '') + b.owed.toLocaleString('ar-EG') + ' ر.س' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0;font-size:10.5px;">' +
          '<div style="padding:6px 8px;background:rgba(168,85,247,0.06);border-radius:6px;">' +
            '<span style="color:#9ca3af;">📊 مبيعاته:</span> <b style="color:#a855f7;">' + c.sales.toLocaleString('ar-EG') + '</b>' +
          '</div>' +
          '<div style="padding:6px 8px;background:rgba(16,185,129,0.06);border-radius:6px;">' +
            '<span style="color:#9ca3af;">💰 عمولته (' + c.pct + '%):</span> <b style="color:#10b981;">' + c.commission.toLocaleString('ar-EG') + '</b>' +
          '</div>' +
          '<div style="padding:6px 8px;background:rgba(245,158,11,0.06);border-radius:6px;">' +
            '<span style="color:#9ca3af;">💸 تقدمات:</span> <b style="color:#f59e0b;">' + b.advances.toLocaleString('ar-EG') + '</b>' +
          '</div>' +
          '<div style="padding:6px 8px;background:rgba(239,68,68,0.06);border-radius:6px;">' +
            '<span style="color:#9ca3af;">📉 خصومات:</span> <b style="color:#ef4444;">' + b.deductions.toLocaleString('ar-EG') + '</b>' +
          '</div>' +
        '</div>' +
        '<div class="ca-card-actions">' +
          '<button class="ca-btn ca-btn-ghost" onclick="window.__caEditRate(\\'' + e._id + '\\')">✏️ تعديل النسبة</button>' +
          '<button class="ca-btn ca-btn-success" onclick="window.__caAddTransaction(\\'' + e._id + '\\',\\'advance\\')">💸 تقدمة</button>' +
          '<button class="ca-btn ca-btn-danger" onclick="window.__caAddTransaction(\\'' + e._id + '\\',\\'deduction\\')">📉 خصم</button>' +
          '<button class="ca-btn ca-btn-primary" onclick="window.__caAddTransaction(\\'' + e._id + '\\',\\'paid\\')">✅ دفع راتب</button>' +
        '</div>' +
      '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
  };
  
  // ═══════════════════════════════════════════════
  // TAB 8: ADVANCES & TRANSACTIONS
  // ═══════════════════════════════════════════════
  window.__caRenderAdvances = function() {
    var container = document.getElementById('ca-content-advances');
    if (!container) return;
    
    if (!window.CAExtras.loaded) {
      loadTransactions().then(function() {
        window.CAExtras.loaded = true;
        window.__caRenderAdvances();
      });
      container.innerHTML = '<div class="ca-empty">⏳ جاري التحميل...</div>';
      return;
    }
    
    var trans = window.CAExtras.transactions;
    var filter = window.CAExtras.activeTab || 'all';
    
    var filtered = trans;
    if (filter === 'advances') filtered = trans.filter(function(t){ return t.type === 'advance'; });
    else if (filter === 'deductions') filtered = trans.filter(function(t){ return t.type === 'deduction'; });
    else if (filter === 'paid') filtered = trans.filter(function(t){ return t.type === 'paid'; });
    else if (filter === 'pending') filtered = trans.filter(function(t){ return t.status === 'pending'; });
    
    var totalAdvances = 0, totalDeductions = 0, totalPaid = 0, totalPending = 0;
    trans.forEach(function(t) {
      var amt = Number(t.amount) || 0;
      if (t.type === 'advance') totalAdvances += amt;
      else if (t.type === 'deduction') totalDeductions += amt;
      else if (t.type === 'paid') totalPaid += amt;
      if (t.status === 'pending') totalPending += amt;
    });
    
    var html = '<div class="ca-extra-panel">';
    
    html += '<div class="ca-kpi-grid">' +
      '<div class="ca-kpi ca-kpi-yellow"><div class="ca-kpi-label">💸 التقدمات</div><div class="ca-kpi-value">' + totalAdvances.toLocaleString('ar-EG') + '</div></div>' +
      '<div class="ca-kpi ca-kpi-red"><div class="ca-kpi-label">📉 الخصومات</div><div class="ca-kpi-value">' + totalDeductions.toLocaleString('ar-EG') + '</div></div>' +
      '<div class="ca-kpi ca-kpi-green"><div class="ca-kpi-label">✅ المدفوع</div><div class="ca-kpi-value">' + totalPaid.toLocaleString('ar-EG') + '</div></div>' +
      '<div class="ca-kpi ca-kpi-purple"><div class="ca-kpi-label">⏳ معلق</div><div class="ca-kpi-value">' + totalPending.toLocaleString('ar-EG') + '</div></div>' +
    '</div>';
    
    html += '<div class="ca-tabs-inner">' +
      '<button class="ca-tab-inner' + (filter === 'all' ? ' active' : '') + '" onclick="window.__caSetSubTab(\\'advances\\',\\'all\\')">الكل</button>' +
      '<button class="ca-tab-inner' + (filter === 'advances' ? ' active' : '') + '" onclick="window.__caSetSubTab(\\'advances\\',\\'advances\\')">💸 تقدمات</button>' +
      '<button class="ca-tab-inner' + (filter === 'deductions' ? ' active' : '') + '" onclick="window.__caSetSubTab(\\'advances\\',\\'deductions\\')">📉 خصومات</button>' +
      '<button class="ca-tab-inner' + (filter === 'paid' ? ' active' : '') + '" onclick="window.__caSetSubTab(\\'advances\\',\\'paid\\')">✅ مدفوع</button>' +
      '<button class="ca-tab-inner' + (filter === 'pending' ? ' active' : '') + '" onclick="window.__caSetSubTab(\\'advances\\',\\'pending\\')">⏳ معلق</button>' +
    '</div>';
    
    if (!filtered.length) {
      html += '<div class="ca-empty">لا حركات في هذه الفئة</div>';
    } else {
      filtered.forEach(function(t) {
        var typeIcon = { advance: '💸', deduction: '📉', paid: '✅' }[t.type] || '📝';
        var typeLabel = { advance: 'تقدمة', deduction: 'خصم', paid: 'دفع راتب' }[t.type] || t.type;
        var statusBadge = { pending: 'ca-badge-yellow', approved: 'ca-badge-green', rejected: 'ca-badge-red' }[t.status] || 'ca-badge-gray';
        var statusLabel = { pending: '⏳ معلق', approved: '✅ معتمد', rejected: '❌ مرفوض' }[t.status] || t.status;
        var date = t.createdAt ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '—';
        
        html += '<div class="ca-row">' +
          '<div class="ca-row-header">' +
            '<div>' +
              '<div class="ca-row-title">' + typeIcon + ' ' + _esc(t.userName || 'موظف') + '</div>' +
              '<div class="ca-row-sub">' + typeLabel + ' · ' + date + '</div>' +
            '</div>' +
            '<div style="text-align:left;">' +
              '<div style="font-size:14px;font-weight:900;color:' + (t.type === 'advance' ? '#f59e0b' : (t.type === 'paid' ? '#10b981' : '#ef4444')) + ';">' + (Number(t.amount) || 0).toLocaleString('ar-EG') + ' ر.س</div>' +
              '<div class="ca-badge ' + statusBadge + '" style="margin-top:4px;display:inline-block;">' + statusLabel + '</div>' +
            '</div>' +
          '</div>' +
          (t.reason ? '<div style="font-size:10.5px;color:#9ca3af;padding:6px 8px;background:rgba(168,85,247,0.05);border-radius:6px;margin-top:6px;">📝 ' + _esc(t.reason) + '</div>' : '') +
          (t.status === 'pending' ? '<div class="ca-card-actions" style="margin-top:8px;">' +
            '<button class="ca-btn ca-btn-success" onclick="window.__caApproveTrans(\\'' + t._id + '\\',\\'approved\\')">✅ اعتماد</button>' +
            '<button class="ca-btn ca-btn-danger" onclick="window.__caApproveTrans(\\'' + t._id + '\\',\\'rejected\\')">❌ رفض</button>' +
          '</div>' : '') +
        '</div>';
      });
    }
    
    html += '</div>';
    container.innerHTML = html;
  };
  
  // ═══════════════════════════════════════════════
  // TAB 9: COMPREHENSIVE REPORT
  // ═══════════════════════════════════════════════
  window.__caRenderReport = function() {
    var container = document.getElementById('ca-content-report');
    if (!container) return;
    
    var orders = window.A.orders || [];
    var bookings = window.A.bookings || [];
    var products = window.A.products || [];
    
    // Period: this month
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    var monthName = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][now.getMonth()];
    
    var monthOrders = orders.filter(function(o) {
      var ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
      return ts >= monthStart && o.status !== 'cancelled';
    });
    
    var monthBookings = bookings.filter(function(b) {
      var ts = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return ts >= monthStart && b.status !== 'cancelled';
    });
    
    // ═══ REVENUE ═══
    var salesRevenue = monthOrders.reduce(function(s, o) { return s + (Number(o.total) || 0); }, 0);
    var bookingsRevenue = monthBookings.reduce(function(s, b) { return s + Number((b.priceQuote && b.priceQuote.amount) || b.estimatedPrice || 0); }, 0);
    var totalRevenue = salesRevenue + bookingsRevenue;
    
    // ═══ COSTS ═══
    // Cost of goods sold: sum costPrice of items sold
    var goodsCost = 0;
    monthOrders.forEach(function(o) {
      (o.items || []).forEach(function(it) {
        var prod = products.find(function(p){ return String(p.id) === String(it.id); });
        if (prod && prod.costPrice > 0) {
          goodsCost += (Number(prod.costPrice) || 0) * (Number(it.qty) || 1);
        }
      });
    });
    
    var deliveryCost = monthOrders.reduce(function(s, o) {
      return s + Number((o.deliveryInfo && o.deliveryInfo.deliveryFee) || 0);
    }, 0);
    
    // ═══ COMMISSIONS ═══
    var totalCommissions = 0;
    window.CAExtras.employees.forEach(function(emp) {
      totalCommissions += calcCommission(emp).commission;
    });
    
    // ═══ PROFIT ═══
    var totalCosts = goodsCost + deliveryCost + totalCommissions;
    var netProfit = totalRevenue - totalCosts;
    var profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    
    var html = '<div class="ca-extra-panel">';
    
    html += '<div class="ca-section-title">📈 التقرير الشامل — ' + monthName + ' ' + now.getFullYear() + '</div>';
    
    // Revenue
    html += '<div class="ca-card">' +
      '<div class="ca-card-title" style="color:#10b981;">💰 الإيرادات</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11.5px;"><span style="color:#9ca3af;">🛒 المبيعات</span><b style="color:#e5e7eb;">' + salesRevenue.toLocaleString('ar-EG') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11.5px;"><span style="color:#9ca3af;">✈️ الحجوزات</span><b style="color:#e5e7eb;">' + bookingsRevenue.toLocaleString('ar-EG') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;margin-top:6px;border-top:1.5px solid rgba(16,185,129,0.2);font-size:13px;"><span style="color:#10b981;font-weight:900;">الإجمالي</span><b style="color:#10b981;font-size:15px;">' + totalRevenue.toLocaleString('ar-EG') + ' ر.س</b></div>' +
    '</div>';
    
    // Costs
    html += '<div class="ca-card">' +
      '<div class="ca-card-title" style="color:#ef4444;">💸 التكاليف</div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11.5px;"><span style="color:#9ca3af;">📦 جملة المنتجات</span><b style="color:#e5e7eb;">' + goodsCost.toLocaleString('ar-EG') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11.5px;"><span style="color:#9ca3af;">🚚 التوصيل</span><b style="color:#e5e7eb;">' + deliveryCost.toLocaleString('ar-EG') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11.5px;"><span style="color:#9ca3af;">👥 العمولات</span><b style="color:#e5e7eb;">' + totalCommissions.toLocaleString('ar-EG') + '</b></div>' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;margin-top:6px;border-top:1.5px solid rgba(239,68,68,0.2);font-size:13px;"><span style="color:#ef4444;font-weight:900;">الإجمالي</span><b style="color:#ef4444;font-size:15px;">' + totalCosts.toLocaleString('ar-EG') + ' ر.س</b></div>' +
    '</div>';
    
    // Net Profit
    var profitColor = netProfit >= 0 ? '#10b981' : '#ef4444';
    html += '<div class="ca-card" style="background:linear-gradient(135deg,' + (netProfit >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)') + ',rgba(168,85,247,0.06));border-color:' + profitColor + ';text-align:center;padding:20px;">' +
      '<div style="font-size:11px;color:' + profitColor + ';font-weight:800;margin-bottom:6px;">' + (netProfit >= 0 ? '✅ صافي الربح' : '❌ صافي الخسارة') + '</div>' +
      '<div style="font-size:32px;font-weight:900;color:' + profitColor + ';margin-bottom:6px;">' + Math.abs(netProfit).toLocaleString('ar-EG') + ' ر.س</div>' +
      '<div style="font-size:11px;color:#9ca3af;">هامش الربح: ' + profitMargin + '%</div>' +
    '</div>';
    
    // Actions
    html += '<div class="ca-card-actions" style="margin-top:14px;">' +
      '<button class="ca-btn ca-btn-primary" onclick="window.__caSendReportToOwner()">📤 إرسال للمدير</button>' +
      '<button class="ca-btn ca-btn-ghost" onclick="window.__caExportReport()">📥 تصدير CSV</button>' +
    '</div>';
    
    html += '</div>';
    container.innerHTML = html;
  };
  
  // ═══════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════
  window.__caSetSubTab = function(parentTab, subTab) {
    window.CAExtras.activeTab = subTab;
    if (parentTab === 'advances') window.__caRenderAdvances();
  };
  
  window.__caEditRate = function(empId) {
    var emp = window.CAExtras.employees.find(function(e){ return e._id === empId; });
    if (!emp) return;
    
    var currentRate = window.CAExtras.rates[emp.role] || 0;
    var newRate = prompt('نسبة العمولة لـ ' + (emp.name || emp.email) + ' (%):', currentRate);
    if (newRate === null) return;
    
    var pct = parseFloat(newRate);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      if (window.A && window.A.toast) window.A.toast('نسبة غير صحيحة', 'err');
      return;
    }
    
    // Update global rate for this role
    FB.db.collection('config').doc('commission_rates').get().then(function(doc) {
      var list = doc.exists ? (doc.data().list || []) : [];
      var found = false;
      list.forEach(function(r) {
        if (r.role === emp.role) { r.pct = pct; found = true; }
      });
      if (!found) list.push({ role: emp.role, pct: pct });
      
      return FB.db.collection('config').doc('commission_rates').set({ list: list });
    }).then(function() {
      window.CAExtras.rates[emp.role] = pct;
      window.__caRenderEmployees();
      if (window.A && window.A.toast) window.A.toast('✓ تم التحديث', 'suc');
    }).catch(function(e) {
      if (window.A && window.A.toast) window.A.toast('فشل: ' + e.message, 'err');
    });
  };
  
  window.__caAddTransaction = function(empId, type) {
    var emp = window.CAExtras.employees.find(function(e){ return e._id === empId; });
    if (!emp) return;
    
    var typeLabels = { advance: 'تقدمة', deduction: 'خصم', paid: 'دفع راتب' };
    var amount = prompt('مبلغ ' + typeLabels[type] + ' لـ ' + (emp.name || emp.email) + ' (ر.س):');
    if (!amount) return;
    
    var amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      if (window.A && window.A.toast) window.A.toast('مبلغ غير صحيح', 'err');
      return;
    }
    
    var reason = prompt('سبب الحركة (اختياري):', '') || '';
    
    FB.db.collection('transactions').add({
      userId: emp._id,
      userName: emp.name || emp.email,
      role: emp.role,
      type: type,
      amount: amt,
      reason: reason,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: FB.currentUser ? FB.currentUser.uid : ''
    }).then(function() {
      if (window.A && window.A.toast) window.A.toast('✓ تمت الإضافة', 'suc');
      window.CAExtras.loaded = false;
      window.__caRenderEmployees();
    }).catch(function(e) {
      if (window.A && window.A.toast) window.A.toast('فشل: ' + e.message, 'err');
    });
  };
  
  window.__caApproveTrans = function(transId, status) {
    FB.db.collection('transactions').doc(transId).update({
      status: status,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      approvedBy: FB.currentUser ? FB.currentUser.uid : ''
    }).then(function() {
      if (window.A && window.A.toast) window.A.toast('✓ ' + (status === 'approved' ? 'تم الاعتماد' : 'تم الرفض'), 'suc');
      window.CAExtras.loaded = false;
      window.__caRenderAdvances();
    }).catch(function(e) {
      if (window.A && window.A.toast) window.A.toast('فشل: ' + e.message, 'err');
    });
  };
  
  window.__caSendReportToOwner = function() {
    var orders = window.A.orders || [];
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    var monthOrders = orders.filter(function(o) {
      var ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
      return ts >= monthStart && o.status !== 'cancelled';
    });
    var revenue = monthOrders.reduce(function(s, o){ return s + (Number(o.total) || 0); }, 0);
    
    var msg = '📊 تقرير مالي — ' + now.toLocaleDateString('ar-EG') + '\\n\\n' +
      '💰 إيرادات الشهر: ' + revenue.toLocaleString('ar-EG') + ' ر.س\\n' +
      '📦 عدد الطلبات: ' + monthOrders.length + '\\n' +
      '👥 الموظفون: ' + window.CAExtras.employees.length + '\\n';
    
    if (FB.db) {
      FB.db.collection('push_queue').add({
        title: '📊 تقرير مالي جديد',
        body: 'من المحاسب — ' + now.toLocaleDateString('ar-EG'),
        type: 'financial',
        data: { report: msg },
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        if (window.A && window.A.toast) window.A.toast('✓ تم الإرسال للمدير', 'suc');
      }).catch(function(e) {
        if (window.A && window.A.toast) window.A.toast('فشل: ' + e.message, 'err');
      });
    }
  };
  
  window.__caExportReport = function() {
    var orders = window.A.orders || [];
    var products = window.A.products || [];
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    var monthOrders = orders.filter(function(o) {
      var ts = o.createdAt && o.createdAt.seconds ? o.createdAt.seconds : 0;
      return ts >= monthStart && o.status !== 'cancelled';
    });
    
    var csv = 'التاريخ,رقم الطلب,العميل,الإجمالي,الحالة\\n';
    monthOrders.forEach(function(o) {
      var date = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '';
      csv += date + ',' + (o.orderNumber || o.id) + ',' + (o.name || '') + ',' + (o.total || 0) + ',' + (o.status || '') + '\\n';
    });
    
    var blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'chizen-report-' + now.toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // ═══════════════════════════════════════════════
  // EXTEND __caSwitchTab
  // ═══════════════════════════════════════════════
  function extendCaSwitchTab() {
    var orig = window.__caSwitchTab;
    if (!orig || orig._v90Patched) return;
    
    window.__caSwitchTab = function(tab, btn) {
      // Hide all content
      document.querySelectorAll('[id^="ca-content-"]').forEach(function(el){
        el.style.display = 'none';
      });
      
      // Call original
      orig.call(this, tab, btn);
      
      // Show target content
      var target = document.getElementById('ca-content-' + tab);
      if (target) {
        target.style.display = 'block';
      } else {
        // Create if needed
        var app = document.getElementById('accountant-mgr-app');
        if (app) {
          target = document.createElement('div');
          target.id = 'ca-content-' + tab;
          target.style.cssText = 'padding:0;';
          app.appendChild(target);
        }
      }
      
      // Render new tabs
      if (tab === 'employees') setTimeout(window.__caRenderEmployees, 100);
      if (tab === 'advances') setTimeout(window.__caRenderAdvances, 100);
      if (tab === 'report') setTimeout(window.__caRenderReport, 100);
    };
    window.__caSwitchTab._v90Patched = true;
    console.log('[v90] __caSwitchTab extended');
  }
  
  // ═══════════════════════════════════════════════
  // ADD TAB BUTTONS
  // ═══════════════════════════════════════════════
  function addExtraTabButtons() {
    var navs = document.querySelectorAll('.ca-nav-btn');
    if (navs.length === 0) { setTimeout(addExtraTabButtons, 500); return; }
    
    var existingTabs = {};
    navs.forEach(function(n) { existingTabs[n.getAttribute('data-tab')] = true; });
    
    var newTabs = [
      { key: 'employees', icon: '👥', label: 'الموظفون' },
      { key: 'advances', icon: '💳', label: 'التقدمات' },
      { key: 'report', icon: '📈', label: 'تقرير' }
    ];
    
    var lastNav = navs[navs.length - 1];
    
    newTabs.forEach(function(t) {
      if (existingTabs[t.key]) return;
      var btn = document.createElement('button');
      btn.className = 'ca-nav-btn';
      btn.setAttribute('data-tab', t.key);
      btn.setAttribute('onclick', 'window.__caSwitchTab(\\'' + t.key + '\\',this)');
      btn.innerHTML = '<span class="icon">' + t.icon + '</span><span class="label">' + t.label + '</span>';
      if (lastNav && lastNav.parentNode) {
        lastNav.parentNode.appendChild(btn);
      }
    });
    
    console.log('[v90] added', newTabs.length, 'tab buttons');
  }
  
  // ═══════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════
  function init() {
    ensureCollections();
    extendCaSwitchTab();
    addExtraTabButtons();
    console.log('[v90] ✓ accountant extras ready');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 2000); });
  } else {
    setTimeout(init, 2000);
  }
  setTimeout(init, 4000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v90 installed — 3 new tabs (employees, advances, report)');
