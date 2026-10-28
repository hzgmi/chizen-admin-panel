const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// البحث عن v245-override الكامل
const v245Re = /<script id="v245-override">([\s\S]*?)<\/script>/;
const match = h.match(v245Re);
if (!match) { console.log('❌ v245 not found'); process.exit(1); }

const v245New = `<script id="v245-override">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.A || typeof window.A.checkAdmin !== 'function') return setTimeout(hook, 100);
    if(window.__v245Ready) return;
    window.__v245Ready = true;

    var origCheck = window.A.checkAdmin;
    
    window.A.checkAdmin = async function(u) {
      if (!u) return;
      try {
        var db = firebase.firestore();
        var userSnap = await db.collection('users').doc(u.uid).get();
        if (!userSnap.exists) return origCheck.call(this, u);
        
        var ud = userSnap.data();
        var role = ud.role;
        
        // 👑 super_admin → dashboard.html
        if (role === 'super_admin') {
          try { origCheck.call(this, u); } catch(e){}
          setTimeout(function(){ window.location.href = 'dashboard.html'; }, 400);
          return;
        }
        
        // 🏷️ cat_manager → v100
        if (role === 'cat_manager') {
          var gs = document.getElementById('gs'); if(gs) gs.style.setProperty('display','none','important');
          var am = document.getElementById('am'); if(am) am.style.setProperty('display','none','important');
          var accApp = document.getElementById('accountant-mgr-app'); if(accApp) accApp.style.setProperty('display','none','important');
          
          if (window.catMgrApp && window.catMgrApp.init) {
            window.catMgrApp.init(Object.assign({uid: u.uid}, ud));
          }
          return;
        }
        
        // 💼 accountant → تفعيل اللوحة الأصلية فقط
        if (role === 'accountant') {
          var gs = document.getElementById('gs'); if(gs) gs.style.setProperty('display','none','important');
          var am = document.getElementById('am'); if(am) am.style.setProperty('display','none','important');
          var catApp = document.getElementById('cat-mgr-app'); if(catApp) catApp.style.setProperty('display','none','important');
          
          // استدعاء الدالة الأصلية (موجودة داخل chz-dedicated-accountant)
          if (typeof window.activateAccountantUI === 'function') {
            window.activateAccountantUI();
            console.log('[V288] ✅ activateAccountantUI called for accountant');
          } else {
            // انتظر حتى تُعرّف
            setTimeout(function(){
              if (typeof window.activateAccountantUI === 'function') {
                window.activateAccountantUI();
              }
            }, 800);
          }
          return;
        }
        
        // 🚚 delivery_mgr, 📅 bookings_mgr → لوحاتهم الأصلية
        if (role === 'delivery_mgr' || role === 'bookings_mgr') {
          return origCheck.call(this, u);
        }
        
        // عميل → لا شيء
      } catch(e) {
        console.warn('[V288] checkAdmin error:', e);
        try { origCheck.call(this, u); } catch(_){}
      }
    };
    console.log('[V288] Router installed');
  }
  hook();
})();
</script>`;

h = h.replace(v245Re, v245New);
fs.writeFileSync('index.html', h);
console.log('✅ v288b: router rewritten |', before, '->', h.length);
