const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف v244 القديم
h = h.replace(/<script id="v244-enforcer">[\s\S]*?<\/script>/g, '');

const v245 = `
<script id="v245-override">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.A || typeof window.A.access !== 'function') return setTimeout(hook, 100);
    if(window.__v245Ready) return;
    window.__v245Ready = true;

    var origAccess = window.A.access;
    window.A.access = function(u) {
      // مدير القسم: تجاوز A.access تماماً، عرض v100 فقط
      if (window.CURRENT_ROLE === 'cat_manager') {
        try {
          var gs = document.getElementById('gs'); if(gs) gs.style.setProperty('display','none','important');
          var am = document.getElementById('am'); if(am) am.style.setProperty('display','none','important');
          var app = document.getElementById('cat-mgr-app');
          if (app) {
            app.style.setProperty('display','block','important');
            app.style.setProperty('position','fixed','important');
            app.style.setProperty('inset','0','important');
            app.style.setProperty('z-index','999999','important');
            app.style.setProperty('overflow-y','auto','important');
            app.style.setProperty('background','#0a0825','important');
          }
          var db = firebase.firestore();
          db.collection('users').doc(u.uid).get().then(function(doc){
            if (doc.exists && window.catMgrApp && window.catMgrApp.init) {
              window.catMgrApp.init(Object.assign({uid: u.uid}, doc.data()));
            }
          }).catch(function(e){ console.warn('[V245] init:', e); });
        } catch(e) { console.warn('[V245]', e); }
        return; // 🛑 منع الاستدعاء الأصلي
      }
      // بقية الأدوار: استخدم A.access الأصلي
      return origAccess.call(this, u);
    };
    console.log('[V245] A.access overridden — cat_manager routes to v100');
  }
  hook();
})();
</script>
`;

h = h.replace('</body>', v245 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v245: A.access overridden');
