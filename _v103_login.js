const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v103-login-css"')) { console.log('⚠️ مطبق مسبقاً'); process.exit(0); }

const css = `
<style id="v103-login-css">
/* الخلفية المتحركة */
.v103-bg {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #0a0825; z-index: -1; overflow: hidden;
}
.v103-bg::before, .v103-bg::after {
  content: ''; position: absolute; border-radius: 50%; filter: blur(80px);
  animation: float 10s infinite alternate ease-in-out;
}
.v103-bg::before {
  width: 300px; height: 300px; background: rgba(124,58,237,0.4);
  top: -10%; left: -10%;
}
.v103-bg::after {
  width: 250px; height: 250px; background: rgba(236,72,153,0.3);
  bottom: -10%; right: -10%; animation-delay: -5s;
}
@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 50px) scale(1.2); }
}

/* الكارت الزجاجي */
.v103-card {
  background: rgba(20, 15, 45, 0.6) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
  border-radius: 24px !important;
  padding: 40px 30px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  width: 90% !important; max-width: 400px !important;
  margin: 10vh auto !important;
  position: relative !important;
  z-index: 10 !important;
  color: #fff !important;
  font-family: system-ui, -apple-system, sans-serif !important;
}

/* العناوين */
.v103-card h1, .v103-card h2, .v103-card .title { color: #fff !important; text-align: center !important; margin-bottom: 30px !important; font-size: 24px !important; }
.v103-card p, .v103-card span { color: #a78bfa !important; }

/* حقول الإدخال */
.v103-input-group { position: relative; margin-bottom: 20px; }
.v103-input-group input {
  width: 100% !important; box-sizing: border-box !important;
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  border-radius: 12px !important;
  padding: 16px 45px 16px 16px !important;
  font-size: 15px !important;
  transition: all 0.3s !important;
}
.v103-input-group input:focus {
  border-color: #a78bfa !important;
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.3) !important;
  outline: none !important;
  background: rgba(0, 0, 0, 0.6) !important;
}
.v103-input-group input::placeholder { color: rgba(255,255,255,0.4) !important; }

/* أيقونة العين */
.v103-eye {
  position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
  cursor: pointer; font-size: 20px; opacity: 0.7; transition: 0.2s;
}
.v103-eye:hover { opacity: 1; }

/* زر الدخول */
.gbtn, #btn-do-login {
  background: linear-gradient(135deg, #7c3aed, #ec4899) !important;
  border: none !important; color: #fff !important;
  padding: 16px !important; border-radius: 12px !important;
  font-size: 16px !important; font-weight: 800 !important;
  cursor: pointer !important; width: 100% !important;
  box-shadow: 0 8px 20px rgba(124,58,237,0.4) !important;
  transition: transform 0.2s, box-shadow 0.2s !important;
}
.gbtn:active, #btn-do-login:active { transform: scale(0.97) !important; box-shadow: 0 4px 10px rgba(124,58,237,0.4) !important; }
</style>
`;

const js = `
<script id="v103-login-js">
document.addEventListener('DOMContentLoaded', function() {
  // 1. إضافة الخلفية المتحركة
  if (!document.querySelector('.v103-bg')) {
    var bg = document.createElement('div');
    bg.className = 'v103-bg';
    document.body.appendChild(bg);
  }

  // 2. البحث عن زر الدخول لتحديد الكارت
  setTimeout(function() {
    var btn = document.getElementById('btn-do-login') || document.querySelector('.gbtn');
    if (!btn) return;

    // إيجاد الحاوية الأصلية (الكارت)
    var card = btn.closest('div') || btn.parentElement;
    if (!card || card.classList.contains('v103-card')) return;

    // تطبيق كلاس الزجاج
    card.classList.add('v103-card');

    // تنسيق الحقول وإضافة أيقونة العين
    var inputs = card.querySelectorAll('input');
    inputs.forEach(function(inp) {
      if (inp.type === 'password' || inp.type === 'email' || inp.type === 'text') {
        var wrapper = document.createElement('div');
        wrapper.className = 'v103-input-group';
        inp.parentNode.insertBefore(wrapper, inp);
        wrapper.appendChild(inp);
        if (inp.type === 'password') {
          var eye = document.createElement('span');
          eye.className = 'v103-eye';
          eye.innerHTML = '👁️';
          eye.onclick = function() {
            if (inp.type === 'password') { inp.type = 'text'; eye.innerHTML = '🙈'; }
            else { inp.type = 'password'; eye.innerHTML = '👁️'; }
          };
          wrapper.appendChild(eye);
        }
      }
    });
    
    // تنسيق النصوص
    card.querySelectorAll('h1, h2, h3').forEach(function(h){ h.style.color = '#fff'; h.style.textAlign = 'center'; h.style.marginBottom = '25px'; });
  }, 500); // تأخير بسيط لضمان بناء الصفحة
});
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + css + js + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم حقن شاشة الدخول الجديدة v103 |', before, '->', h.length);
