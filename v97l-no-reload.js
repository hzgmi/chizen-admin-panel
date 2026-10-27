const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97L_NO_RELOAD -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-login-v97l">
(function(){
  'use strict';
  console.log('[V97L] clean login — no reload');

  function getAuth(){
    if(window.FB && window.FB.auth) return window.FB.auth;
    if(window.firebase && typeof window.firebase.auth === 'function') return window.firebase.auth();
    return null;
  }
  function setMsg(txt, isErr){
    var m = document.getElementById('v97h-msg');
    if(!m) return;
    m.textContent = txt || '';
    m.className = 'v97h-msg' + (txt ? (isErr ? ' err' : ' ok') : '');
  }

  document.addEventListener('click', async function(e){
    if(!e.target || e.target.id !== 'v97h-submit') return;
    e.preventDefault();
    e.stopImmediatePropagation();

    var em = document.getElementById('v97h-email');
    var pw = document.getElementById('v97h-password');
    var btn = e.target;
    var origText = btn.textContent;

    var email = em ? em.value.trim() : '';
    var pass = pw ? pw.value : '';
    if(!email || !pass){ setMsg('⚠️ أدخل البريد وكلمة المرور', true); return; }

    var auth = getAuth();
    if(!auth){ setMsg('⚠️ Firebase غير جاهز — انتظر 3 ثوان وأعد المحاولة', true); return; }

    btn.disabled = true;
    btn.textContent = '⏳ جاري التحقق...';
    setMsg('', false);

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      btn.textContent = '✅ تم';
      setMsg('✅ جاري فتح اللوحة...', false);

      // انتظر currentUser يُملأ
      var w = 0;
      var iv = setInterval(function(){
        w++;
        var u = auth.currentUser;
        if(u){ clearInterval(iv); _finish(u); }
        else if(w > 30){
          clearInterval(iv);
          btn.disabled = false; btn.textContent = origText;
          setMsg('❌ الجلسة لم تُنشأ — أعد المحاولة', true);
        }
      }, 100);
    } catch(err) {
      btn.disabled = false; btn.textContent = origText;
      var msg = 'فشل الدخول';
      var c = err.code || '';
      if(c === 'auth/wrong-password' || c === 'auth/invalid-credential' || c === 'auth/invalid-login-credentials') msg = 'كلمة المرور خاطئة';
      else if(c === 'auth/user-not-found') msg = 'البريد غير مسجل';
      else if(c === 'auth/too-many-requests') msg = 'محاولات كثيرة — حاول بعد دقيقة';
      else if(c === 'auth/network-request-failed') msg = 'مشكلة اتصال';
      else if(err.message) msg = err.message;
      setMsg('❌ ' + msg, true);
      console.error('[V97L]', err);
    }
  }, true);

  function _finish(u){
    console.log('[V97L] finish:', u.uid, u.email);
    var ov = document.getElementById('v97h-login');
    if(ov) ov.style.display = 'none';
    if(ov) ov.classList.add('v97i-hidden');

    setTimeout(function(){
      try {
        if(window.FB && typeof window.FB.checkAdmin === 'function'){
          console.log('[V97L] calling checkAdmin...');
          window.FB.checkAdmin(u);
        } else {
          console.warn('[V97L] checkAdmin missing');
        }
      } catch(e){
        console.error('[V97L] checkAdmin threw:', e);
        if(ov){ ov.classList.remove('v97i-hidden'); ov.style.display = 'flex'; }
        setMsg('❌ ' + (e.message || 'خطأ غير معروف'), true);
      }
    }, 100);
  }
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97l patched. size:', h.length);
