const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف كل الأكواد التي أضفناها في الجلسة الحالية وكسرت النظام
const killList = [
  'v110-css', 'v110-js', 'v118-bypass', 'v119-smart-login',
  'v120-css', 'v120-js', 'v121-stop-reset', 'v122-ultimate-kill', 'v114-final-fix'
];
killList.forEach(id => {
  let s1 = `<style id="${id}">`; let e1 = `</style>`;
  let i = h.indexOf(s1);
  while(i !== -1) { let end = h.indexOf(e1, i); if(end !== -1) h = h.slice(0, i) + h.slice(end + e1.length); i = h.indexOf(s1); }
  let s2 = `<script id="${id}">`; let e2 = `</script>`;
  i = h.indexOf(s2);
  while(i !== -1) { let end = h.indexOf(e2, i); if(end !== -1) h = h.slice(0, i) + h.slice(end + e2.length); i = h.indexOf(s2); }
});

// 2. حذف Overlay القديم
h = h.replace(/<div id="v110-overlay">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');

// 3. استبدال دالة loginScreen لتبني الشاشة الجميلة داخل #gs الأصلية
const oldLoginStart = "loginScreen:function(){";
const oldLoginEnd = "gateMsg:function(i,t,d){";
const lStart = h.indexOf(oldLoginStart);
const lEnd = h.indexOf(oldLoginEnd);

if (lStart !== -1 && lEnd !== -1) {
  const newLogin = `
  loginScreen:function(){
    var gs = document.getElementById('gs');
    if (gs) {
      gs.style.display = 'block';
      gs.innerHTML = '<div class="v123-bg"></div>' +
        '<div class="v123-card">' +
          '<div class="v123-logo">CHIZEN</div>' +
          '<div class="v123-subtitle">ADMIN PANEL</div>' +
          '<div class="v123-icon">🔐</div>' +
          '<div class="v123-title">لوحة محمية</div>' +
          '<div class="v123-desc">سجّل دخول بحسابك الإداري</div>' +
          '<div class="v123-input-group"><input id="login-email" type="email" placeholder="البريد الإلكتروني" autocomplete="username"></div>' +
          '<div class="v123-input-group">' +
            '<input id="login-pass" type="password" placeholder="كلمة السر" autocomplete="current-password">' +
            '<span class="v123-eye" onclick="var p=document.getElementById(\\'login-pass\\'); if(p.type===\\'password\\'){p.type=\\'text\\';this.innerHTML=\\'🙈\\'}else{p.type=\\'password\\';this.innerHTML=\\'👁️\\'}">👁️</span>' +
          '</div>' +
          '<button id="btn-do-login" class="v123-btn" onclick="doLogin()">🔓 تسجيل الدخول</button>' +
          '<div id="login-err" class="v123-err"></div>' +
          '<button class="v123-btn-sec" onclick="location.reload()">🔄 تحديث</button>' +
        '</div>';
      setTimeout(function(){
        var passInp = document.getElementById('login-pass');
        if (passInp) passInp.addEventListener('keypress', function(e){
          if (e.key === 'Enter') doLogin();
        });
      }, 100);
    }
    var am = document.getElementById('am');
    if (am) am.style.display = 'none';
  },

  `;
  h = h.slice(0, lStart) + newLogin + h.slice(lEnd);
  console.log('✅ تم استبدال loginScreen');
}

// 4. إضافة CSS
const css = `
<style id="v123-css">
#gs { background: #0a0825 !important; overflow: hidden; display: block; position: fixed; inset: 0; z-index: 99999; }
.v123-bg { position: absolute; inset: 0; z-index: 0; }
.v123-bg::before, .v123-bg::after {
  content: ''; position: absolute; border-radius: 50%; filter: blur(80px); animation: v123float 10s infinite alternate ease-in-out;
}
.v123-bg::before { width: 300px; height: 300px; background: rgba(124,58,237,0.4); top: -10%; left: -10%; }
.v123-bg::after { width: 250px; height: 250px; background: rgba(236,72,153,0.3); bottom: -10%; right: -10%; animation-delay: -5s; }
@keyframes v123float { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(50px,50px) scale(1.2); } }
.v123-card {
  position: relative; z-index: 10;
  background: rgba(20, 15, 45, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 24px; padding: 40px 30px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  width: 90%; max-width: 380px; margin: 10vh auto; text-align: center; color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}
.v123-logo { font-size: 32px; font-weight: 900; letter-spacing: 2px; margin-bottom: 5px; text-shadow: 0 0 20px rgba(168,85,247,0.5); color: #fff; }
.v123-subtitle { font-size: 12px; letter-spacing: 4px; color: #a78bfa; margin-bottom: 30px; font-weight: 700; }
.v123-icon { font-size: 50px; margin-bottom: 15px; }
.v123-title { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #fff; }
.v123-desc { font-size: 13px; color: #a78bfa; margin-bottom: 30px; }
.v123-input-group { position: relative; margin-bottom: 15px; }
.v123-input-group input {
  width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1); color: #fff;
  border-radius: 12px; padding: 15px; font-size: 14px; transition: 0.3s; font-family: inherit;
}
.v123-input-group input:focus { border-color: #a78bfa; box-shadow: 0 0 15px rgba(167,139,250,0.2); outline: none; background: rgba(0,0,0,0.5); }
.v123-input-group input::placeholder { color: rgba(255,255,255,0.4); }
.v123-eye { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; opacity: 0.6; }
.v123-btn {
  background: linear-gradient(135deg, #7c3aed, #ec4899); border: none; color: #fff;
  padding: 16px; border-radius: 12px; font-size: 15px; font-weight: 800;
  cursor: pointer; width: 100%; margin-top: 10px; box-shadow: 0 8px 20px rgba(124,58,237,0.4);
  transition: transform 0.2s; font-family: inherit;
}
.v123-btn:active { transform: scale(0.97); }
.v123-btn-sec {
  background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff;
  padding: 12px; border-radius: 12px; font-size: 13px; width: 100%;
  margin-top: 15px; cursor: pointer; font-family: inherit; opacity: 0.7;
}
.v123-err { color: #f87171; font-size: 12px; min-height: 16px; margin-top: 10px; font-weight: bold; }
</style>
`;
if (!h.includes('id="v123-css"')) {
  h = h.replace('</head>', css + '\n</head>');
}

fs.writeFileSync('index.html', h);
console.log('✅ تم التنظيف التام | الحجم:', before, '->', h.length);
