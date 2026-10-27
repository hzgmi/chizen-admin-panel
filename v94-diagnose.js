const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-diag-v94')) { console.log('already'); process.exit(0); }

const js = `
<style id="chz-diag-v94-css">
#v94-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.92);
  z-index: 2147483647;
  padding: 20px;
  display: none;
  flex-direction: column;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #10b981;
  line-height: 1.7;
  direction: ltr;
}
#v94-panel.show { display: flex; }
#v94-panel h2 {
  color: #f59e0b;
  margin: 0 0 12px;
  font-size: 16px;
  direction: rtl;
}
#v94-panel .ok { color: #10b981; }
#v94-panel .missing { color: #ef4444; font-weight: bold; }
#v94-panel .warn { color: #f59e0b; }
#v94-panel .info { color: #60a5fa; }
#v94-panel pre {
  background: rgba(16,185,129,0.08);
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #10b981;
  margin: 8px 0;
  white-space: pre-wrap;
  word-break: break-all;
}
#v94-panel .close-x {
  position: fixed;
  top: 8px;
  right: 8px;
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  z-index: 2147483648;
}
#v94-panel .fix-btn {
  display: block;
  width: 100%;
  padding: 14px;
  margin: 16px 0;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}
#v94-panel .fix-btn:active { transform: scale(0.97); }
</style>

<div id="v94-panel">
  <button class="close-x" onclick="document.getElementById('v94-panel').classList.remove('show')">✕ إغلاق</button>
  <h2>🔍 تشخيص أزرار المحاسب</h2>
  <div id="v94-content">جاري الفحص...</div>
</div>

<button id="v94-trigger" onclick="document.getElementById('v94-panel').classList.add('show')" style="position:fixed;bottom:80px;left:10px;z-index:999998;background:#a855f7;color:#fff;border:none;padding:8px 12px;border-radius:20px;font-size:11px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(168,85,247,0.4);">🔍 تشخيص</button>

<script id="chz-diag-v94">
(function(){
  'use strict';
  
  var EXPECTED = [
    { key: 'overview', icon: '📊', label: 'عامة', group: 'original' },
    { key: 'orders', icon: '🛒', label: 'الطلبات', group: 'original' },
    { key: 'bookings', icon: '✈️', label: 'الحجوزات', group: 'original' },
    { key: 'products', icon: '📦', label: 'المنتجات', group: 'new' },
    { key: 'suppliers', icon: '🏢', label: 'الموردين', group: 'original' },
    { key: 'debts', icon: '💳', label: 'الديون', group: 'original' },
    { key: 'reports', icon: '📈', label: 'تقارير', group: 'original' },
    { key: 'employees', icon: '👥', label: 'الموظفون', group: 'new' },
    { key: 'advances', icon: '💳', label: 'التقدمات', group: 'new' },
    { key: 'report', icon: '📈', label: 'تقرير', group: 'new' }
  ];
  
  function findNavBar() {
    var app = document.getElementById('accountant-mgr-app');
    if (!app) return null;
    var navBar = app.querySelector('.ca-nav-bar');
    if (!navBar) {
      var btns = app.querySelectorAll('.ca-nav-btn');
      if (btns.length) navBar = btns[0].parentElement;
    }
    return navBar;
  }
  
  function diagnose() {
    var content = document.getElementById('v94-content');
    if (!content) return;
    
    var app = document.getElementById('accountant-mgr-app');
    var lines = [];
    
    lines.push('<h3 style="color:#f59e0b">📊 التقرير</h3>');
    
    if (!app) {
      lines.push('<p class="missing">❌ لوحة المحاسب غير مفتوحة</p>');
      lines.push('<p class="info">افتح لوحة المحاسب أولاً ثم أعد الفحص</p>');
      content.innerHTML = lines.join('');
      return;
    }
    
    lines.push('<p class="ok">✅ لوحة المحاسب موجودة</p>');
    
    var navBar = findNavBar();
    if (!navBar) {
      lines.push('<p class="missing">❌ لم أجد شريط التنقل (ca-nav-bar)</p>');
      lines.push('<p class="info">سيتم محاولة الإصلاح تلقائياً</p>');
      content.innerHTML = lines.join('');
      return;
    }
    
    lines.push('<p class="ok">✅ شريط التنقل موجود</p>');
    lines.push('<p class="info">عدد الأزرار في الشريط: ' + navBar.querySelectorAll('.ca-nav-btn').length + '</p>');
    
    // Get current tabs
    var current = [];
    var currentLabels = [];
    navBar.querySelectorAll('.ca-nav-btn').forEach(function(b) {
      var tab = b.getAttribute('data-tab');
      if (tab) {
        current.push(tab);
        var lbl = b.querySelector('.label');
        currentLabels.push(tab + ' (' + (lbl ? lbl.textContent : '?') + ')');
      }
    });
    
    lines.push('<pre><b>الموجود فعلاً (' + current.length + '):</b>\\n' + currentLabels.join('\\n') + '</pre>');
    
    // Check missing
    var missing = [];
    EXPECTED.forEach(function(exp) {
      if (current.indexOf(exp.key) === -1) {
        missing.push(exp);
      }
    });
    
    if (missing.length > 0) {
      lines.push('<p class="missing">❌ مفقود (' + missing.length + '):</p>');
      missing.forEach(function(m) {
        lines.push('<div class="missing">  • ' + m.icon + ' ' + m.label + ' (' + m.key + ') [' + m.group + ']</div>');
      });
      
      lines.push('<button class="fix-btn" onclick="window.__v94Fix()">🔧 إصلاح الأزرار المفقودة الآن</button>');
    } else {
      lines.push('<p class="ok">✅ كل الأزرار موجودة (' + EXPECTED.length + ')</p>');
    }
    
    // Check for extras (tabs not in EXPECTED)
    var extras = [];
    current.forEach(function(c) {
      var found = EXPECTED.find(function(e) { return e.key === c; });
      if (!found) extras.push(c);
    });
    
    if (extras.length > 0) {
      lines.push('<p class="warn">⚠️ أزرار إضافية غير معروفة: ' + extras.join(', ') + '</p>');
    }
    
    // Check for orphan buttons (outside navBar)
    var allBtns = app.querySelectorAll('.ca-nav-btn');
    var orphans = 0;
    allBtns.forEach(function(b) {
      if (b.parentElement !== navBar && !b.classList.contains('ca-nav-btn-v92-hidden')) {
        orphans++;
      }
    });
    if (orphans > 0) {
      lines.push('<p class="warn">⚠️ يوجد ' + orphans + ' زر خارج الشريط (orphan)</p>');
      lines.push('<button class="fix-btn" onclick="window.__v94CleanOrphans()">🧹 حذف الأزرار الزائدة</button>');
    }
    
    content.innerHTML = lines.join('');
  }
  
  window.__v94Fix = function() {
    var navBar = findNavBar();
    if (!navBar) { alert('لم أجد الشريط'); return; }
    
    // Remove old hidden buttons
    document.querySelectorAll('.ca-nav-btn-v92-hidden').forEach(function(b) { b.remove(); });
    
    // Add all missing
    var existing = {};
    navBar.querySelectorAll('.ca-nav-btn').forEach(function(b) {
      existing[b.getAttribute('data-tab')] = true;
    });
    
    var added = 0;
    EXPECTED.forEach(function(exp) {
      if (existing[exp.key]) return;
      
      var btn = document.createElement('button');
      btn.className = 'ca-nav-btn';
      btn.setAttribute('data-tab', exp.key);
      btn.setAttribute('onclick', 'window.__caSwitchTab(\\'' + exp.key + '\\', this)');
      btn.innerHTML = '<span class="icon">' + exp.icon + '</span><span class="label">' + exp.label + '</span>';
      navBar.appendChild(btn);
      added++;
    });
    
    // Ensure content panels exist
    var app = document.getElementById('accountant-mgr-app');
    EXPECTED.forEach(function(exp) {
      if (exp.group === 'new') {
        var id = 'ca-content-' + exp.key;
        if (!document.getElementById(id) && app) {
          var panel = document.createElement('div');
          panel.id = id;
          panel.className = 'v93-content';
          panel.style.cssText = 'display:none;padding:12px;';
          app.appendChild(panel);
        }
      }
    });
    
    alert('✅ تمت إضافة ' + added + ' زر');
    setTimeout(diagnose, 300);
  };
  
  window.__v94CleanOrphans = function() {
    var navBar = findNavBar();
    if (!navBar) return;
    var app = document.getElementById('accountant-mgr-app');
    var removed = 0;
    app.querySelectorAll('.ca-nav-btn').forEach(function(b) {
      if (b.parentElement !== navBar) {
        b.remove();
        removed++;
      }
    });
    alert('✅ تم حذف ' + removed + ' زر زائد');
    setTimeout(diagnose, 300);
  };
  
  // Auto-run when opening accountant
  var origSwitch = window.__caSwitchTab;
  if (origSwitch && !origSwitch._v94) {
    window.__caSwitchTab = function(tab, btn) {
      var r = origSwitch.call(this, tab, btn);
      setTimeout(diagnose, 500);
      return r;
    };
    window.__caSwitchTab._v94 = true;
  }
  
  // Auto-diagnose after 3s (once on page load)
  setTimeout(function() {
    if (document.getElementById('accountant-mgr-app')) {
      diagnose();
    }
  }, 3000);
  
  console.log('[v94] diagnostic loaded — press 🔍 button bottom-left');
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + js + '\n' + h.slice(bodyEnd);
fs.writeFileSync(p, h);
console.log('✅ v94 diagnostic installed');
console.log('Size:', h.length);
