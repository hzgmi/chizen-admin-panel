const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v284-accountant-activate"')) { console.log('already applied'); process.exit(0); }

const v284 = `
<script id="v284-accountant-activate">
(function(){
  var tries = 0;
  function activate(){
    tries++;
    if (tries > 60) return;
    
    var u = firebase && firebase.auth && firebase.auth().currentUser;
    if (!u) return setTimeout(activate, 500);
    
    firebase.firestore().collection('users').doc(u.uid).get().then(function(doc){
      if (!doc.exists) return;
      var role = doc.data().role;
      
      if (role !== 'accountant') return; // ليس محاسباً — تجاهل
      
      console.log('[V284] Activating accountant panel for:', u.email);
      
      // 1. أوقف v245 (الذي يحوّل لـ dashboard.html)
      window.__v245Ready = true; // يمنع تشغيل router
      
      // 2. أخفِ كل الواجهات الأخرى
      var gs = document.getElementById('gs'); if(gs) gs.style.display = 'none';
      var am = document.getElementById('am'); if(am) am.style.display = 'none';
      var catApp = document.getElementById('cat-mgr-app'); if(catApp) catApp.style.display = 'none';
      
      // 3. فعّل لوحة المحاسب
      var app = document.getElementById('accountant-mgr-app');
      if (!app) {
        // انتظر إنشاء اللوحة
        setTimeout(function(){
          var app2 = document.getElementById('accountant-mgr-app');
          if (app2) {
            app2.classList.add('active');
            app2.style.display = 'flex';
            console.log('[V284] Panel activated (retry)');
          }
        }, 1000);
        return;
      }
      
      app.classList.add('active');
      app.style.display = 'flex';
      app.style.zIndex = '999999';
      app.style.position = 'fixed';
      app.style.inset = '0';
      
      console.log('[V284] ✅ Accountant panel activated');
    }).catch(function(e){
      console.warn('[V284] error:', e);
    });
  }
  
  // ابدأ بعد 2 ثانية (بعد تحميل كل شيء)
  setTimeout(activate, 2000);
  // + دعم محاولة ثانية
  setTimeout(activate, 4000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
if (bodyEnd === -1) { console.log('❌ </body> not found'); process.exit(1); }
h = h.slice(0, bodyEnd) + v284 + h.slice(bodyEnd);

fs.writeFileSync('index.html', h);
console.log('✅ v284: accountant panel activation |', before, '->', h.length);
