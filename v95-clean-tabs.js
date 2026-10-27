const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-clean-v95')) { console.log('already'); process.exit(0); }

const js = `
<style id="chz-clean-v95-css">
/* Hide period tabs when on new tabs */
#accountant-mgr-app.v95-on-new .ca-period-tabs,
#accountant-mgr-app.v95-on-new .ca-period-bar,
#accountant-mgr-app.v95-on-new [class*="period"]:not([class*="ca-nav"]) {
  display: none !important;
}

/* Hide body content wrappers when period tabs are hidden */
#accountant-mgr-app.v95-on-new > .ca-period-wrap,
#accountant-mgr-app.v95-on-new > div:has(> .ca-period-tabs) {
  display: none !important;
}
</style>

<script id="chz-clean-v95">
(function(){
  'use strict';
  
  var NEW_TABS = ['products', 'employees', 'advances', 'report'];
  var currentTab = 'overview';
  
  function updateLayout(tab) {
    currentTab = tab;
    var app = document.getElementById('accountant-mgr-app');
    if (!app) return;
    
    var isNewTab = NEW_TABS.indexOf(tab) > -1;
    if (isNewTab) {
      app.classList.add('v95-on-new');
    } else {
      app.classList.remove('v95-on-new');
    }
    
    // Find and hide period bar containers specifically
    hidePeriodBar(isNewTab, app);
    
    console.log('[v95] tab:', tab, '| new:', isNewTab);
  }
  
  function hidePeriodBar(hide, app) {
    // Find period tab elements
    var periodCandidates = app.querySelectorAll('div, section');
    periodCandidates.forEach(function(el) {
      // Check if this element contains period buttons (اليوم، الشهر، الأسبوع، كل)
      var text = el.textContent || '';
      var hasPeriodText = (text.indexOf('اليوم') > -1 && text.indexOf('الشهر') > -1 && text.indexOf('الأسبوع') > -1);
      var childCount = el.children.length;
      
      // Period bar is usually a short bar with 3-4 buttons
      if (hasPeriodText && childCount >= 3 && childCount <= 6) {
        // Check it's not the nav bar
        if (!el.classList.contains('ca-nav-bar')) {
          el.style.display = hide ? 'none' : '';
          el.setAttribute('data-v95-period', hide ? 'hidden' : 'visible');
        }
      }
    });
  }
  
  // Patch __caSwitchTab (guarded)
  var orig = window.__caSwitchTab;
  if (orig && !orig._v95) {
    window.__caSwitchTab = function(tab, btn) {
      var r = orig.call(this, tab, btn);
      setTimeout(function() { updateLayout(tab); }, 30);
      return r;
    };
    window.__caSwitchTab._v95 = true;
  }
  
  // Observe tab clicks directly
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.ca-nav-btn');
    if (!btn) return;
    var tab = btn.getAttribute('data-tab');
    if (tab) {
      setTimeout(function() { updateLayout(tab); }, 50);
    }
  }, true);
  
  // Initial setup — after 3s
  setTimeout(function() {
    if (document.getElementById('accountant-mgr-app')) {
      updateLayout('overview');
    }
  }, 3000);
  
  // When accountant opens, set default
  setTimeout(function() {
    if (document.getElementById('accountant-mgr-app')) {
      updateLayout('overview');
    }
  }, 6000);
  
  console.log('[v95] period tab hider ready');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v95 installed');
