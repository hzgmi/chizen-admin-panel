(function() {
  function apply() {
    if (!window.A) { setTimeout(apply, 200); return; }
    
    // ميزات الأدمن (PDF والسندات)
    A._saveVerification = async function(order) {
      try {
        var safeId = String(order.id).replace(/[^a-zA-Z0-9_-]/g, '_');
        var itemCount = (order.items || []).reduce(function(s, i){ return s + (i.qty || 0); }, 0);
        await window.FB.db.collection('verifications').doc(safeId).set({
          orderId: order.id, customerName: order.name || '', customerPhone: order.phone || '',
          pickup: order.pickup || '', total: order.total || 0, status: order.status || 'pending',
          itemCount: itemCount, savedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch(e) { console.warn('verify save:', e); }
    };

    A.exportOrdersPDF = function() {
      if (!this.orders.length) { this.toast('لا طلبات', 'err'); return; }
      var esc2 = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var html = '<html dir="rtl"><head><meta charset="UTF-8"><title>الطلبات</title><style>body{font-family:Cairo,sans-serif;padding:20px;background:#f5f5f5;}table{width:100%;border-collapse:collapse;font-size:12px;background:white;}th,td{border:1px solid #ddd;padding:6px;text-align:right;}th{background:#EC4899;color:white;}@media print{button{display:none;}}</style></head><body><h2>تقرير الطلبات — CHIZEN</h2><p>التاريخ: ' + new Date().toLocaleString('ar-EG') + ' | العدد: ' + this.orders.length + '</p><table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>التسليم</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>';
      this.orders.forEach(function(o) {
        var st = {pending:'قيد المعالجة',shipped:'في الطريق',completed:'مكتمل',cancelled:'ملغي'}[o.status] || o.status;
        html += '<tr><td>' + (o.id||'').slice(0,12) + '</td><td>' + esc2(o.name) + '</td><td style="direction:ltr;">' + esc2(o.phone) + '</td><td>' + esc2(o.pickup) + '</td><td>' + (o.total||0) + '</td><td>' + st + '</td></tr>';
      });
      html += '</tbody></table><div style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px;background:#EC4899;color:white;border:none;border-radius:10px;font-weight:900;cursor:pointer;">🖨️ طباعة</button></div></body></html>';
      var w = window.open('', '_blank'); w.document.write(html); w.document.close();
    };

    A.sendReceipt = async function(orderId) {
      var o = null; this.orders.forEach(function(x){ if (String(x.id) === String(orderId)) o = x; });
      if (!o || !o.phone) return this.toast('لا يوجد هاتف', 'err');
      var phone = String(o.phone).replace(/\D/g, '');
      if (phone.length === 9 && !phone.startsWith('967')) phone = '967' + phone;
      var msg = 'مرحباً ' + (o.name||'') + ' 👋\n\n🎫 سند استلام طلبك من CHIZEN\n━━━━━━━━━━━━━━━\n📋 رقم الطلب: #' + o.id + '\n💰 الإجمالي: ' + o.total + ' ر.س\n📍 نقطة التسليم: ' + (o.pickup||'') + '\n━━━━━━━━━━━━━━━\n\nشكراً لتسوقك ❤️';
      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    };

    A.exportReceipt = function(orderId) {
      var o = null; this.orders.forEach(function(x){ if (String(x.id) === String(orderId)) o = x; });
      if (!o) return;
      var esc2 = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var html = '<html dir="rtl"><head><meta charset="UTF-8"><title>سند ' + o.id + '</title><style>body{font-family:Cairo,sans-serif;padding:20px;background:#f5f5f5;}.card{max-width:500px;margin:20px auto;background:white;padding:30px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1);}.logo{text-align:center;font-size:32px;font-weight:900;background:linear-gradient(135deg,#FB923C,#EC4899,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #ddd;}.label{color:#666;}.value{font-weight:900;}@media print{button{display:none;}}</style></head><body><div class="card"><div class="logo">CHIZEN</div><div style="text-align:center;color:#666;margin-bottom:20px;">سند استلام الطلب</div>';
      html += '<div class="row"><span class="label">رقم الطلب</span><span class="value" style="color:#EC4899;">#' + o.id + '</span></div>';
      html += '<div class="row"><span class="label">العميل</span><span class="value">' + esc2(o.name) + '</span></div>';
      html += '<div class="row"><span class="label">الهاتف</span><span class="value" style="direction:ltr;">' + esc2(o.phone) + '</span></div>';
      html += '<div class="row"><span class="label">التسليم</span><span class="value" style="color:#10B981;">' + esc2(o.pickup) + '</span></div>';
      html += '<div class="row"><span class="label">الإجمالي</span><span class="value" style="color:#EC4899;font-size:20px;">' + o.total + ' ر.س</span></div>';
      html += '<div style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px;background:#EC4899;color:white;border:none;border-radius:10px;font-weight:900;cursor:pointer;">🖨️ طباعة</button></div></div></body></html>';
      var w = window.open('', '_blank'); w.document.write(html); w.document.close();
    };

    A.exportAllSuppliersPDF = function() {
      if (!this.sups.length) return this.toast('لا موردين', 'err');
      var esc2 = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var html = '<html dir="rtl"><head><meta charset="UTF-8"><title>الموردين</title><style>body{font-family:Cairo,sans-serif;padding:20px;background:#f5f5f5;}table{width:100%;border-collapse:collapse;background:white;}th,td{border:1px solid #ddd;padding:8px;text-align:right;}th{background:#EC4899;color:white;}@media print{button{display:none;}}</style></head><body><h2>تقرير الموردين — CHIZEN</h2><p>' + new Date().toLocaleString('ar-EG') + '</p><table><thead><tr><th>#</th><th>المورد</th><th>الهاتف</th><th>الرصيد</th><th>المنتجات</th></tr></thead><tbody>';
      this.sups.forEach(function(s, i) {
        html += '<tr><td>' + (i+1) + '</td><td>' + esc2(s.name) + '</td><td style="direction:ltr;">' + esc2(s.phone) + '</td><td>' + (s.balance||0).toLocaleString() + '</td><td>' + (s.products||[]).length + '</td></tr>';
      });
      html += '</tbody></table><div style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px;background:#EC4899;color:white;border:none;border-radius:10px;font-weight:900;cursor:pointer;">🖨️ طباعة</button></div></body></html>';
      var w = window.open('', '_blank'); w.document.write(html); w.document.close();
    };

    A.openMonthlyReport = function(supIdx) {
      if (supIdx === null || supIdx === undefined) {
        var totalDebt = this.sups.reduce(function(s, x){ return s + Math.max(0, x.balance || 0); }, 0);
        var body = '<div class="sg"><div class="scd"><div class="sl">إجمالي المستحق</div><div class="sv" style="color:var(--rd);">' + totalDebt.toLocaleString() + ' ر.س</div></div><div class="scd"><div class="sl">عدد الموردين</div><div class="sv">' + this.sups.length + '</div></div></div>';
        this.sups.forEach(function(s) { if ((s.balance||0) > 0) body += '<div class="rw"><div class="ri"><div class="rti">' + (s.name||'') + '</div><div class="rs" style="color:var(--rd);font-weight:900;">' + s.balance.toLocaleString() + ' ر.س</div></div></div>'; });
        this.modal('📊 تقرير شهري', body, '<button class="btn bg2" onclick="A.cm()">إغلاق</button>');
      } else {
        var s = this.sups[supIdx]; if (!s) return;
        var now = new Date();
        var hist = (s.history || []).filter(function(h) { var d = new Date(h.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
        var ordT = hist.filter(function(h){ return h.type === 'order'; }).reduce(function(a,b){ return a + b.amount; }, 0);
        var payT = hist.filter(function(h){ return h.type === 'payment'; }).reduce(function(a,b){ return a + b.amount; }, 0);
        var body2 = '<div class="dr"><span class="dl">توريدات الشهر</span><span class="dv" style="color:var(--rd);">+' + ordT.toLocaleString() + ' ر.س</span></div><div class="dr"><span class="dl">دفعات الشهر</span><span class="dv" style="color:var(--gn);">-' + payT.toLocaleString() + ' ر.س</span></div><div class="dr"><span class="dl">الصافي</span><span class="dv" style="color:var(--pk);font-size:16px;">' + (ordT - payT).toLocaleString() + ' ر.س</span></div>';
        this.modal('📊 ' + (s.name||''), body2, '<button class="btn bg2" onclick="A.cm()">إغلاق</button>');
      }
    };

    A.genSupplyBlob = async function() { return null; };

    // Staff Management
    var tabs = document.querySelector('.tbs');
    if (tabs && !document.querySelector('.tb[onclick*="staff"]')) {
      var btn = document.createElement('button'); btn.className = 'tb'; btn.setAttribute('onclick', "A.tab('staff',this)"); btn.innerHTML = '👷 العمال'; tabs.appendChild(btn);
    }
    var ct = document.getElementById('ct');
    if (ct && !document.getElementById('sc-staff')) {
      var div = document.createElement('div'); div.id = 'sc-staff'; div.className = 'sc';
      div.innerHTML = '<button class="btn bp bb" style="margin-bottom:10px;" onclick="A.staffForm()">+ إضافة عامل جديد</button><div id="staff-list"></div>'; ct.appendChild(div);
    }

    A.loadStaff = async function() {
      var list = document.getElementById('staff-list'); if(!list) return;
      list.innerHTML = '<div class="sp"></div>';
      try {
        var snap = await FB.db.collection('staff').get();
        var html = snap.empty ? '<div class="emp">لا يوجد عمال حالياً</div>' : '';
        snap.forEach(function(doc) {
          var s = doc.data();
          var st = s.blocked ? '<span class="bst bx2">محجوب</span>' : '<span class="bst bc2">نشط</span>';
          var catName = s.category || 'كل الأقسام';
          if (A.cats) { A.cats.forEach(function(c){ if(c.key === s.category) catName = c.name; }); }
          html += '<div class="rw"><div class="rt" style="background:var(--cd2);">👤</div><div class="ri"><div class="rti">' + esc(s.email) + '</div><div class="rs">القسم: ' + esc(catName) + ' • ' + st + '</div></div><div class="ra"><button class="btn ' + (s.blocked ? 'bs' : 'bd') + ' bsm" onclick="A.toggleStaff(\'' + doc.id + '\', ' + !s.blocked + ')">' + (s.blocked ? 'تفعيل' : 'حجب') + '</button><button class="btn bd bsm" onclick="A.deleteStaff(\'' + doc.id + '\')">🗑️</button></div></div>';
        });
        list.innerHTML = html;
      } catch(e) { list.innerHTML = '<div class="emp" style="color:red;">خطأ في التحميل: ' + e.message + '</div>'; }
    };

    A.staffForm = function() {
      var catOpts = '<option value="all">كل الأقسام (مشرف عام)</option>';
      if (A.cats) A.cats.forEach(function(c){ catOpts += '<option value="' + c.key + '">' + c.name + '</option>'; });
      var html = '<div class="fl"><label class="fll">البريد الإلكتروني</label><input class="fi" id="st-email" type="email" placeholder="worker@example.com" style="text-align:left;direction:ltr;"></div>' +
                 '<div class="fl"><label class="fll">كلمة المرور</label><input class="fi" id="st-pass" type="text" placeholder="6 أحرف على الأقل" style="text-align:left;direction:ltr;"></div>' +
                 '<div class="fl"><label class="fll">القسم المسموح</label><select class="fi" id="st-cat">' + catOpts + '</select></div>';
      A.modal('إضافة عامل جديد', html, '<button class="btn bg2" onclick="A.cm()">إلغاء</button><button class="btn bp" onclick="A.saveStaff()">إنشاء الحساب</button>');
    };

    A.saveStaff = async function() {
      var email = document.getElementById('st-email').value.trim();
      var pass = document.getElementById('st-pass').value.trim();
      var cat = document.getElementById('st-cat').value;
      if(!email || pass.length < 6) return A.toast('أدخل بريداً صحيحاً وكلمة مرور 6 أحرف', 'err');
      A.toast('⏳ جاري إنشاء الحساب...', 'suc');
      try {
        var secApp; try { secApp = firebase.app('Secondary'); } catch(e) { secApp = firebase.initializeApp(window.FIREBASE_CONFIG, 'Secondary'); }
        var userCred = await secApp.auth().createUserWithEmailAndPassword(email, pass);
        await FB.db.collection('staff').doc(userCred.user.uid).set({ email: email, category: cat, blocked: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        await secApp.auth().signOut();
        A.cm(); A.loadStaff(); A.toast('✓ تم إنشاء العامل بنجاح', 'suc');
      } catch(e) { A.toast('فشل: ' + e.message, 'err'); }
    };

    A.toggleStaff = async function(uid, blockStatus) {
      try { await FB.db.collection('staff').doc(uid).update({ blocked: blockStatus }); A.loadStaff(); A.toast('✓ تم التحديث', 'suc'); } catch(e) { A.toast('فشل', 'err'); }
    };

    A.deleteStaff = function(uid) {
      A.confirm('حذف العامل؟', 'لن يستطيع الدخول مرة أخرى', async function() {
        try { await FB.db.collection('staff').doc(uid).delete(); A.loadStaff(); A.toast('تم الحذف', 'suc'); } catch(e) { A.toast('فشل', 'err'); }
      });
    };

    var origTab = A.tab;
    A.tab = function(n, el) { origTab.call(this, n, el); if (n === 'staff') this.loadStaff(); };

    console.log('✅ Clean Admin Fixes Applied');
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function(){ setTimeout(apply, 500); }); } else { setTimeout(apply, 500); }
})();

/* ═══ شاشة دخول نظيفة وبدون إعادة تحميل ═══ */
setTimeout(function() {
  if (window.A) {
    A.loginScreen = function() {
      var gb = document.getElementById('gb');
      if(!gb) return;
      gb.innerHTML = '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div>' +
        '<div class="gi">🔐</div><div class="gtt">لوحة محمية</div>' +
        '<div class="gd">سجّل دخول بحساب المسؤول</div>' +
        '<input type="email" id="admin-email" class="fi" placeholder="البريد الإلكتروني" style="margin-bottom:10px;text-align:left;direction:ltr;width:100%;padding:12px;background:#150826;border:1px solid #3A1F5A;border-radius:9px;color:#F5E6FF;font-family:Cairo;font-size:16px;">' +
        '<input type="password" id="admin-pass" class="fi" placeholder="كلمة المرور" style="margin-bottom:15px;text-align:left;direction:ltr;width:100%;padding:12px;background:#150826;border:1px solid #3A1F5A;border-radius:9px;color:#F5E6FF;font-family:Cairo;font-size:16px;">' +
        '<button class="gbtn" onclick="var e=document.getElementById(\'admin-email\').value; var p=document.getElementById(\'admin-pass\').value; window.FB.auth.signInWithEmailAndPassword(e,p).then(function(u){ A.checkAdmin(u.user); }).catch(function(err){ alert(err.message); })" style="width:100%;padding:15px;background:linear-gradient(135deg,#EC4899,#A855F7);border:none;border-radius:12px;color:#fff;font-family:Cairo;font-size:15px;font-weight:900;margin-bottom:10px;">🔓 دخول بالبريد</button>' +
        '<button class="gbtn sec" onclick="A.loginGoogle()" style="width:100%;padding:15px;background:#2A1345;border:1px solid #3A1F5A;border-radius:12px;color:#F5E6FF;font-family:Cairo;font-size:15px;font-weight:900;">🔍 دخول بـ Google</button>';
    };

    // إظهار شاشة الدخول فوراً
    A.loginScreen();
    
    // فحص إذا كان المستخدم مسجل دخول مسبقاً
    if(window.FB && FB.auth) {
        FB.auth.onAuthStateChanged(function(u) {
            if(u) A.checkAdmin(u);
        });
    }
  }
}, 500);
