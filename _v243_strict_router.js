const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// احتياطياً: حذف v242 القديم
h = h.replace(/<script id="v242-router">[\s\S]*?<\/script>/g, '');

const v243 = `
<script id="v243-router">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.A || !window.A.checkAdmin) return setTimeout(hook, 100);
    if(window.__v243Ready) return;
    window.__v243Ready = true;

    var origCheck = window.A.checkAdmin;
    window.A.checkAdmin = async function(u) {
      if (!u) return;
      try {
        var db = firebase.firestore();
        var userSnap = await db.collection('users').doc(u.uid).get();
        if (userSnap.exists) {
          var ud = userSnap.data();
          
          // 1. مدير قسم: عرض v100 حصراً، منع الواجهة القديمة
          if (ud.role === 'cat_manager') {
            var am = document.getElementById('am'); if(am) am.style.setProperty('display','none','important');
            var gs = document.getElementById('gs'); if(gs) gs.style.setProperty('display','none','important');
            
            if (window.catMgrApp && window.catMgrApp.init) {
              window.catMgrApp.init(Object.assign({uid: u.uid}, ud));
            }
            return; // 🛑 STOP: لا نستدعي الكود القديم
          }
          
          // 2. سوبر أدمن: تحويل للوحة الحديثة dashboard.html
          if (ud.role === 'super_admin' || (firebase.auth().currentUser && firebase.auth().currentUser.email === 'hazimchat@gmail.com')) {
            origCheck(u); // تشغيل القديم لإعداد الجلسة
            setTimeout(function(){
              window.location.href = 'dashboard.html';
            }, 500);
            return;
          }
        }
      } catch(e) {
        console.warn('[V243] checkAdmin failed:', e);
      }
      return origCheck(u);
    };
    console.log('[V243] Strict router active');
  }
  hook();
})();
</script>
`;

h = h.replace('</body>', v243 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v243: راوتر صارم (cat_manager→v100, super_admin→dashboard)');
