const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97G_KILL_LEGACY -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-kill-legacy-v97g">
(function(){
  'use strict';
  console.log('[V97G] killing legacy cat_manager UI...');
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 200) { console.warn('[V97G] timeout'); return; }
    if(typeof window.activateCatMgrUI !== 'function' || !window.catMgrApp) {
      return setTimeout(hook, 100);
    }
    if(window.__v97gReady) return;
    window.__v97gReady = true;

    // استبدال كامل: لا استدعاء للنسخة القديمة أبداً
    window.activateCatMgrUI = function(category){
      console.log('[V97G] intercepted, opening catMgrApp for:', category);
      var u = window.FB && window.FB.currentUser;
      if(!u){
        console.warn('[V97G] no user');
        return;
      }
      var name = 'مدير قسم';
      try {
        if(u.displayName) name = u.displayName;
        else if(u.email) name = u.email.split('@')[0];
      } catch(e){}

      // إخفاء أي عناصر قديمة قد تكون موجودة
      ['cm-app','cat-mgr-legacy','cm-legacy','cat_manager_ui'].forEach(function(id){
        var el = document.getElementById(id);
        if(el) el.style.display = 'none';
      });

      // فتح اللوحة الجديدة
      window.catMgrApp.init({
        uid: u.uid,
        role: 'cat_manager',
        name: name,
        assignedCategory: category
      });
    };

    console.log('[V97G] legacy UI killed, catMgrApp active');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97g patched. size:', h.length);
