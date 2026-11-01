const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97B_OVERRIDE -->';
if (h.includes(MARKER)) { console.log('already patched'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<style id="v97b-theme">
#cat-mgr-app {
  --bg: #0a0825 !important;
  --card: #151b3a !important;
  --border: rgba(168,85,247,0.3) !important;
  --muted: #9ca3af !important;
  background: var(--bg) !important;
  color: #fff !important;
}
#cat-mgr-app .cm-header { background: var(--bg) !important; }
#cat-mgr-app .cm-header h2 { color: #fff; }
#cat-mgr-app .cm-kpi { color: #fff; }
#cat-mgr-app .cm-kpi b { color: #a855f7; }
#cat-mgr-app .cm-item-info b { color: #fff; }
#cat-mgr-app .cm-product-info b { color: #fff; }
#cat-mgr-app .cm-order-head b { color: #a855f7; }
#cat-mgr-app .cm-reason { color: #fff !important; background: #0a0825 !important; }
</style>
<script id="chz-catmgr-override-v97b">
(function(){
  'use strict';
  console.log('[V97B] cat manager override loading...');
  var attempts = 0;
  function hook() {
    attempts++;
    if (attempts > 200) { console.warn('[V97B] timeout waiting'); return; }
    if (typeof window.activateCatMgrUI !== 'function' || !window.catMgrApp) {
      return setTimeout(hook, 100);
    }
    var orig = window.activateCatMgrUI;
    window.activateCatMgrUI = function(category) {
      var u = window.FB && window.FB.currentUser;
      if (!u) {
        console.warn('[V97B] no user, fallback');
        return orig.call(this, category);
      }
      var name = 'مدير قسم';
      try {
        if (u.displayName) name = u.displayName;
        else if (u.email) name = u.email.split('@')[0];
      } catch(e) {}
      console.log('[V97B] redirect to catMgrApp for', category);
      window.catMgrApp.init({
        uid: u.uid,
        role: 'cat_manager',
        name: name,
        assignedCategory: category
      });
    };
    console.log('[V97B] activateCatMgrUI replaced');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97b patched. size:', h.length);
