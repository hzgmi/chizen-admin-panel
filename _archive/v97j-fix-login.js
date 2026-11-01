const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97J_FIX_LOGIN -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-fix-login-v97j">
(function(){
  'use strict';
  console.log('[V97J] fixing login submit...');

  function getAuth(){
    if(window.FB && window.FB.auth) return window.FB.auth;
    if(window.firebase && window.firebase.auth) return window.firebase.auth();
    return null;
  }

  function showMsg(text, type){
    var m = document.getElementById('v97h-msg');
    if(!m) return;
    m.textContent = text || '';
    m.className = 'v97h-msg' + (text ? (' ' + type) : '');
  }

  function bindSubmit(){
    var btn = document.getElementById('v97h-submit');
    if(!btn) return setTimeout(bindSubmit, 200);
    if(btn.getAttribute('data-v97j-bound') === '1') return;
    btn.setAttribute('data-v97j-bound','1');

    btn.onclick = async function(e){
      if(e) e.preventDefault();
      var emailEl = document.getElementById('v97h-email');
      var passEl = document.getElementById('v97h-password');
      if(!emailEl || !passEl) return;

      var email = emailEl.value.trim();
      var pass = passEl.value;
      if(!email || !pass){ showMsg('⚠️ أدخل البريد وكلمة المرور', 'err'); return; }
      if(email.indexOf('@') === -1){ showMsg('⚠️ بريد إلكتروني غير صالح', 'err'); return; }

      var auth = getAuth();
      if(!auth){
        showMsg('⚠️ Firebase لم يتهيأ — انتظر 3 ثوان وأعد المحاولة', 'err');
        return;
      }

      btn.disabled = true;
      var origText = btn.textContent;
      btn.textContent = '⏳ جاري التحقق...';
      showMsg('', '');

      var timeoutId = setTimeout(function(){
        btn.disabled = false;
        btn.textContent = origText || 'دخول →';
        showMsg('⏱️ انتهت المهلة — تحقق من الإنترنت وحاول مجدداً', 'err');
      }, 15000);

      try {
        await auth.signInWithEmailAndPassword(email, pass);
        clearTimeout(timeoutId);
        showMsg('✅ تم الدخول — جاري فتح اللوحة...', 'ok');
        btn.textContent = '✅ تم الدخول';
        setTimeout(function(){ location.reload(); }, 400);
      } catch(err) {
        clearTimeout(timeoutId);
        btn.disabled = false;
        btn.textContent = origText || 'دخول →';
        var msg = 'فشل الدخول';
        var c = err.code || '';
        if(c === 'auth/wrong-password' || c === 'auth/invalid-credential' || c === 'auth/invalid-login-credentials') msg = 'كلمة المرور خاطئة';
        else if(c === 'auth/user-not-found') msg = 'البريد غير مسجل';
        else if(c === 'auth/invalid-email') msg = 'بريد إلكتروني غير صالح';
        else if(c === 'auth/too-many-requests') msg = 'محاولات كثيرة — حاول بعد دقيقة';
        else if(c === 'auth/network-request-failed') msg = 'مشكلة اتصال — تحقق من الإنترنت';
        else if(c === 'auth/user-disabled') msg = 'الحساب موقوف';
        else if(err.message) msg = err.message;
        showMsg('❌ ' + msg, 'err');
        console.error('[V97J] login error:', err);
      }
    };

    console.log('[V97J] submit bound to new handler');
  }

  bindSubmit();
  setTimeout(bindSubmit, 1500);
  setTimeout(bindSubmit, 3000);
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97j patched. size:', h.length);
