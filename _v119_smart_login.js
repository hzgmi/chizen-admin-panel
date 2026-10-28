const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v119 = `
<script id="v119-smart-login">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.firebase || !window.firebase.auth) return setTimeout(hook, 100);
    if(window.__v119Ready) return;
    window.__v119Ready = true;

    // 1. إصلاح زر الدخول: منع إعادة تحميل الصفحة، والسماح للمراقب بالعمل
    if(window.v110_login) {
      window.v110_login = function() {
        var email = document.getElementById('v110-email').value.trim();
        var pass = document.getElementById('v110-pass').value;
        var btn = document.getElementById('v110-btn');
        var err = document.getElementById('v110-err');
        if(!email || !pass) { err.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }
        
        btn.disabled = true; btn.textContent = '⏳ جاري الدخول...'; err.textContent = '';
        
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
          .then(function() { return firebase.auth().signInWithEmailAndPassword(email, pass); })
          .then(function() {
             btn.textContent = '✅ تم الدخول';
             // لا نقوم بعمل reload هنا! المراقب (onAuthStateChanged) سيتولى إظهار اللوحة
          })
          .catch(function(error) {
            btn.disabled = false; btn.textContent = '🔓 تسجيل الدخول';
            err.textContent = '❌ خطأ: ' + (error.message || 'تحقق من البيانات');
          });
      };
    }

    // 2. المراقب الذكي: التعرف على "مدير القسم" وتوجيهه فوراً
    firebase.auth().onAuthStateChanged(async function(user) {
      if (!user) return;
      try {
        var db = firebase.firestore();
        var doc = await db.collection('users').doc(user.uid).get();
        
        if (doc.exists && doc.data().role === 'cat_manager') {
           // إخفاء شاشة الدخول
           var overlay = document.getElementById('v110-overlay');
           if(overlay) overlay.style.setProperty('display', 'none', 'important');
           
           // إخفاء واجهة الإدارة العامة (السوبر أدمن)
           var gb = document.getElementById('gb');
           if(gb) gb.style.setProperty('display', 'none', 'important');
           
           // إظهار لوحة مدير القسم (v100)
           var catApp = document.getElementById('cat-mgr-app');
           if(catApp) catApp.style.display = 'block';
           
           // تشغيل بيانات اللوحة
           if(window.catMgrApp && window.catMgrApp.init) {
             window.catMgrApp.init(Object.assign({uid: user.uid}, doc.data()));
           }
        } else {
           // إذا كان سوبر أدمن أو غيره، نترك الأكواد القديمة تعمل (لأننا لم نخفِ gb)
           if (window.FB && typeof window.FB.checkAdmin === 'function') {
              // السماح للنظام القديم بالعمل
           }
        }
      } catch(e) { console.warn('[V119] Routing error:', e); }
    });

    // 3. تعطيل "الطرد" القديم (checkAdmin) لمديري الأقسام فقط
    if (window.FB && window.FB.checkAdmin) {
      var origCheck = window.FB.checkAdmin;
      window.FB.checkAdmin = async function(u) {
        var db = firebase.firestore();
        var doc = await db.collection('users').doc(u.uid).get();
        if(doc.exists && doc.data().role === 'cat_manager') {
           return; // نتجاهل الكود القديم لأنه يطردهم
        }
        return origCheck(u);
      };
    }
    console.log('[V119] Smart routing active.');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v119 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v119 للتوجيه الذكي');
