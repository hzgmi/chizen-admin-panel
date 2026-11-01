const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97D_LOGOUT -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-catmgr-logout-v97d">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 100) return;
    if(!window.catMgrApp) return setTimeout(hook, 100);
    if(window.__v97dReady) return;
    window.__v97dReady = true;

    window.catMgrApp.back = function(){
      if(!confirm('🚪 تسجيل الخروج من لوحة مدير القسم؟')) return;
      try {
        var auth = null;
        if(window.FB && window.FB.auth) auth = window.FB.auth;
        else if(window.firebase && window.firebase.auth) auth = window.firebase.auth();
        if(auth && auth.signOut){
          auth.signOut().then(function(){ location.reload(); }).catch(function(e){
            alert('فشل: ' + (e.message || 'خطأ'));
          });
        } else {
          location.reload();
        }
      } catch(e){ alert('فشل: ' + (e.message || 'خطأ')); }
    };

    setTimeout(function(){
      document.querySelectorAll('.cm-back').forEach(function(b){
        b.textContent = '🚪 خروج';
        b.style.fontSize = '12px';
        b.style.padding = '8px 14px';
        b.style.fontWeight = '700';
        b.style.color = '#ef4444';
        b.style.borderColor = '#ef4444';
      });
    }, 300);

    console.log('[V97D] logout ready');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97d patched. size:', h.length);
