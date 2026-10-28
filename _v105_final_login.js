const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف أكواد v103 و v104 المكسورة
const killList = ['v103-login-css', 'v103-login-js', 'v104-login-css'];
killList.forEach(id => {
  let tag = `<style id="${id}"`;
  let startIdx = h.indexOf(tag);
  while (startIdx !== -1) {
    let endIdx = h.indexOf('</style>', startIdx);
    if (endIdx !== -1) h = h.slice(0, startIdx) + h.slice(endIdx + 8);
    else break;
    startIdx = h.indexOf(tag);
  }
  tag = `<script id="${id}"`;
  startIdx = h.indexOf(tag);
  while (startIdx !== -1) {
    let endIdx = h.indexOf('</script>', startIdx);
    if (endIdx !== -1) h = h.slice(0, startIdx) + h.slice(endIdx + 9);
    else break;
    startIdx = h.indexOf(tag);
  }
});

// 2. كود الشاشة الجديدة v105
const v105 = `
<style id="v105-login-css">
/* إخفاء الواجهة القديمة حتى يتم تسجيل الدخول */
#gb { display: none !important; }
body { margin: 0; background: #0a0825; overflow: hidden; }

#v105-overlay {
  position: fixed; inset: 0; z-index: 9999999;
  display: flex; justify-content: center; align-items: center;
  background: #0a0825; font-family: system-ui, -apple-system, sans-serif;
}
#v105-overlay::before, #v105-overlay::after {
  content: ''; position: absolute; border-radius: 50%; filter: blur(80px); z-index: -1;
  animation: v105float 10s infinite alternate ease-in-out;
}
#v105-overlay::before { width: 300px; height: 300px; background: rgba(124,58,237,0.4); top: -10%; left: -10%; }
#v105-overlay::after { width: 250px; height: 250px; background: rgba(236,72,153,0.3); bottom: -10%; right: -10%; animation-delay: -5s; }
@keyframes v105float { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(50px,50px) scale(1.2); } }

.v105-card {
  background: rgba(20, 15, 45, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 24px; padding: 40px 30px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  width: 90%; max-width: 380px; text-align: center; color: #fff;
}
.v105-logo { font-size: 32px; font-weight: 900; letter-spacing: 2px; margin-bottom: 5px; text-shadow: 0 0 20px rgba(168,85,247,0.5); }
.v105-subtitle { font-size: 12px; letter-spacing: 4px; color: #a78bfa; margin-bottom: 30px; font-weight: 700; }
.v105-icon { font-size: 50px; margin-bottom: 15px; }
.v105-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
.v105-desc { font-size: 13px; color: #a78bfa; margin-bottom: 30px; }

.v105-input-group { position: relative; margin-bottom: 15px; }
.v105-input-group input {
  width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1); color: #fff;
  border-radius: 12px; padding: 15px; font-size: 14px; transition: 0.3s; font-family: inherit;
}
.v105-input-group input:focus { border-color: #a78bfa; box-shadow: 0 0 15px rgba(167,139,250,0.2); outline: none; background: rgba(0,0,0,0.5); }
.v105-input-group input::placeholder { color: rgba(255,255,255,0.4); }
.v105-eye { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; opacity: 0.6; }

.v105-btn {
  background: linear-gradient(135deg, #7c3aed, #ec4899); border: none; color: #fff;
  padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 800;
  cursor: pointer; width: 100%; margin-top: 10px; box-shadow: 0 8px 20px rgba(124,58,237,0.4);
  transition: transform 0.2s; font-family: inherit;
}
.v105-btn:active { transform: scale(0.97); }
.v105-err { color: #f87171; font-size: 12px; min-height: 16px; margin-top: 10px; font-weight: bold; }
</style>

<div id="v105-overlay">
  <div class="v105-card">
    <div class="v105-logo">CHIZEN</div>
    <div class="v105-subtitle">ADMIN PANEL</div>
    <div class="v105-icon">🔐</div>
    <div class="v105-title">لوحة محمية</div>
    <div class="v105-desc">سجّل دخول بحسابك الإداري</div>
    
    <div class="v105-input-group">
      <input id="v105-email" type="email" placeholder="البريد الإلكتروني">
    </div>
    <div class="v105-input-group">
      <input id="v105-pass" type="password" placeholder="كلمة السر">
      <span class="v105-eye" onclick="var p=document.getElementById('v105-pass'); if(p.type==='password'){p.type='text';this.innerHTML='🙈'}else{p.type='password';this.innerHTML='👁️'}">👁️</span>
    </div>
    
    <button id="v105-btn" class="v105-btn" onclick="v105_login()">🔓 تسجيل الدخول</button>
    <div id="v105-err" class="v105-err"></div>
  </div>
</div>

<script id="v105-login-js">
window.v105_login = function() {
  var email = document.getElementById('v105-email').value.trim();
  var pass = document.getElementById('v105-pass').value;
  var btn = document.getElementById('v105-btn');
  var err = document.getElementById('v105-err');
  
  if(!email || !pass) { err.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }
  
  btn.disabled = true; btn.textContent = '⏳ جاري الدخول...'; err.textContent = '';
  
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(function(userCred) {
      // بمجرد النجاح، نخفي الشاشة ونظهر اللوحة
      document.getElementById('v105-overlay').style.display = 'none';
      document.getElementById('gb').style.display = 'block';
      // إعادة تحميل خفيفة لتشغيل سكربتات الإدارة
      window.location.reload();
    })
    .catch(function(error) {
      btn.disabled = false; btn.textContent = '🔓 تسجيل الدخول';
      err.textContent = '❌ خطأ: ' + (error.message || 'تحقق من البيانات');
    });
};

document.getElementById('v105-pass').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') v105_login();
});

// التحقق من حالة الدخول عند تحميل الصفحة
setTimeout(function() {
  if (firebase.auth().currentUser) {
    document.getElementById('v105-overlay').style.display = 'none';
    document.getElementById('gb').style.display = 'block';
  } else {
    document.getElementById('v105-overlay').style.display = 'flex';
  }
}, 500);
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v105 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم بناء شاشة الدخول v105 من الصفر |', before, '->', h.length);
