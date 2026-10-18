(function() {
  function forceLogin() {
    var gb = document.getElementById('gb');
    if(gb && (gb.innerHTML.indexOf('جاري') > -1 || gb.innerHTML.indexOf('sp') > -1)) {
      gb.innerHTML = '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div>' +
          '<div class="gi">🔐</div><div class="gtt">لوحة محمية</div>' +
          '<div class="gd">سجّل دخول بحساب المسؤول</div>' +
          '<input type="email" id="admin-email" class="fi" placeholder="البريد الإلكتروني" style="margin-bottom:10px;text-align:left;direction:ltr;width:100%;padding:12px;background:#150826;border:1px solid #3A1F5A;border-radius:9px;color:#F5E6FF;font-family:Cairo;font-size:16px;">' +
          '<input type="password" id="admin-pass" class="fi" placeholder="كلمة المرور" style="margin-bottom:15px;text-align:left;direction:ltr;width:100%;padding:12px;background:#150826;border:1px solid #3A1F5A;border-radius:9px;color:#F5E6FF;font-family:Cairo;font-size:16px;">' +
          '<button class="gbtn" onclick="window.FB.auth.signInWithEmailAndPassword(document.getElementById(\'admin-email\').value, document.getElementById(\'admin-pass\').value).then(()=>location.reload()).catch(e=>alert(e.message))" style="width:100%;padding:15px;background:linear-gradient(135deg,#EC4899,#A855F7);border:none;border-radius:12px;color:#fff;font-family:Cairo;font-size:15px;font-weight:900;margin-bottom:10px;">🔓 دخول بالبريد</button>' +
          '<button class="gbtn sec" onclick="A.loginGoogle()" style="width:100%;padding:15px;background:#2A1345;border:1px solid #3A1F5A;border-radius:12px;color:#F5E6FF;font-family:Cairo;font-size:15px;font-weight:900;margin-bottom:10px;">🔍 دخول بـ Google</button>';
    }
  }
  // محاولة استبدال الشاشة عدة مرات لضمان نجاحها
  setTimeout(forceLogin, 500);
  setTimeout(forceLogin, 1500);
  setTimeout(forceLogin, 3000);
})();
