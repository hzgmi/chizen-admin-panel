const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-autofix-v92')) { console.log('already'); process.exit(0); }

const js = `
<style id="chz-autofix-v92-css">
/* ═══ v92: FORCE rebuild nav ═══ */
#accountant-mgr-app .ca-nav-bar-v92 {
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
  height: 64px !important;
  min-height: 64px !important;
  max-height: 64px !important;
  box-sizing: border-box !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 100 !important;
  order: -1 !important;
}
#accountant-mgr-app .ca-nav-bar-v92::-webkit-scrollbar { display: none !important; }

#accountant-mgr-app .ca-nav-bar-v92 .ca-nav-btn {
  flex: 0 0 auto !important;
  display: inline-flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 3px !important;
  padding: 6px 10px !important;
  min-width: 60px !important;
  max-width: 82px !important;
  height: auto !important;
  min-height: 46px !important;
  border-radius: 10px !important;
  background: rgba(168,85,247,0.06) !important;
  border: 1.5px solid transparent !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  position: relative !important;
  box-sizing: border-box !important;
  white-space: nowrap !important;
  float: none !important;
  clear: none !important;
  order: 0 !important;
}

#accountant-mgr-app .ca-nav-btn-v92-hidden {
  display: none !important;
}

#accountant-mgr-app .ca-nav-bar-v92 .ca-nav-btn .icon {
  font-size: 16px !important;
  line-height: 1 !important;
  margin: 0 !important;
}

#accountant-mgr-app .ca-nav-bar-v92 .ca-nav-btn .label {
  font-size: 8.5px !important;
  font-weight: 800 !important;
  color: #9ca3af !important;
  line-height: 1.1 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  margin: 0 !important;
}

#accountant-mgr-app .ca-nav-bar-v92 .ca-nav-btn.active {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  border-color: #f59e0b !important;
}
#accountant-mgr-app .ca-nav-bar-v92 .ca-nav-btn.active .label {
  color: #fff !important;
}

/* Force content stacking */
#accountant-mgr-app [id^="ca-content-"] {
  display: none !important;
  padding: 12px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  clear: both !important;
  order: 2 !important;
}
#accountant-mgr-app [id^="ca-content-"].v92-visible {
  display: block !important;
}

#accountant-mgr-app {
  display: flex !important;
  flex-direction: column !important;
}

/* Debug panel */
#v92-debug-panel {
  position: fixed;
  top: 60px;
  right: 10px;
  left: 10px;
  background: rgba(0,0,0,0.95);
  color: #10b981;
  font-family: monospace;
  font-size: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #10b981;
  z-index: 999999;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.5;
  display: none;
}
#v92-debug-panel.show { display: block; }
#v92-debug-panel h3 { color: #f59e0b; margin: 0 0 6px; font-size: 12px; }
#v92-debug-panel .ok { color: #10b981; }
#v92-debug-panel .err { color: #ef4444; }
#v92-debug-panel .warn { color: #f59e0b; }
#v92-debug-panel .close-btn {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  cursor: pointer;
}
</style>

<div id="v92-debug-panel">
  <button class="close-btn" onclick="document.getElementById('v92-debug-panel').classList.remove('show')">✕</button>
  <h3>🔧 v92 — تقرير الإصلاح</h3>
  <div id="v92-debug-content">جاري الفحص...</div>
</div>

<script id="chz-autofix-v92">
(function(){
  'use strict';
  console.log('[v92] auto-fix starting...');
  
  var debugEl = document.getElementById('v92-debug-content');
  var logLines = [];
  function log(msg, type) {
    var prefix = type === 'err' ? '❌ ' : (type === 'warn' ? '⚠️ ' : '✓ ');
    var cls = type === 'err' ? 'err' : (type === 'warn' ? 'warn' : 'ok');
    logLines.push('<div class="' + cls + '">' + prefix + msg + '</div>');
    if (debugEl) debugEl.innerHTML = logLines.join('');
    console.log('[v92]', msg);
  }
  
  function showDebug() {
    var panel = document.getElementById('v92-debug-panel');
    if (panel) panel.classList.add('show');
  }
  
  // ═══ MAIN FIX ═══
  function fixNow() {
    logLines = [];
    log('بدء الفحص والإصلاح...');
    
    var app = document.getElementById('accountant-mgr-app');
    if (!app) {
      log('لم أجد لوحة المحاسب — تأكد من فتحها', 'err');
      setTimeout(fixNow, 1000);
      return false;
    }
    log('لوحة المحاسب موجودة ✓');
    
    // 1. Count current state
    var oldButtons = app.querySelectorAll('.ca-nav-btn');
    var oldContents = app.querySelectorAll('[id^="ca-content-"]');
    log('عدد الأزرار قبل: ' + oldButtons.length);
    log('عدد محتويات قبل: ' + oldContents.length);
    
    // 2. Find or create nav bar
    var navBar = app.querySelector('.ca-nav-bar-v92');
    if (!navBar) {
      navBar = document.createElement('div');
      navBar.className = 'ca-nav-bar ca-nav-bar-v92';
      // Insert as first child
      app.insertBefore(navBar, app.firstChild);
      log('إنشاء شريط جديد');
    } else {
      log('شريط موجود — إعادة استخدامه');
    }
    
    // 3. Collect all tab definitions (merge with existing buttons' data)
    var tabDefinitions = {};
    
    // From existing buttons
    oldButtons.forEach(function(btn) {
      var tab = btn.getAttribute('data-tab');
      if (!tab) return;
      var iconEl = btn.querySelector('.icon');
      var labelEl = btn.querySelector('.label');
      tabDefinitions[tab] = {
        icon: iconEl ? iconEl.textContent : '📋',
        label: labelEl ? labelEl.textContent : tab,
        active: btn.classList.contains('active')
      };
    });
    log('عدد التبويبات الموجودة: ' + Object.keys(tabDefinitions).length);
    
    // Add missing known tabs
    var knownTabs = {
      'overview': { icon: '📊', label: 'عامة' },
      'orders': { icon: '🛒', label: 'الطلبات' },
      'bookings': { icon: '✈️', label: 'الحجوزات' },
      'products': { icon: '📦', label: 'المنتجات' },
      'suppliers': { icon: '🏢', label: 'الموردين' },
      'debts': { icon: '💳', label: 'الديون' },
      'reports': { icon: '📈', label: 'تقارير' },
      'employees': { icon: '👥', label: 'الموظفون' },
      'advances': { icon: '💳', label: 'التقدمات' },
      'report': { icon: '📈', label: 'تقرير' }
    };
    
    Object.keys(knownTabs).forEach(function(tab) {
      if (!tabDefinitions[tab]) {
        tabDefinitions[tab] = { icon: knownTabs[tab].icon, label: knownTabs[tab].label, active: false };
        log('إضافة تبويب مفقود: ' + tab, 'warn');
      }
    });
    
    // Ensure at least one active
    var hasActive = false;
    Object.keys(tabDefinitions).forEach(function(k) { if (tabDefinitions[k].active) hasActive = true; });
    if (!hasActive) {
      tabDefinitions['overview'].active = true;
    }
    
    // 4. Clear navBar and rebuild
    navBar.innerHTML = '';
    var tabOrder = ['overview', 'orders', 'bookings', 'products', 'suppliers', 'debts', 'reports', 'employees', 'advances', 'report'];
    var sortedTabs = tabOrder.filter(function(t) { return tabDefinitions[t]; });
    // Add any unknown tabs at end
    Object.keys(tabDefinitions).forEach(function(t) {
      if (tabOrder.indexOf(t) === -1) sortedTabs.push(t);
    });
    
    var activeTab = 'overview';
    sortedTabs.forEach(function(tab) {
      var def = tabDefinitions[tab];
      var btn = document.createElement('button');
      btn.className = 'ca-nav-btn' + (def.active ? ' active' : '');
      btn.setAttribute('data-tab', tab);
      btn.setAttribute('onclick', 'window.__caSwitchTab(\\'' + tab + '\\', this)');
      btn.innerHTML = '<span class="icon">' + def.icon + '</span><span class="label">' + def.label + '</span>';
      navBar.appendChild(btn);
      if (def.active) activeTab = tab;
    });
    log('تم إنشاء ' + sortedTabs.length + ' أزرار');
    
    // 5. Hide OLD buttons that were outside navBar (mark them)
    oldButtons.forEach(function(btn) {
      if (btn.parentElement !== navBar) {
        btn.classList.add('ca-nav-btn-v92-hidden');
        btn.style.display = 'none';
      }
    });
    
    // 6. Move all content panels to be direct children of app
    oldContents.forEach(function(content) {
      if (content.parentElement !== app) {
        app.appendChild(content);
      }
      // Hide all
      content.classList.remove('v92-visible');
      content.style.display = 'none';
    });
    
    // 7. Show active content
    var activeContent = app.querySelector('#ca-content-' + activeTab);
    if (activeContent) {
      activeContent.classList.add('v92-visible');
      activeContent.style.display = 'block';
      log('محتوى "' + activeTab + '" مرئي');
    } else {
      log('محتوى "' + activeTab + '" غير موجود — إنشاء container', 'warn');
      var newContent = document.createElement('div');
      newContent.id = 'ca-content-' + activeTab;
      newContent.classList.add('v92-visible');
      newContent.style.cssText = 'padding:12px;display:block;';
      app.appendChild(newContent);
    }
    
    // 8. Patch __caSwitchTab
    if (!window.__caSwitchTab._v92) {
      var orig = window.__caSwitchTab;
      window.__caSwitchTab = function(tab, btn) {
        // Hide all
        app.querySelectorAll('[id^="ca-content-"]').forEach(function(c) {
          c.classList.remove('v92-visible');
          c.style.display = 'none';
        });
        // Show target
        var target = document.getElementById('ca-content-' + tab);
        if (!target) {
          target = document.createElement('div');
          target.id = 'ca-content-' + tab;
          target.style.cssText = 'padding:12px;';
          app.appendChild(target);
        }
        target.classList.add('v92-visible');
        target.style.display = 'block';
        
        // Update button active
        navBar.querySelectorAll('.ca-nav-btn').forEach(function(b) {
          b.classList.toggle('active', b.getAttribute('data-tab') === tab);
        });
        
        // Call original
        try { orig.call(this, tab, btn); } catch(e) {}
        
        // Render custom tabs
        setTimeout(function() {
          if (tab === 'employees' && window.__caRenderEmployees) window.__caRenderEmployees();
          if (tab === 'advances' && window.__caRenderAdvances) window.__caRenderAdvances();
          if (tab === 'report' && window.__caRenderReport) window.__caRenderReport();
          if (tab === 'products' && window.__v88RenderProductsTab) window.__v88RenderProductsTab();
        }, 50);
      };
      window.__caSwitchTab._v92 = true;
      log('التبديل بين التبويبات مفعّل');
    }
    
    log('✅ الإصلاح اكتمل!', 'ok');
    
    // Show debug panel briefly
    showDebug();
    setTimeout(function() {
      var panel = document.getElementById('v92-debug-panel');
      if (panel) panel.classList.remove('show');
    }, 8000);
    
    return true;
  }
  
  // Wait for app to load
  var tries = 0;
  function tryFix() {
    tries++;
    if (tries > 60) { console.warn('[v92] gave up'); return; }
    
    var app = document.getElementById('accountant-mgr-app');
    if (!app) {
      setTimeout(tryFix, 500);
      return;
    }
    
    var fixed = fixNow();
    if (!fixed) {
      setTimeout(tryFix, 500);
    }
  }
  
  // Watch for changes (in case accountant panel is destroyed/recreated)
  function startObserver() {
    if (!document.body) { setTimeout(startObserver, 500); return; }
    new MutationObserver(function(muts) {
      var needs = false;
      muts.forEach(function(m) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(function(n) {
            if (n.nodeType === 1) {
              if (n.id === 'accountant-mgr-app' ||
                  (n.classList && n.classList.contains('ca-nav-btn')) ||
                  (n.id && n.id.indexOf('ca-content-') === 0)) {
                needs = true;
              }
            }
          });
        }
      });
      if (needs) {
        setTimeout(fixNow, 200);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  
  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(tryFix, 1000);
      startObserver();
    });
  } else {
    setTimeout(tryFix, 1000);
    startObserver();
  }
  setTimeout(tryFix, 3000);
  setTimeout(tryFix, 6000);
  
  console.log('[v92] ready');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v92 auto-fix + visual debug installed');
console.log('size:', h.length);
