const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. إخفاء الشاشة القديمة نهائياً بالـ CSS
const css = `
<style id="v120-css">
#gb { display: none !important; }
</style>
`;
if (!h.includes('id="v120-css"')) {
  h = h.replace('</head>', css + '\n</head>');
}

// 2. سكربت الدخول القسري
const v120 = `
<script id="v120-js">
(function(){
  document.addEventListener('DOMContentLoaded', function() {
    // ننتظر حتى يتم تحميل Firebase
    setTimeout(function() {
      var btn = document.getElementById('v110-btn');
      if (!btn) return;

      // استبدال حدث الضغط على الزر بالكامل
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function() {
        var email = document.getElementById('v110-email').value.trim();
        var pass = document.getElementById('v110-pass').value;
        var err = document.getElementById('v110-err');
        
        if(!email || !pass) { err.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }
        
        newBtn.disabled = true; newBtn.textContent = '⏳ جاري الدخول...'; err.textContent = '';
        
        firebase.auth().signInWithEmailAndPassword(email, pass)
          .then(async function(userCred) {
            var user = userCred.user;
            var db = firebase.firestore();
            var doc = await db.collection('users').doc(user.uid).get();
            
            var overlay = document.getElementById('v110-overlay');
            if(overlay) overlay.style.setProperty('display', 'none', 'important');
            
            if (doc.exists && doc.data().role === 'cat_manager') {
               // إذا كان مدير قسم: افتح اللوحة البنفسجية
               var catApp = document.getElementById('cat-mgr-app');
               if(catApp) catApp.style.setProperty('display', 'block', 'important');
               if(window.catMgrApp && window.catMgrApp.init) {
                 window.catMgrApp.init(Object.assign({uid: user.uid}, doc.data()));
               }
            } else {
               // إذا كان سوبر أدمن: افتح لوحة الإدارة العامة
               var gb = document.getElementById('gb');
               if(gb) gb.style.setProperty('display', 'block', 'important');
               if(window.FB && window.FB.checkAdmin) {
                  window.FB.checkAdmin(user);
               }
            }
          })
          .catch(function(error) {
            newBtn.disabled = false; newBtn.textContent = '🔓 تسجيل الدخول';
            err.textContent = '❌ خطأ: ' + (error.message || 'تحقق من البيانات');
          });
      });

      // دعم زر Enter
      document.getElementById('v110-pass').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') newBtn.click();
      });
      
    }, 1000);
  });
})();
</script>
`;

// حذف السكربتات القديمة التي تسبب المشكلة
h = h.replace(/<script id="v119-smart-login">[\s\S]*?<\/script>/g, '');
h = h.replace(/<script id="v118-bypass">[\s\S]*?<\/script>/g, '');

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v120 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v120 للتوجيه القسري');
