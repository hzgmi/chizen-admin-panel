const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97H_LOGIN -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<style id="v97h-css">
#v97h-login { position:fixed; inset:0; z-index:9999999; background:radial-gradient(circle at 50% 0%, #1a0f3d 0%, #0a0825 70%); display:none; align-items:center; justify-content:center; padding:20px; direction:rtl; font-family:'Tajawal','Cairo',system-ui,sans-serif; overflow-y:auto; animation:v97hFade 0.35s ease-out; }
#v97h-login * { box-sizing:border-box; }
#v97h-login .v97h-card { width:100%; max-width:400px; margin:auto; }
#v97h-login .v97h-logo-wrap { text-align:center; margin-bottom:28px; }
#v97h-login .v97h-logo { display:inline-block; padding:18px 30px; background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%); border-radius:24px; font-size:26px; font-weight:900; letter-spacing:3px; color:#fff; box-shadow:0 12px 40px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.25); }
#v97h-login .v97h-sub { color:#a78bfa; font-size:13px; margin-top:10px; letter-spacing:1px; }
#v97h-login .v97h-form { background:rgba(30,21,51,0.7); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(168,85,247,0.3); border-radius:24px; padding:26px; box-shadow:0 20px 60px rgba(0,0,0,0.5); }
#v97h-login .v97h-form h2 { margin:0 0 22px; color:#fff; font-size:19px; text-align:center; font-weight:700; }
#v97h-login .v97h-field { margin-bottom:16px; position:relative; }
#v97h-login .v97h-field label { display:block; color:#a78bfa; font-size:12px; font-weight:700; margin-bottom:7px; letter-spacing:0.3px; }
#v97h-login .v97h-field input { width:100%; padding:14px 16px; border-radius:12px; border:1.5px solid rgba(168,85,247,0.3); background:rgba(10,8,37,0.85); color:#fff; font-family:inherit; font-size:14px; transition:all 0.2s; }
#v97h-login .v97h-field input:focus { outline:none; border-color:#a855f7; box-shadow:0 0 0 3px rgba(168,85,247,0.2); background:rgba(10,8,37,1); }
#v97h-login .v97h-field input::placeholder { color:#6b7280; }
#v97h-login .v97h-pass-wrap { position:relative; }
#v97h-login .v97h-pass-wrap input { padding-left:46px; }
#v97h-login .v97h-toggle { position:absolute; left:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:#a78bfa; cursor:pointer; font-size:18px; padding:6px; border-radius:8px; }
#v97h-login .v97h-toggle:active { background:rgba(168,85,247,0.15); }
#v97h-login .v97h-btn { width:100%; padding:16px; border:none; border-radius:12px; background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%); color:#fff; font-family:inherit; font-size:16px; font-weight:900; cursor:pointer; box-shadow:0 8px 24px rgba(168,85,247,0.4); transition:all 0.2s; margin-top:6px; }
#v97h-login .v97h-btn:active:not(:disabled) { transform:scale(0.98); box-shadow:0 4px 12px rgba(168,85,247,0.3); }
#v97h-login .v97h-btn:disabled { opacity:0.6; cursor:not-allowed; }
#v97h-login .v97h-msg { padding:12px 14px; border-radius:10px; margin-bottom:16px; font-size:13px; text-align:center; display:none; line-height:1.5; }
#v97h-login .v97h-msg.err { background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; display:block; }
#v97h-login .v97h-msg.ok { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.4); color:#86efac; display:block; }
#v97h-login .v97h-footer { text-align:center; margin-top:20px; color:#6b7280; font-size:11px; line-height:1.8; }
#v97h-login .v97h-link { color:#a78bfa; text-decoration:none; cursor:pointer; font-weight:700; }
#v97h-login .v97h-link:hover { text-decoration:underline; }
@keyframes v97hFade { from { opacity:0; transform:scale(1.02); } to { opacity:1; transform:scale(1); } }
</style>

