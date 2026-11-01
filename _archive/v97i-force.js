const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97I2_FORCE -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<style id="v97i2-css">
#v97h-login { display:flex !important; z-index:2147483647 !important; }
#v97h-login.v97i-hidden { display:none !important; }
.gtt, .gbtn, #btn-do-login { display:none !important; }
[data-v97i2-old-hidden] { display:none !important; }
</style>
<script id="chz-force-v97i2">
(function(){
  'use strict';
  console.log('[V97I2] forcing new login');
  function hideOldLogin(){
    var hidden = 0;
    var candidates = document.querySelectorAll('[id*="login" i], [class*="login" i], [id*="auth" i], [class*="auth" i]');
    candidates.forEach(function(el){
      if(el.id === 'v97h-login') return;
      if(el.closest && el.closest('#v97h-login')) return;
      if(el.closest && el.closest('#cat-mgr-app')) return;
      if(el.offsetWidth > 0 && el.offsetHeight > 0){
        el.style.setProperty('display','none','important');
        el.setAttribute('data-v97i2-old-hidden','1');
        hidden++;
      }
    });
    var all = document.querySelectorAll('body > div, body > section, body > main');
    all.forEach(function(el){
      if(el.id === 'v97h-login') return;
      if(el.id === 'cat-mgr-app') return;
      if(el.hasAttribute('data-v97i2-old-hidden')) return;
      var txt = (el.textContent || '').substring(0, 500);
      if(txt.indexOf('لوحة محمية') !== -1 || txt.indexOf('سجل دخول بحسابك') !== -1){
        el.style.setProperty('display','none','important');
        el.setAttribute('data-v97i2-old-hidden','1');
        hidden++;
      }
    });
    return hidden;
  }
  var overlay = document.getElementById('v97h-login');
  if(overlay){ overlay.classList.remove('v97i-hidden'); overlay.style.display = 'flex'; }
  hideOldLogin();
  var ticks = 0;
  var iv = setInterval(function(){ ticks++; hideOldLogin(); if(ticks > 20) clearInterval(iv); }, 250);
  function checkAuth(){
    var auth = null;
    if(window.FB && window.FB.auth) auth = window.FB.auth;
    else if(window.firebase && window.firebase.auth) auth = window.firebase.auth();
    if(!auth) return setTimeout(checkAuth, 300);
    auth.onAuthStateChanged(function(user){
      var ov = document.getElementById('v97h-login');
      if(!ov) return;
      if(user){ ov.classList.add('v97i-hidden'); }
      else { ov.classList.remove('v97i-hidden'); ov.style.display = 'flex'; }
    });
  }
  checkAuth();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97i2 patched. size:', h.length);
