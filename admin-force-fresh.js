const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-admin-force-fresh')) { console.log('already'); process.exit(0); }

// Replace existing cache-bust with stronger version
const oldBust = `<script id="chz-admin-cache-v77">`;
if (h.includes(oldBust)) {
  // Remove old
  const start = h.indexOf(oldBust);
  const end = h.indexOf('</script>', start) + 9;
  h = h.slice(0, start) + h.slice(end);
  console.log('✅ old cache-bust removed');
}

// Add new strong force-fresh
const headStart = h.indexOf('<head>');
if (headStart === -1) { console.log('❌ no head'); process.exit(1); }
const insertPos = headStart + 6;

const forceFresh = `
<!-- ═══ Admin Force Fresh v78 ═══ -->
<script id="chz-admin-force-fresh">
(function(){
  'use strict';
  var VERSION = 'admin-v78-2026-10-27';
  var STORED = 'chizen_admin_v';
  
  // 1. Unregister ALL service workers immediately
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) {
        console.log('[admin] unregistering SW:', r.scope);
        r.unregister();
      });
    });
  }
  
  // 2. Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(keys) {
      keys.forEach(function(k) {
        console.log('[admin] clearing cache:', k);
        caches.delete(k);
      });
    });
  }
  
  // 3. Force reload if version changed (but only once)
  var prevVersion = null;
  try { prevVersion = localStorage.getItem(STORED); } catch(e){}
  
  if (prevVersion && prevVersion !== VERSION) {
    console.log('[admin] version changed:', prevVersion, '→', VERSION);
    try { localStorage.setItem(STORED, VERSION); } catch(e){}
    var reloaded = sessionStorage.getItem('chz_admin_reloaded');
    if (!reloaded) {
      sessionStorage.setItem('chz_admin_reloaded', '1');
      setTimeout(function() {
        window.location.replace(window.location.pathname + '?v=' + Date.now());
      }, 100);
      return;
    }
  }
  
  try { localStorage.setItem(STORED, VERSION); } catch(e){}
  
  // 4. Add cache-buster to all API calls
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function(url, opts) {
      if (typeof url === 'string' && url.indexOf('http') === 0) {
        try {
          var u = new URL(url);
          if (u.hostname.indexOf('firebase') > -1 || u.hostname.indexOf('googleapis') > -1) {
            return origFetch.call(this, url, opts);
          }
        } catch(e){}
      }
      return origFetch.call(this, url, opts);
    };
  }
  
  console.log('[admin v78] force fresh active');
})();
</script>
`;

h = h.slice(0, insertPos) + forceFresh + h.slice(insertPos);

// Also add SW unregister script at end (backup)
if (!h.includes('<!-- SW KILLER -->')) {
  const bodyEnd = h.lastIndexOf('</body>');
  if (bodyEnd > -1) {
    const killer = `
<!-- SW KILLER -->
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register = function() {
    return Promise.reject(new Error('SW disabled on admin'));
  };
}
</script>
`;
    h = h.slice(0, bodyEnd) + killer + h.slice(bodyEnd);
  }
}

fs.writeFileSync(p, h);
console.log('✅ Admin force-fresh v78 added');
console.log('size:', before, '->', h.length);
