const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v118 = `
<script id="v118-bypass">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.FB || !window.FB.checkAdmin) return setTimeout(hook, 100);
    if(window.__v118Ready) return;
    window.__v118Ready = true;

    var origCheckAdmin = window.FB.checkAdmin;
    var db = firebase.firestore();

    window.FB.checkAdmin = async function(u) {
      try {
        var doc = await db.collection('users').doc(u.uid).get();
        if(doc.exists && doc.data().role === 'cat_manager') {
           document.getElementById('v110-overlay').style.display = 'none';
           document.getElementById('gb').style.display = 'none';
           if(window.catMgrApp && window.catMgrApp.init) {
             window.catMgrApp.init(Object.assign({uid: u.uid}, doc.data()));
           }
           return; // منع الكود القديم من تسجيل الخروج
        }
      } catch(e) {
        console.warn('[V118] cat_manager check failed', e);
      }
      
      // إذا لم يكن مدير قسم، استخدم الكود القديم (للـ super_admin)
      return origCheckAdmin(u);
    };
    console.log('[V118] checkAdmin patched safely');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v118 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن v118 لاعتراض الطرد');
