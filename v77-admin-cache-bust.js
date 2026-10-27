const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('chz-admin-cache-v77')) { console.log('already'); process.exit(0); }

const headStart = h.indexOf('<head>');
if (headStart === -1) { console.log('❌ no head'); process.exit(1); }
const insertPos = headStart + 6;

const cacheBust = `
<!-- ═══ Admin Cache Buster v77 ═══ -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<script id="chz-admin-cache-v77">
(function(){
  var VERSION = 'admin-v77';
  var STORED = 'chizen_admin_version';
  var prevVersion = null;
  try { prevVersion = localStorage.getItem(STORED); } catch(e) {}
  if (prevVersion && prevVersion !== VERSION) {
    console.log('[admin cache-bust]', prevVersion, '→', VERSION);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(r){ r.unregister(); });
      });
    }
    if ('caches' in window) {
      caches.keys().then(function(keys){
        keys.forEach(function(k){ caches.delete(k); });
      });
    }
  }
  try { localStorage.setItem(STORED, VERSION); } catch(e) {}
})();
</script>
`;

h = h.slice(0, insertPos) + cacheBust + h.slice(insertPos);

fs.writeFileSync(p, h);
console.log('✅ admin cache buster added');
console.log('size:', before, '->', h.length);
