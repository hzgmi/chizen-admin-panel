const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-force-navbar-v91')) { console.log('already'); process.exit(0); }

const css = `<style id="chz-force-navbar-v91">
/* ═══ FORCE: Accountant Nav Bar Horizontal ═══ */
#accountant-mgr-app .ca-nav-bar,
#accountant-mgr-app > [class*="ca-nav"] {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: stretch !important;
  gap: 6px !important;
  padding: 8px 10px !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: none !important;
  background: rgba(15,10,35,0.98) !important;
  border-bottom: 1px solid rgba(168,85,247,0.15) !important;
  white-space: nowrap !important;
  height: auto !important;
  min-height: 60px !important;
  max-height: 70px !important;
  box-sizing: border-box !important;
  position: relative !important;
  z-index: 10 !important;
}
#accountant-mgr-app .ca-nav-bar::-webkit-scrollbar { display: none !important; height: 0 !important; }
#accountant-mgr-app .ca-nav-bar::after { display: none !important; }

/* Force all nav buttons in one row */
#accountant-mgr-app .ca-nav-btn {
  flex: 0 0 auto !important;
  display: inline-flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 3px !important;
  padding: 8px 12px !important;
  min-width: 62px !important;
  max-width: 85px !important;
  height: auto !important;
  min-height: 44px !important;
  border-radius: 10px !important;
  background: rgba(168,85,247,0.06) !important;
  border: 1.5px solid transparent !important;
  cursor: pointer !important;
  -webkit-tap-highlight-color: transparent !important;
  transition: all 0.15s ease !important;
  position: relative !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  float: none !important;
  clear: none !important;
}

#accountant-mgr-app .ca-nav-btn::after { display: none !important; }

#accountant-mgr-app .ca-nav-btn .icon {
  font-size: 17px !important;
  line-height: 1 !important;
  display: block !important;
  margin: 0 !important;
}

#accountant-mgr-app .ca-nav-btn .label {
  font-size: 9px !important;
  font-weight: 800 !important;
  color: #9ca3af !important;
  line-height: 1.1 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  margin: 0 !important;
}

#accountant-mgr-app .ca-nav-btn.active {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  border-color: #f59e0b !important;
  color: #fff !important;
}

#accountant-mgr-app .ca-nav-btn.active .label {
  color: #fff !important;
}

#accountant-mgr-app .ca-nav-btn.active .icon {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)) !important;
}

#accountant-mgr-app .ca-nav-btn:active {
  transform: scale(0.94) !important;
}

/* Ensure content panels don't overflow */
#accountant-mgr-app [id^="ca-content-"] {
  display: none !important;
  padding: 12px !important;
  margin: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
  clear: both !important;
  position: relative !important;
}

#accountant-mgr-app [id^="ca-content-"].v91-shown {
  display: block !important;
}

/* Prevent breaking layout */
#accountant-mgr-app > * {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Mobile responsive */
@media (max-width: 400px) {
  #accountant-mgr-app .ca-nav-btn {
    min-width: 55px !important;
    padding: 7px 8px !important;
  }
  #accountant-mgr-app .ca-nav-btn .icon { font-size: 15px !important; }
  #accountant-mgr-app .ca-nav-btn .label { font-size: 8px !important; }
}

/* Ensure period bar (اليوم/أسبوع/شهر) stays separate */
#accountant-mgr-app .ca-period-tabs,
#accountant-mgr-app [class*="period-tab"] {
  position: relative !important;
  z-index: 9 !important;
  background: rgba(15,10,35,0.98) !important;
  border-bottom: 1px solid rgba(168,85,247,0.1) !important;
  padding: 6px 10px !important;
  overflow-x: auto !important;
  display: flex !important;
  gap: 6px !important;
  white-space: nowrap !important;
}
</style>

<script id="chz-force-navbar-v91">
(function(){
  'use strict';
  console.log('[v91] force navbar loading...');
  
  var attempts = 0;
  
  function forceLayout() {
    attempts++;
    if (attempts > 50) {
      console.warn('[v91] gave up after 50 attempts');
      return;
    }
    
    var app = document.getElementById('accountant-mgr-app');
    if (!app) {
      return setTimeout(forceLayout, 300);
    }
    
    // 1. Find or create nav bar
    var navBar = app.querySelector('.ca-nav-bar');
    if (!navBar) {
      // Try to find the parent of all ca-nav-btn
      var allBtns = app.querySelectorAll('.ca-nav-btn');
      if (allBtns.length > 0) {
        navBar = allBtns[0].parentElement;
        if (navBar) navBar.classList.add('ca-nav-bar');
      }
    }
    
    if (!navBar) {
      return setTimeout(forceLayout, 300);
    }
    
    // 2. Move ALL ca-nav-btns to be children of navBar
    var allButtons = app.querySelectorAll('.ca-nav-btn');
    var moved = 0;
    allButtons.forEach(function(btn) {
      if (btn.parentElement !== navBar) {
        navBar.appendChild(btn);
        moved++;
      }
    });
    if (moved > 0) console.log('[v91] moved', moved, 'buttons to nav bar');
    
    // 3. Ensure all content panels are direct children of app (not nested)
    var contentPanels = app.querySelectorAll('[id^="ca-content-"]');
    var repositioned = 0;
    contentPanels.forEach(function(panel) {
      if (panel.parentElement !== app) {
        app.appendChild(panel);
        repositioned++;
      }
    });
    if (repositioned > 0) console.log('[v91] repositioned', repositioned, 'content panels');
    
    // 4. Ensure nav bar has proper class
    if (!navBar.classList.contains('ca-nav-bar')) {
      navBar.classList.add('ca-nav-bar');
    }
    
    // 5. Show only active content
    var activeBtn = navBar.querySelector('.ca-nav-btn.active');
    var activeTab = activeBtn ? activeBtn.getAttribute('data-tab') : null;
    
    contentPanels.forEach(function(panel) {
      var panelTab = panel.id.replace('ca-content-', '');
      if (panelTab === activeTab) {
        panel.classList.add('v91-shown');
        panel.style.display = 'block';
      } else {
        panel.classList.remove('v91-shown');
        panel.style.display = 'none';
      }
    });
    
    // 6. Patch switch tab once
    if (!window.__caSwitchTab._v91) {
      var origSwitch = window.__caSwitchTab;
      if (origSwitch) {
        window.__caSwitchTab = function(tab, btn) {
          origSwitch.call(this, tab, btn);
          setTimeout(function() {
            document.querySelectorAll('[id^="ca-content-"]').forEach(function(p) {
              var pt = p.id.replace('ca-content-', '');
              if (pt === tab) {
                p.classList.add('v91-shown');
                p.style.display = 'block';
              } else {
                p.classList.remove('v91-shown');
                p.style.display = 'none';
              }
            });
            // Also call custom renderers
            if (tab === 'employees' && window.__caRenderEmployees) window.__caRenderEmployees();
            if (tab === 'advances' && window.__caRenderAdvances) window.__caRenderAdvances();
            if (tab === 'report' && window.__caRenderReport) window.__caRenderReport();
            if (tab === 'products' && window.__v88RenderProductsTab) window.__v88RenderProductsTab();
          }, 30);
        };
        window.__caSwitchTab._v91 = true;
        console.log('[v91] switchTab patched');
      }
    }
    
    // 7. Add missing buttons
    var expectedTabs = ['overview', 'orders', 'bookings', 'products', 'suppliers', 'debts', 'reports', 'employees', 'advances', 'report'];
    var existingTabs = {};
    navBar.querySelectorAll('.ca-nav-btn').forEach(function(b) {
      existingTabs[b.getAttribute('data-tab')] = true;
    });
    
    var tabsInfo = {
      'employees': { icon: '👥', label: 'الموظفون' },
      'advances': { icon: '💳', label: 'التقدمات' },
      'report': { icon: '📈', label: 'تقرير' }
    };
    
    Object.keys(tabsInfo).forEach(function(key) {
      if (!existingTabs[key]) {
        var btn = document.createElement('button');
        btn.className = 'ca-nav-btn';
        btn.setAttribute('data-tab', key);
        btn.setAttribute('onclick', 'window.__caSwitchTab(\\'' + key + '\\', this)');
        btn.innerHTML = '<span class="icon">' + tabsInfo[key].icon + '</span><span class="label">' + tabsInfo[key].label + '</span>';
        navBar.appendChild(btn);
        console.log('[v91] added', key, 'button');
      }
    });
    
    console.log('[v91] ✓ layout fixed (attempt', attempts + ')');
  }
  
  // Observer to keep fixing on DOM changes
  function startObserver() {
    if (!document.body) {
      setTimeout(startObserver, 300);
      return;
    }
    var observer = new MutationObserver(function(muts) {
      var needsFix = false;
      muts.forEach(function(m) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          m.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && 
                (node.classList?.contains('ca-nav-btn') || 
                 node.id?.startsWith('ca-content-'))) {
              needsFix = true;
            }
          });
        }
      });
      if (needsFix) {
        attempts = 0;
        setTimeout(forceLayout, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[v91] observer started');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(forceLayout, 1000);
      setTimeout(forceLayout, 2500);
      startObserver();
    });
  } else {
    setTimeout(forceLayout, 1000);
    setTimeout(forceLayout, 2500);
    startObserver();
  }
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + css + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v91 force navbar installed');
console.log('size:', h.length);
