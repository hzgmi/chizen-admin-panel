const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v289-isolate"')) { console.log('already'); process.exit(0); }

const v289 = `
<style id="v289-css">
/* عزل تام: عند وضع المحاسب، أخفِ كل nav-bars إلا لوحة المحاسب */
body.v289-accountant-mode .ca-nav {
  display: none !important;
}
body.v289-accountant-mode #accountant-mgr-app .ca-nav {
  display: flex !important;
}
/* إخفاء أي زر زائد داخل nav المحاسب */
body.v289-accountant-mode #accountant-mgr-app .ca-nav .ca-nav-btn[data-v289-extra="1"] {
  display: none !important;
}
</style>
<script id="v289-isolate">
(function(){
  var applied = false;
  function isolate(){
    if (applied) return;
    
    var accApp = document.getElementById('accountant-mgr-app');
    if (!accApp) return;
    
    // فقط عند تفعيل لوحة المحاسب
    if (!accApp.classList.contains('active') && accApp.style.display !== 'flex') return;
    
    applied = true;
    console.log('[V289] Isolating accountant panel...');
    
    document.body.classList.add('v289-accountant-mode');
    
    // 1. احذف أي زر زائد في accountant nav
    var accNav = accApp.querySelector('.ca-nav');
    if (accNav) {
      var btns = accNav.querySelectorAll('.ca-nav-btn');
      var allowedTabs = ['overview', 'orders', 'bookings', 'suppliers', 'debts', 'reports'];
      var seen = {};
      btns.forEach(function(b){
        var tab = b.getAttribute('data-tab');
        if (allowedTabs.indexOf(tab) === -1) {
          // زر ليس للمحاسب
          b.setAttribute('data-v289-extra', '1');
          b.style.display = 'none';
          console.log('[V289] Hidden extra btn:', tab);
        } else if (seen[tab]) {
          // مكرر
          b.setAttribute('data-v289-extra', '1');
          b.style.display = 'none';
          console.log('[V289] Hidden duplicate:', tab);
        } else {
          seen[tab] = true;
        }
      });
    }
    
    // 2. أخفِ nav bars أي لوحة أخرى
    var allNavs = document.querySelectorAll('.ca-nav');
    var hidden = 0;
    allNavs.forEach(function(nav){
      if (!nav.closest('#accountant-mgr-app')) {
        nav.style.setProperty('display', 'none', 'important');
        hidden++;
      }
    });
    console.log('[V289] Hidden nav bars:', hidden);
    
    // 3. فعّل كل أزرار المحاسب الصحيحة (تنظيف الديسپلاي)
    if (accNav) {
      accNav.querySelectorAll('.ca-nav-btn:not([data-v289-extra])').forEach(function(b){
        b.style.display = '';
      });
    }
    
    console.log('[V289] ✅ Isolation complete');
  }
  
  // راقب ظهور اللوحة
  setInterval(isolate, 500);
  setTimeout(isolate, 2000);
  setTimeout(isolate, 4000);
  
  // عند الخروج، أزل العزل
  window.addEventListener('beforeunload', function(){
    document.body.classList.remove('v289-accountant-mode');
  });
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + v289 + h.slice(bodyEnd);

fs.writeFileSync('index.html', h);
console.log('✅ v289: isolation |', before, '->', h.length);
