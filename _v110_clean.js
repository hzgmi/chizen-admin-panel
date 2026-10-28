const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف كل الأكواد القديمة (v103 إلى v108)
const killList = ['v103-login-css', 'v103-login-js', 'v104-login-css', 'v105-login-css', 'v105-login-js', 'v106-css', 'v106-js', 'v108-css', 'v108-js'];
killList.forEach(id => {
  let s1 = `<style id="${id}">`; let e1 = `</style>`;
  let i = h.indexOf(s1);
  while(i !== -1) { let end = h.indexOf(e1, i); if(end !== -1) h = h.slice(0, i) + h.slice(end + e1.length); i = h.indexOf(s1); }
  let s2 = `<script id="${id}">`; let e2 = `</script>`;
  i = h.indexOf(s2);
  while(i !== -1) { let end = h.indexOf(e2, i); if(end !== -1) h = h.slice(0, i) + h.slice(end + e2.length); i = h.indexOf(s2); }
});

// 2. حذف الـ HTML الخاص بـ v105 إن وجد
let start = h.indexOf('<div id="v105-overlay">');
if(start !== -1) {
    let end = h.indexOf('<script id="v105-login-js">', start);
    if(end !== -1) h = h.slice(0, start) + h.slice(end);
}

// 3. تعطيل دالة الدخول القديمة تماماً
let loginStart = h.indexOf('loginScreen:function(){');
if(loginStart !== -1) {
    let loginEnd = h.indexOf('gateMsg:function', loginStart);
    if(loginEnd !== -1) {
        h = h.slice(0, loginStart) + `loginScreen:function(){ if(document.getElementById('v110-overlay')){ document.getElementById('v110-overlay').style.display='flex'; document.getElementById('gb').style.display='none'; } },\n\n  ` + h.slice(loginEnd);
    }
}

// 4. حقن الشاشة الجديدة النظيفة v110
const v110 = `
<style id="v110-css">
#gb { display: none !important; }
body { margin: 0; background: #0a0825; font-family: system-ui, -apple-system, sans-serif; }
#v110-overlay {
    position: fixed; inset: 0; z-index: 9999999;
    display: flex; justify-content: center; align-items: center;
    background: #0a0825;
}
#v110-overlay::before, #v110-overlay::after {
    content: ''; position: absolute; border-radius: 50%; filter: blur(80px); z-index: -1;
    animation: float110 10s infinite alternate ease-in-out;
}
#v110-overlay::before { width: 300px; height: 300px; background: rgba(124,58,237,0.4); top: -10%; left: -10%; }
#v110-overlay::after { width: 250px; height: 250px; background: rgba(236,72,153,0.3); bottom: -10%; right: -10%; animation-delay: -5s; }
@keyframes float110 { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(50px,50px) scale(1.2); } }
.v110-card {
    background: rgba(20, 15, 45, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 24px; padding: 40px 30px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    width: 90%; max-width: 380px; text-align: center; color: #fff;
}
.v110-logo { font-size: 32px; font-weight: 900; letter-spacing: 2px; margin-bottom: 5px; text-shadow: 0 0 20px rgba(168,85,247,0.5); }
.v110-subtitle { font-size: 12px; letter-spacing: 4px; color: #a78bfa; margin-bottom: 30px; font-weight: 700; }
.v110-icon { font-size: 50px; margin-bottom: 15px; }
.v110-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
.v110-desc { font-size: 13px; color: #a78bfa; margin-bottom: 30px; }
.v110-input-group { position: relative; margin-bottom: 15px; }
.v110-input-group input {
    width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1); color: #fff;
    border-radius: 12px; padding: 15px; font-size: 14px; transition: 0.3s; font-family: inherit;
}
.v110-input-group input:focus { border-color: #a78bfa; box-shadow: 0 0 15px rgba(167,139,250,0.2); outline: none; background: rgba(0,0,0,0.5); }
.v110-input-group input::placeholder { color: rgba(255,255,255,0.4); }
.v110-eye { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; opacity: 0.6; }
.v110-btn {
    background: linear-gradient(135deg, #7c3aed, #ec4899); border: none; color: #fff;
    padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 800;
    cursor: pointer; width: 100%; margin-top: 10px; box-shadow: 0 8px 20px rgba(124,58,237,0.4);
    transition: transform 0.2s; font-family: inherit;
}
.v110-btn:active { transform: scale(0.97); }
.v110-err { color: #f87171; font-size: 12px; min-height: 16px; margin-top: 10px; font-weight: bold; }
</style>

<div id="v110-overlay">
  <div class="v110-card">
    <div class="v110-logo">CHIZEN</div>
    <div class="v110-subtitle">ADMIN PANEL</div>
    <div class="v110-icon">🔐</div>
    <div class="v110-title">لوحة محمية</div>
    <div class="v110-desc">سجّل دخول بحسابك الإداري</div>
    <div class="v110-input-group">
      <input id="v110-email" type="email" placeholder="البريد الإلكتروني">
    </div>
    <div class="v110-input-group">
      <input id="v110-pass" type="password" placeholder="كلمة السر">
      <span class="v110-eye" onclick="var p=document.getElementById('v110-pass'); if(p.type==='password'){p.type='text';this.innerHTML='🙈'}else{p.type='password';this.innerHTML='👁️'}">👁️</span>
    </div>
    <button id="v110-btn" class="v110-btn" onclick="v110_login()">🔓 تسجيل الدخول</button>
    <div id="v110-err" class="v110-err"></div>
  </div>
</div>

<script id="v110-js">
window.v110_login = function() {
  var email = document.getElementById('v110-email').value.trim();
  var pass = document.getElementById('v110-pass').value;
  var btn = document.getElementById('v110-btn');
  var err = document.getElementById('v110-err');
  if(!email || !pass) { err.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }
  btn.disabled = true; btn.textContent = '⏳ جاري الدخول...'; err.textContent = '';
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(function() { return firebase.auth().signInWithEmailAndPassword(email, pass); })
    .then(function(userCred) { window.location.reload(); })
    .catch(function(error) {
      btn.disabled = false; btn.textContent = '🔓 تسجيل الدخول';
      err.textContent = '❌ خطأ: ' + (error.message || 'تحقق من البيانات');
    });
};
document.getElementById('v110-pass').addEventListener('keypress', function(e) { if (e.key === 'Enter') v110_login(); });
if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged(function(user) {
        var overlay = document.getElementById('v110-overlay');
        var gb = document.getElementById('gb');
        if (user) {
            if(overlay) overlay.style.setProperty('display', 'none', 'important');
            if(gb) gb.style.setProperty('display', 'block', 'important');
        } else {
            if(overlay) overlay.style.setProperty('display', 'flex', 'important');
            if(gb) gb.style.setProperty('display', 'none', 'important');
        }
    });
}
</script>
`;

const bodyIdx = h.lastIndexOf('</body>');
h = h.slice(0, bodyIdx) + v110 + h.slice(bodyIdx);

fs.writeFileSync('index.html', h);
console.log('✅ تم تنظيف كل الأكواد القديمة وبناء v110 |', before, '->', h.length);
