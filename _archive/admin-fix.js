/* ═══ صائد الأخطاء الشامل ═══ */
window.onerror = function(msg, url, line, col, error) {
  var el = document.getElementById('gb');
  if(el) {
    el.innerHTML += '<div style="background:red;color:white;padding:10px;margin-top:10px;font-size:12px;text-align:left;direction:ltr;">Error: ' + msg + '<br>Line: ' + line + '</div>';
  } else {
    alert('Error: ' + msg);
  }
};

window.addEventListener('unhandledrejection', function(event) {
  var el = document.getElementById('gb');
  var msg = event.reason ? (event.reason.message || event.reason) : 'Unknown Promise Error';
  if(el) {
    el.innerHTML += '<div style="background:darkred;color:white;padding:10px;margin-top:10px;font-size:12px;text-align:left;direction:ltr;">Promise Error: ' + msg + '</div>';
  } else {
    alert('Promise Error: ' + msg);
  }
});

(function() {
  function init() {
    if (!window.A || !window.FB) { setTimeout(init, 200); return; }

    A.init = function() {
      this.loginScreen();
      window.FB.auth.onAuthStateChanged(function(u) {
        if (u) A.checkAdmin(u);
      });
    };

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

    A.checkAdmin = function(u) {
      var gb = document.getElementById('gb');
      if(gb) gb.innerHTML = '<div class="gl">CHIZEN</div><div class="gt">ADMIN PANEL</div><div class="sp"></div><div class="gd">جاري التحقق...</div>';
      
      window.FB.db.collection('admins').doc(u.uid).get().then(function(doc) {
        if (doc.exists) {
          document.getElementById('gs').style.display = 'none';
          document.getElementById('am').style.display = 'flex';
          A.buildSections();
          A.loadData().then(function(){ A.renderAll(); });
        } else {
          if(gb) gb.innerHTML += '<div style="background:red;color:white;padding:10px;margin-top:10px;">أنت لست أدمن في قاعدة البيانات!</div>';
        }
      }).catch(function(error) {
        if(gb) gb.innerHTML += '<div style="background:red;color:white;padding:10px;margin-top:10px;text-align:left;direction:ltr;">Firebase Error: ' + error.message + '</div>';
      });
    };

    A.init();
  }
  init();
})();
