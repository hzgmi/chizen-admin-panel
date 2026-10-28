const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف السكربت إن وجد
h = h.replace(/<script id="v242-router">[\s\S]*?<\/script>/g, '');

const v242 = `
<script id="v242-router">
(function(){
  console.log('[V242] Smart router active');
  
  var fired = false;
  function route(){
    if (fired) return;
    var u = firebase.auth().currentUser;
    if (!u) return;
    
    fired = true;
    
    firebase.firestore().collection('users').doc(u.uid).get().then(function(doc){
      var role = doc.exists ? (doc.data().role || 'customer') : 'customer';
      console.log('[V242] role:', role);
      
      // 🔑 التوجيه الذكي
      if (role === 'super_admin') {
        // سوبر أدمن → dashboard.html (اللوحة الحديثة)
        setTimeout(function(){
          window.location.href = 'dashboard.html';
        }, 800);
      } else if (role === 'cat_manager') {
        // مدير قسم → لوحة v100
        hideAdminPanel();
        showCatManager();
      }
    }).catch(function(e){
      console.warn('[V242] role check failed:', e);
    });
  }
  
  function hideAdminPanel(){
    var am = document.getElementById('am');
    if (am) am.style.display = 'none';
    var gs = document.getElementById('gs');
    if (gs) gs.style.display = 'none';
  }
  
  function showCatManager(){
    var app = document.getElementById('cat-mgr-app');
    if (app) {
      app.style.display = 'block';
      app.style.zIndex = '999999';
      app.style.position = 'fixed';
      app.style.inset = '0';
      app.style.overflowY = 'auto';
      app.style.background = '#0a0825';
    }
  }
  
  // نراقب حالة الدخول
  var tries = 0;
  var interval = setInterval(function(){
    tries++;
    if (tries > 60) { clearInterval(interval); return; }
    if (!window.firebase || !firebase.auth || !firebase.auth().currentUser) return;
    clearInterval(interval);
    setTimeout(route, 500);
  }, 200);
})();
</script>
`;

h = h.replace('</body>', v242 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v242: Smart Router added');
