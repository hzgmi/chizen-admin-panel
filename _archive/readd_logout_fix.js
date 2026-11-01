const fs = require('fs');
const p = 'index.html';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('chz-catmgr-logout-fix')) {
  console.log('SKIP: already exists');
  process.exit(0);
}

const script = `<script id="chz-catmgr-logout-fix">
(function(){
  'use strict';
  console.log('[CATMGR-LOGOUT] installing...');
  
  // دالة logout بديلة للوحة القسم
  window.__catmgrLogout = function() {
    if (!confirm('تسجيل الخروج؟')) return;
    var app = document.getElementById('cat-mgr-app');
    if (app) app.style.opacity = '0.3';
    try { if (window.FB && FB.logout) FB.logout(); } catch(e) {}
    try { firebase.auth().signOut(); } catch(e) {}
    try { localStorage.clear(); } catch(e) {}
    try { sessionStorage.clear(); } catch(e) {}
    setTimeout(function() {
      window.location.href = window.location.pathname + '?logout=' + Date.now();
    }, 300);
  };
  
  // استبدال كل زر logout في #cat-mgr-app
  function patchLogoutButtons() {
    var app = document.getElementById('cat-mgr-app');
    if (!app) return;
    var buttons = app.querySelectorAll('[onclick*="A.logout"], [onclick*="APP.logout"]');
    buttons.forEach(function(btn) {
      if (btn.__patched) return;
      btn.__patched = true;
      btn.setAttribute('onclick', 'window.__catmgrLogout()');
      console.log('[CATMGR-LOGOUT] patched:', btn.textContent.trim());
    });
  }
  
  // تشغيل بعد activateCatMgrUI
  if (window.activateCatMgrUI) {
    var orig = window.activateCatMgrUI;
    window.activateCatMgrUI = async function(category) {
      await orig.call(this, category);
      setTimeout(patchLogoutButtons, 100);
      setTimeout(patchLogoutButtons, 500);
    };
  }
  
  // تشغيل دوري خفيف (بدون Observer)
  setInterval(patchLogoutButtons, 2000);
  
  // تشغيل فوري
  setTimeout(patchLogoutButtons, 1000);
  
  console.log('[CATMGR-LOGOUT] ready');
})();
</script>`;

const bi = s.lastIndexOf('</body>');
if (bi === -1) { console.error('FAIL: </body>'); process.exit(1); }
s = s.slice(0, bi) + script + '\n' + s.slice(bi);

fs.writeFileSync(p, s);
console.log('✅ أُعيد إضافة chz-catmgr-logout-fix');
