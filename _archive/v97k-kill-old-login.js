const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97K_KILL_OLD_LOGIN -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-kill-old-login-v97k">
(function(){
  'use strict';
  console.log('[V97K] killing old loginScreen...');

  function hook(){
    if(!window.FB || typeof window.FB.loginScreen !== 'function'){
      return setTimeout(hook, 100);
    }
    if(window.__v97kReady) return;
    window.__v97kReady = true;

    // استبدال جسم الدالة القديمة
    window.FB.loginScreen = function(){
      var gb = document.getElementById('gb');
      if(gb) gb.innerHTML = '';
      var ov = document.getElementById('v97h-login');
      if(ov){
        ov.classList.remove('v97i-hidden');
        ov.style.display = 'flex';
      }
      var em = document.getElementById('v97h-email');
      if(em) setTimeout(function(){ try{ em.focus(); }catch(e){} }, 100);
      console.log('[V97K] loginScreen → new overlay');
    };

    // gateMsg أيضاً — بعض الحالات تستخدمها
    window.FB.gateMsg = function(){
      var gb = document.getElementById('gb');
      if(gb) gb.innerHTML = '';
      var ov = document.getElementById('v97h-login');
      if(ov){
        ov.classList.remove('v97i-hidden');
        ov.style.display = 'flex';
      }
    };

    // مسح أي واجهة قديمة مرسومة بالفعل
    var gb = document.getElementById('gb');
    if(gb) gb.innerHTML = '';
    ['btn-do-login','login-email','login-pass','login-err'].forEach(function(id){
      var el = document.getElementById(id);
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });

    console.log('[V97K] old UI wiped, override active');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97k patched. size:', h.length);
