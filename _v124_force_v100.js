const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v124 = `
<style id="v124-css">
/* إجبار لوحة مدير القسم على الظهور فوق أي واجهة قديمة */
#cat-mgr-app { display: block !important; z-index: 9999999 !important; }
#am { display: none !important; } /* إخفاء لوحة الإدارة القديمة */
</style>

<script id="v124-js">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.A || !window.A.checkAdmin) return setTimeout(hook, 100);
    if(window.__v124Ready) return;
    window.__v124Ready = true;

    var origCheck = window.A.checkAdmin;
    
    // اعتراض دالة الفحص
    window.A.checkAdmin = async function(u) {
      try {
        var db = firebase.firestore();
        var userSnap = await db.collection('users').doc(u.uid).get();
        if (userSnap.exists) {
          var ud = userSnap.data();
          // إذا كان "مدير قسم"، نشغل لوحتنا الجديدة ونمنع الكود القديم
          if (ud.role === 'cat_manager') {
            document.getElementById('gs').style.display = 'none';
            document.getElementById('am').style.display = 'none';
            if (window.catMgrApp && window.catMgrApp.init) {
              window.catMgrApp.init(Object.assign({uid: u.uid}, ud));
            }
            return; // 🛑 إيقاف الكود القديم هنا
          }
        }
      } catch(e) { console.warn('v124 route error', e); }
      
      // إذا كان سوبر أدمن، يعمل الكود القديم بشكل طبيعي
      return origCheck(u);
    };
    console.log('[V124] Router fixed: v100 forced for cat_manager');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v124 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v124 لإجبار لوحة v100');
