const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف v243 (كان مجرد محاولة)
h = h.replace(/<script id="v243-router">[\s\S]*?<\/script>/g, '');

const v244 = `
<script id="v244-enforcer">
(function(){
  console.log('[V244] Enforcer active');
  
  var checks = 0;
  var maxChecks = 20; // 20 × 800ms = 16 ثانية
  var redirecting = false;
  var initFired = false;
  
  function enforce(){
    checks++;
    
    var u = firebase && firebase.auth && firebase.auth().currentUser;
    if (!u) {
      if (checks >= maxChecks) clearInterval(intervalId);
      return;
    }
    
    firebase.firestore().collection('users').doc(u.uid).get().then(function(doc){
      if (!doc.exists) return;
      var data = doc.data();
      var role = data.role || 'customer';
      
      if (role === 'cat_manager') {
        // 🔒 إخفاء الإدارة القديمة
        var am = document.getElementById('am');
        if (am) am.style.setProperty('display', 'none', 'important');
        var gs = document.getElementById('gs');
        if (gs) gs.style.setProperty('display', 'none', 'important');
        
        // 🔓 إظهار لوحة مدير القسم
        var app = document.getElementById('cat-mgr-app');
        if (app) {
          app.style.setProperty('display', 'block', 'important');
          app.style.setProperty('z-index', '999999', 'important');
          app.style.setProperty('position', 'fixed', 'important');
          app.style.setProperty('inset', '0', 'important');
          app.style.setProperty('overflow-y', 'auto', 'important');
          app.style.setProperty('background', '#0a0825', 'important');
          
          // إن كان فارغاً، شغّل init مرة واحدة
          if (app.children.length === 0 && !initFired) {
            initFired = true;
            setTimeout(function(){
              if (window.catMgrApp && window.catMgrApp.init) {
                window.catMgrApp.init(Object.assign({uid: u.uid}, data));
              }
            }, 50);
          }
        }
      } else if (role === 'super_admin') {
        // تحويل لـ dashboard.html
        if (location.pathname.indexOf('dashboard.html') === -1 && !redirecting) {
          redirecting = true;
          setTimeout(function(){ window.location.href = 'dashboard.html'; }, 400);
        }
      }
      
      // توقف بعد 16 ثانية
      if (checks >= maxChecks) clearInterval(intervalId);
    }).catch(function(e){
      if (checks >= maxChecks) clearInterval(intervalId);
    });
  }
  
  var intervalId = setInterval(enforce, 800);
  setTimeout(enforce, 2500);
})();
</script>
`;

h = h.replace('</body>', v244 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v244: Enforcer (يضمن الحالة الصحيحة كل 800ms لمدة 16s)');
