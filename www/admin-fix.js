/* ═══ CHIZEN Admin Ultimate Bypass ═══ */
(function() {
  function init() {
    if (!window.A || !window.FB) { setTimeout(init, 200); return; }

    // تدمير دالة الفحص القديمة وفرض الدخول المباشر
    A.checkAdmin = function(u) {
      var gb = document.getElementById('gb');
      
      // إذا كان البريد هو بريدك، افتح اللوحة فوراً بدون أي فحص
      if (u.email === 'hazimchat@gmail.com') {
        if(gb) gb.innerHTML = '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div><div class="sp"></div><div class="gd">مرحباً بك، جاري فتح اللوحة...</div>';
        
        // إخفاء شاشة الدخول وإظهار اللوحة
        document.getElementById('gs').style.display = 'none';
        document.getElementById('am').style.display = 'flex';
        
        // بناء الأقسام وتحميل البيانات
        try {
          A.buildSections();
          A.loadData().then(function(){ A.renderAll(); }).catch(function(e){ console.warn(e); });
          A.toast('مرحباً بك ' + (u.displayName || 'المدير'), 'suc');
        } catch(e) {
          alert('خطأ في فتح اللوحة: ' + e.message);
        }
      } else {
        // إذا كان بريداً آخر، ارفضه
        if(gb) gb.innerHTML = '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div><div class="gi">🚫</div><div class="gtt" style="color:#EF4444;">غير مصرح</div><div class="gd">هذا الحساب ليس لديه صلاحيات المسؤول</div><button class="gbtn dgr" onclick="window.FB.auth.signOut().then(()=>location.reload())">تسجيل الخروج</button>';
      }
    };

    // تدمير دالة البدء القديمة وفرض شاشة الدخول الجديدة
    A.init = function() {
      this.loginScreen();
      window.FB.auth.onAuthStateChanged(function(u) {
        if (u) A.checkAdmin(u);
      });
    };

    // شاشة الدخول الجديدة
    A.loginScreen = function() {
      var gb = document.getElementById('gb');
      if(!gb) return;
      gb.innerHTML = '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div>' +
        '<div class="gi">🔐</div><div class="gtt">لوحة محمية</div>' +
        '<div class="gd">سجّل دخول بحساب المسؤول</div>' +
        '<input type="email" id="admin-email" class="fi" placeholder="البريد الإلكتروني" style="margin-bottom:10px;text-align:left;direction:ltr;padding:12px;background:#150826;border:1px solid #3A1F5A;border-radius:9px;color:#F5E6FF;font-family:Cairo;font-size:16px;">' +
        '<input type="password" id="admin-pass" class="fi" placeholder="كلمة المرور" style="margin-bottom:15px;text-align:left;direction:ltr;padding:12px;background:#150826;border:1px solid #3A1F5A;border-radius:9px;color:#F5E6FF;font-family:Cairo;font-size:16px;">' +
        '<button class="gbtn" onclick="var e=document.getElementById(\'admin-email\').value; var p=document.getElementById(\'admin-pass\').value; window.FB.auth.signInWithEmailAndPassword(e,p).then(function(u){ A.checkAdmin(u.user); }).catch(function(err){ alert(err.message); })" style="width:100%;padding:15px;background:linear-gradient(135deg,#EC4899,#A855F7);border:none;border-radius:12px;color:#fff;font-family:Cairo;font-size:15px;font-weight:900;margin-bottom:10px;">🔓 دخول بالبريد</button>' +
        '<button class="gbtn sec" onclick="A.loginGoogle()" style="width:100%;padding:15px;background:#2A1345;border:1px solid #3A1F5A;border-radius:12px;color:#F5E6FF;font-family:Cairo;font-size:15px;font-weight:900;">🔍 دخول بـ Google</button>';
    };

    // تشغيل النظام الجديد فوراً
    A.init();
    console.log('✅ Ultimate Bypass Active');
  }
  init();
})();
