const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v104-login-css"')) { console.log('⚠️ مطبق مسبقاً'); process.exit(0); }

// 1. الكود الجديد للدالة loginScreen
const oldFnStart = "loginScreen:function(){";
const oldFnEnd = "gateMsg:function(i,t,d){";
const startIdx = h.indexOf(oldFnStart);
const endIdx = h.indexOf(oldFnEnd);

if (startIdx === -1 || endIdx === -1) {
  console.log("❌ لم يتم العثور على دالة loginScreen");
  process.exit(1);
}

const newFn = `
  loginScreen:function(){
    document.getElementById('gb').innerHTML = 
      '<div class="v104-card">' +
        '<div class="v104-logo">CHIZEN</div>' +
        '<div class="v104-subtitle">ADMIN PANEL</div>' +
        '<div class="v104-icon">🔐</div>' +
        '<div class="v104-title">لوحة محمية</div>' +
        '<div class="v104-desc">سجّل دخول بحسابك الإداري</div>' +
        '<div class="v104-input-group">' +
          '<input id="login-email" type="email" placeholder="البريد الإلكتروني" autocomplete="username">' +
        '</div>' +
        '<div class="v104-input-group">' +
          '<input id="login-pass" type="password" placeholder="كلمة السر" autocomplete="current-password">' +
          '<span class="v104-eye" onclick="var p=document.getElementById(\\'login-pass\\'); if(p.type===\\'password\\'){p.type=\\'text\\';this.innerHTML=\\'🙈\\'}else{p.type=\\'password\\';this.innerHTML=\\'👁️\\'}">👁️</span>' +
        '</div>' +
        '<button id="btn-do-login" class="v104-btn" onclick="doLogin()">🔓 تسجيل الدخول</button>' +
        '<div id="login-err" class="v104-err"></div>' +
        '<button class="v104-btn-sec" onclick="location.reload()">🔄 إعادة تحميل</button>' +
      '</div>';

    setTimeout(function(){
      var passInp = document.getElementById('login-pass');
      if (passInp) passInp.addEventListener('keypress', function(e){
        if (e.key === 'Enter') doLogin();
      });
    }, 100);
  },
  
  `;

h = h.slice(0, startIdx) + newFn + h.slice(endIdx);

// 2. إضافة CSS
const css = `
<style id="v104-login-css">
/* الخلفية المتحركة */
body { background: #0a0825 !important; margin: 0; overflow: hidden; }
.v104-bg-anim {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #0a0825; z-index: -1; overflow: hidden;
}
.v104-bg-anim::before, .v104-bg-anim::after {
  content: ''; position: absolute; border-radius: 50%; filter: blur(80px);
  animation: float 10s infinite alternate ease-in-out;
}
.v104-bg-anim::before {
  width: 300px; height: 300px; background: rgba(124,58,237,0.3);
  top: -10%; left: -10%;
}
.v104-bg-anim::after {
  width: 250px; height: 250px; background: rgba(236,72,153,0.2);
  bottom: -10%; right: -10%; animation-delay: -5s;
}
@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 50px) scale(1.2); }
}

/* الحاوية الرئيسية */
#gb { display: flex; justify-content: center; align-items: center; height: 100vh; position: relative; z-index: 1; }

/* الكارت الزجاجي */
.v104-card {
  background: rgba(20, 15, 45, 0.6) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
  border-radius: 24px !important;
  padding: 40px 30px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  width: 90% !important; max-width: 380px !important;
  text-align: center !important;
  font-family: system-ui, -apple-system, sans-serif !important;
}

/* العناوين والشعار */
.v104-logo { font-size: 32px; font-weight: 900; color: #fff; letter-spacing: 2px; margin-bottom: 5px; text-shadow: 0 0 20px rgba(168,85,247,0.5); }
.v104-subtitle { font-size: 12px; letter-spacing: 4px; color: #a78bfa; margin-bottom: 30px; font-weight: 700; }
.v104-icon { font-size: 50px; margin-bottom: 15px; }
.v104-title { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.v104-desc { font-size: 13px; color: #a78bfa; margin-bottom: 30px; }

/* حقول الإدخال */
.v104-input-group { position: relative; margin-bottom: 15px; }
.v104-input-group input {
  width: 100%; box-sizing: border-box; background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1); color: #fff;
  border-radius: 12px; padding: 15px 15px; font-size: 14px; transition: 0.3s;
  font-family: inherit;
}
.v104-input-group input:focus { border-color: #a78bfa; box-shadow: 0 0 15px rgba(167, 139, 250, 0.2); outline: none; background: rgba(0, 0, 0, 0.5); }
.v104-input-group input::placeholder { color: rgba(255,255,255,0.4); }

/* أيقونة العين */
.v104-eye { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; opacity: 0.6; }
.v104-eye:hover { opacity: 1; }

/* الأزرار */
.v104-btn {
  background: linear-gradient(135deg, #7c3aed, #ec4899) !important; border: none !important; color: #fff !important;
  padding: 16px !important; border-radius: 12px !important; font-size: 15px !important; font-weight: 800 !important;
  cursor: pointer !important; width: 100% !important; margin-top: 10px !important;
  box-shadow: 0 8px 20px rgba(124,58,237,0.4) !important; transition: transform 0.2s !important;
  font-family: inherit !important;
}
.v104-btn:active { transform: scale(0.97) !important; }
.v104-btn-sec {
  background: transparent !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #fff !important;
  padding: 12px !important; border-radius: 12px !important; font-size: 13px !important; width: 100% !important;
  margin-top: 15px !important; cursor: pointer !important; font-family: inherit !important; opacity: 0.7;
}
.v104-btn-sec:hover { opacity: 1; }

/* رسالة الخطأ */
.v104-err { color: #f87171 !important; font-size: 12px !important; min-height: 16px !important; margin-top: 10px !important; font-weight: bold; }
</style>
`;

// حقن الخلفية المتحركة في body، وحقن CSS في head
const bodyTagIdx = h.indexOf('<body');
if (bodyTagIdx !== -1) {
  const bodyEndIdx = h.indexOf('>', bodyTagIdx) + 1;
  h = h.slice(0, bodyEndIdx) + '\n<div class="v104-bg-anim"></div>\n' + h.slice(bodyEndIdx);
}
const headEndIdx = h.indexOf('</head>');
if (headEndIdx !== -1) {
  h = h.slice(0, headEndIdx) + css + h.slice(headEndIdx);
}

fs.writeFileSync('index.html', h);
console.log('✅ تم بناء شاشة الدخول v104 بنجاح |', before, '->', h.length);