<div id="v97h-login">
  <div class="v97h-card">
    <div class="v97h-logo-wrap">
      <div class="v97h-logo">CHIZEN</div>
      <div class="v97h-sub">لوحة الإدارة · Admin Panel</div>
    </div>
    <div class="v97h-form">
      <h2>🔐 تسجيل الدخول</h2>
      <div id="v97h-msg" class="v97h-msg"></div>
      <div class="v97h-field">
        <label>📧 البريد الإلكتروني</label>
        <input id="v97h-email" type="email" placeholder="admin@chizen.com" autocomplete="username" autocapitalize="off" spellcheck="false">
      </div>
      <div class="v97h-field">
        <label>🔒 كلمة المرور</label>
        <div class="v97h-pass-wrap">
          <input id="v97h-password" type="password" placeholder="••••••••" autocomplete="current-password">
          <button type="button" id="v97h-toggle" class="v97h-toggle" aria-label="إظهار كلمة المرور">👁️</button>
        </div>
      </div>
      <button id="v97h-submit" class="v97h-btn">دخول →</button>
    </div>
    <div class="v97h-footer">
      CHIZEN Admin v3.1 · <span class="v97h-link" onclick="location.href='https://hzgmi.github.io/chizen-app/'">تطبيق العميل ←</span><br>
      <span class="v97h-link" onclick="location.href='reset.html'">🔄 مسح الكاش (عند الحاجة)</span>
    </div>
  </div>
</div>

<script id="chz-new-login-v97h">
(function(){
  'use strict';
  console.log('[V97H] new login loading...');
  var tries = 0;
  var overlay = document.getElementById('v97h-login');
  var auth = null;

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

  function waitAuth(){
    tries++;
    auth = getAuth();
    if(!auth){
      if(tries > 100){
        if(overlay) overlay.style.display = 'flex';
        showMsg('⚠️ تعذر الاتصال بـ Firebase — حدّث الصفحة', 'err');
        return;
      }
      return setTimeout(waitAuth, 150);
    }
    if(overlay) overlay.style.display = 'flex';
    document.getElementById('v97h-email').focus();
    auth.onAuthStateChanged(function(user){
      if(user){
        if(overlay) overlay.style.display = 'none';
      } else {
        if(overlay) overlay.style.display = 'flex';
        showMsg('', '');
      }
    });
    console.log('[V97H] auth ready');
  }

  function submit(){
    var email = document.getElementById('v97h-email').value.trim();
    var pass = document.getElementById('v97h-password').value;
    var btn = document.getElementById('v97h-submit');
    if(!email || !pass){ showMsg('⚠️ أدخل البريد وكلمة المرور', 'err'); return; }
    if(email.indexOf('@') === -1){ showMsg('⚠️ بريد إلكتروني غير صالح', 'err'); return; }
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحقق...';
    showMsg('', '');
    auth.signInWithEmailAndPassword(email, pass)
      .then(function(){
        showMsg('✅ تم الدخول — جاري التحميل...', 'ok');
      })
      .catch(function(err){
        btn.disabled = false;
        btn.textContent = 'دخول →';
        var msg = 'فشل الدخول';
        var c = err.code || '';
        if(c === 'auth/wrong-password' || c === 'auth/invalid-credential') msg = 'كلمة المرور خاطئة';
        else if(c === 'auth/user-not-found') msg = 'البريد غير مسجل';
        else if(c === 'auth/invalid-email') msg = 'بريد إلكتروني غير صالح';
        else if(c === 'auth/too-many-requests') msg = 'محاولات كثيرة — حاول بعد دقيقة';
        else if(c === 'auth/network-request-failed') msg = 'مشكلة اتصال — تحقق من الإنترنت';
        else if(c === 'auth/user-disabled') msg = 'الحساب موقوف';
        else if(err.message) msg = err.message;
        showMsg('❌ ' + msg, 'err');
      });
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'v97h-submit') submit();
    if(e.target && e.target.id === 'v97h-toggle'){
      var p = document.getElementById('v97h-password');
      if(p){
        p.type = p.type === 'password' ? 'text' : 'password';
        e.target.textContent = p.type === 'password' ? '👁️' : '🙈';
      }
    }
  });

  document.addEventListener('keypress', function(e){
    if(e.key === 'Enter' && document.activeElement && document.activeElement.id && document.activeElement.id.indexOf('v97h-') === 0){
      submit();
    }
  });

  waitAuth();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97h patched. size:', h.length);
