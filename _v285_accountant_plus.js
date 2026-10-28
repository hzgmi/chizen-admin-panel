const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v285-accountant-plus"')) { console.log('already applied'); process.exit(0); }

const v285 = `
<script id="v285-accountant-plus">
(function(){
  if (!window.CA) { setTimeout(arguments.callee, 500); return; }
  console.log('[V285] Enhancing accountant panel...');

  // ═══════════ 1. إضافة زر "المعاملات" في التبويبات ═══════════
  setTimeout(function(){
    var navBar = document.querySelector('#accountant-mgr-app .ca-nav');
    if (navBar && !navBar.querySelector('[data-tab="transactions"]')) {
      var transactionsBtn = document.createElement('button');
      transactionsBtn.className = 'ca-nav-btn';
      transactionsBtn.setAttribute('data-tab', 'transactions');
      transactionsBtn.innerHTML = '<span class="icon">💸</span><span class="label">معاملات</span>';
      transactionsBtn.onclick = function(){ window.__caSwitchTab('transactions', this); };
      
      var reportsBtn = navBar.querySelector('[data-tab="reports"]');
      if (reportsBtn) navBar.insertBefore(transactionsBtn, reportsBtn);
      else navBar.appendChild(transactionsBtn);
      
      console.log('[V285] ✅ Transactions tab added');
    }
  }, 1500);

  // ═══════════ 2. اعتراض renderContent ═══════════
  var origRender = window.CA && window.CA.renderContent;
  
  // البحث عن renderContent داخل النطاق — غير متاح خارجياً
  // البديل: اعتراض __caSwitchTab
  var origSwitch = window.__caSwitchTab;
  window.__caSwitchTab = function(tab, btn){
    if (tab === 'transactions') {
      // إخفاء محتوى كل التبويبات
      document.querySelectorAll('#accountant-mgr-app [id^="ca-content-"]').forEach(function(c){
        c.style.display = 'none';
        c.classList.remove('v93-shown');
      });
      // إخفاء الأزرار النشطة
      document.querySelectorAll('#accountant-mgr-app .ca-nav-btn').forEach(function(b){
        b.classList.remove('active');
      });
      // تفعيل الزر
      if (btn) btn.classList.add('active');
      // عرض محتوى المعاملات
      renderTransactions();
      return;
    }
    return origSwitch.apply(this, arguments);
  };

  // ═══════════ 3. محتوى المعاملات ═══════════
  async function renderTransactions(){
    var main = document.querySelector('#accountant-mgr-app .ca-main');
    if (!main) return;
    
    main.innerHTML = '<div style="text-align:center;padding:40px;color:#f59e0b">⏳ جاري التحميل...</div>';
    
    try {
      var db = firebase.firestore();
      var snap = await db.collection('transactions').orderBy('createdAt', 'desc').limit(100).get();
      var items = snap.docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });
      
      var totalIn = 0, totalOut = 0, pending = 0;
      items.forEach(function(t){
        var amt = Number(t.amount) || 0;
        if (t.type === 'income' || t.type === 'paid') totalIn += amt;
        else if (t.type === 'expense' || t.type === 'deduction' || t.type === 'advance') totalOut += amt;
        if (t.status === 'pending') pending++;
      });
      
      var listHtml = items.length ? items.map(function(t){
        var typeLabels = {advance:'تقدمة', deduction:'خصم', paid:'دفعة', expense:'مصروف', income:'إيراد'};
        var typeColors = {advance:'#f59e0b', deduction:'#ef4444', paid:'#22c55e', expense:'#ec4899', income:'#3b82f6'};
        var statusColors = {pending:'#fbbf24', approved:'#22c55e', rejected:'#ef4444'};
        var statusLabels = {pending:'معلق', approved:'معتمد', rejected:'مرفوض'};
        var date = t.createdAt && t.createdAt.toDate ? t.createdAt.toDate().toLocaleDateString('ar-YE', {month:'short', day:'numeric'}) : '—';
        return '<div style="background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(217,119,6,0.03));border:1px solid rgba(245,158,11,0.25);border-radius:14px;padding:12px;margin-bottom:8px">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">'
          +   '<div style="flex:1;min-width:0">'
          +     '<div style="font-size:13px;font-weight:800;color:' + (typeColors[t.type]||'#fff') + '">' + (typeLabels[t.type] || t.type || '—') + '</div>'
          +     '<div style="font-size:11px;color:#b8c0d8">' + (t.userName || '—') + ' · ' + date + '</div>'
          +   '</div>'
          +   '<div style="text-align:left">'
          +     '<div style="font-size:16px;font-weight:900;color:#fff">' + (Number(t.amount)||0).toFixed(0) + ' ر</div>'
          +     '<div style="font-size:10px;color:' + (statusColors[t.status]||'#fff') + ';font-weight:700">' + (statusLabels[t.status] || t.status || '') + '</div>'
          +   '</div>'
          + '</div>'
          + (t.reason ? '<div style="font-size:11px;color:#b8c0d8;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:8px;margin-top:6px">📝 ' + esc(t.reason) + '</div>' : '')
          + '</div>';
      }).join('') : '<div style="text-align:center;padding:60px 20px;color:#6b7591"><div style="font-size:48px;margin-bottom:12px">💸</div><div>لا توجد معاملات بعد</div></div>';
      
      main.innerHTML = ''
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
        +   '<div style="font-size:16px;font-weight:900;color:#fff">💸 المعاملات المالية</div>'
        +   '<button onclick="window.__caAddTransaction()" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer">➕ جديدة</button>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">'
        +   '<div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:10px;text-align:center">'
        +     '<div style="font-size:11px;color:#22c55e;font-weight:700;margin-bottom:4px">داخل</div>'
        +     '<div style="font-size:16px;font-weight:900;color:#22c55e">' + Math.round(totalIn).toLocaleString('ar-EG') + '</div>'
        +   '</div>'
        +   '<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:10px;text-align:center">'
        +     '<div style="font-size:11px;color:#ef4444;font-weight:700;margin-bottom:4px">خارج</div>'
        +     '<div style="font-size:16px;font-weight:900;color:#ef4444">' + Math.round(totalOut).toLocaleString('ar-EG') + '</div>'
        +   '</div>'
        +   '<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:10px;text-align:center">'
        +     '<div style="font-size:11px;color:#fbbf24;font-weight:700;margin-bottom:4px">معلق</div>'
        +     '<div style="font-size:16px;font-weight:900;color:#fbbf24">' + pending + '</div>'
        +   '</div>'
        + '</div>'
        + '<div>' + listHtml + '</div>';
    } catch(e) {
      main.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444">❌ ' + esc(e.message) + '</div>';
    }
  }

  // ═══════════ 4. نموذج إضافة معاملة ═══════════
  window.__caAddTransaction = async function(){
    var db = firebase.firestore();
    var usersSnap = await db.collection('users').get();
    var users = usersSnap.docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });
    
    var iS = 'width:100%;padding:12px;background:rgba(15,10,35,0.9);border:1px solid rgba(245,158,11,0.4);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
    var lS = 'display:block;font-size:12px;font-weight:700;color:#f59e0b;margin-bottom:6px';
    
    var userOpts = users.map(function(u){ return '<option value="' + u.id + '">' + (u.name || u.email) + ' — ' + (u.role || '') + '</option>'; }).join('');
    
    var modal = document.createElement('div');
    modal.className = 'ca-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.8);display:flex;align-items:flex-end;justify-content:center';
    modal.innerHTML = '<div style="background:#151b3a;width:100%;max-width:560px;border-radius:24px 24px 0 0;max-height:90vh;overflow-y:auto;color:#fff;border:1px solid rgba(245,158,11,0.3);border-bottom:none">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(245,158,11,0.2);position:sticky;top:0;background:#151b3a">'
      +   '<h3 style="margin:0;font-size:16px;font-weight:900">➕ معاملة جديدة</h3>'
      +   '<button onclick="this.closest(\\'.ca-modal\\').remove()" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px">✕</button>'
      + '</div>'
      + '<div style="padding:16px 20px">'
      +   '<label style="' + lS + '">نوع المعاملة *</label>'
      +   '<select id="cat-type" style="' + iS + '">'
      +     '<option value="advance">📤 تقدمة</option>'
      +     '<option value="deduction">➖ خصم</option>'
      +     '<option value="paid">✅ دفعة</option>'
      +     '<option value="expense">💸 مصروف</option>'
      +     '<option value="income">💰 إيراد</option>'
      +   '</select>'
      +   '<label style="' + lS + '">المستخدم *</label>'
      +   '<select id="cat-user" style="' + iS + '"><option value="">— اختر —</option>' + userOpts + '</select>'
      +   '<label style="' + lS + '">المبلغ (ر.ي) *</label>'
      +   '<input id="cat-amount" type="number" min="1" placeholder="0" style="' + iS + '">'
      +   '<label style="' + lS + '">السبب / الملاحظات</label>'
      +   '<textarea id="cat-reason" rows="2" placeholder="..." style="' + iS + 'resize:vertical"></textarea>'
      +   '<button id="cat-save" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:14px;border-radius:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:none;margin-top:8px">💾 حفظ</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(modal);
    
    document.getElementById('cat-save').onclick = async function(){
      var type = document.getElementById('cat-type').value;
      var userId = document.getElementById('cat-user').value;
      var amount = Number(document.getElementById('cat-amount').value) || 0;
      var reason = document.getElementById('cat-reason').value.trim();
      
      if (!userId) { alert('⚠️ اختر مستخدماً'); return; }
      if (amount <= 0) { alert('⚠️ المبلغ مطلوب'); return; }
      
      var user = users.find(function(u){ return u.id === userId; });
      var btn = this; btn.disabled = true; btn.textContent = '⏳...';
      
      try {
        var currentUser = firebase.auth().currentUser;
        await db.collection('transactions').add({
          type: type, userId: userId,
          userName: user ? (user.name || user.email) : '—',
          userRole: user ? user.role : '',
          amount: amount, reason: reason,
          status: 'approved',
          approvedBy: currentUser.uid,
          approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (user) {
          db.collection('notifications').add({
            userId: userId,
            title: '💼 معاملة جديدة',
            body: (type === 'advance' ? 'تقدمة' : type === 'deduction' ? 'خصم' : type === 'paid' ? 'دفعة' : 'مصروف/إيراد') + ': ' + amount.toFixed(0) + ' ر.ي',
            type: 'info', icon: '💼', read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(function(){});
        }
        
        modal.remove();
        alert('✅ تم الحفظ');
        renderTransactions();
      } catch(e){
        btn.disabled = false; btn.textContent = '💾 حفظ';
        alert('❌ ' + e.message);
      }
    };
  };

  console.log('[V285] ✅ Ready');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + v285 + h.slice(bodyEnd);

fs.writeFileSync('index.html', h);
console.log('✅ v285: accountant enhancements |', before, '->', h.length);
